import { openai } from "@workspace/integrations-openai-ai-server";

export async function generatePracticeQuestions(
  topic: string,
  topicCode: string,
  count: number = 3
): Promise<string[]> {
  const topicLabel = topicCode ? `${topic} (${topicCode})` : topic;

  const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "You are a university exam question generator. Return ONLY a numbered list of questions, one per line. No preamble, no commentary, just the questions.",
      },
      {
        role: "user",
        content: `Generate ${count} university exam questions for the topic: "${topicLabel}". Mix short-answer and essay style. Be specific and exam-focused.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  if (!raw.trim()) {
    return defaultQuestions(topic, count);
  }

  const lines = raw
    .split("\n")
    .map(l => l.replace(/^\s*\d+[\.\)]\s*/, "").replace(/^\s*[-*•]\s*/, "").trim())
    .filter(l => l.length > 10 && !l.match(/^(here|below|following|questions?):?$/i));

  if (lines.length === 0) return defaultQuestions(topic, count);
  return lines.slice(0, count);
}

export async function generateExpectedPaper(topics: string[]): Promise<
  Array<{ number: number; question: string; topic: string; marks: number }>
> {
  const topicList = topics.slice(0, 5).join(", ");
  const marksList = [10, 8, 15, 5, 12];

  const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "You are a university exam paper designer. Generate realistic, exam-appropriate questions.",
      },
      {
        role: "user",
        content: `Generate one exam question each for these ${topics.slice(0, 5).length} topics: ${topicList}.

Format your response EXACTLY like this, one question per topic:
Q1. [question for topic 1] [${marksList[0]} marks]
Q2. [question for topic 2] [${marksList[1]} marks]
Q3. [question for topic 3] [${marksList[2]} marks]
Q4. [question for topic 4] [${marksList[3]} marks]
Q5. [question for topic 5] [${marksList[4]} marks]

Keep each question clear and specific.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  if (!raw.trim()) {
    return topics.slice(0, 5).map((t, i) => ({
      number: i + 1,
      question: `Explain the key concepts of ${t} with relevant examples. Discuss its practical applications.`,
      topic: t,
      marks: marksList[i] ?? 10,
    }));
  }

  const lines = raw
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.match(/^Q?\d+[\.\)]/i));

  if (lines.length === 0) {
    // Try splitting by double newlines or any non-empty lines
    const fallbackLines = raw
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 20);

    return fallbackLines.slice(0, 5).map((q, i) => ({
      number: i + 1,
      question: q.replace(/^Q?\d+[\.\):\s]+/i, "").trim(),
      topic: topics[i] ?? "",
      marks: marksList[i] ?? 10,
    }));
  }

  return lines.slice(0, 5).map((line, i) => ({
    number: i + 1,
    question: line
      .replace(/^Q?\d+[\.\):\s]+/i, "")
      .replace(/\[\d+\s*marks?\]/i, "")
      .trim(),
    topic: topics[i] ?? "",
    marks: marksList[i] ?? 10,
  }));
}

function defaultQuestions(topic: string, count: number): string[] {
  return [
    `Define ${topic} and explain its core principles with examples.`,
    `Discuss the real-world applications and importance of ${topic}.`,
    `Compare and contrast different approaches or methods in ${topic}.`,
    `What are the key challenges and solutions associated with ${topic}?`,
    `Explain how ${topic} has evolved and its future implications.`,
  ].slice(0, count);
}
