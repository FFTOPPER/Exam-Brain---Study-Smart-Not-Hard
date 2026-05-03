import { openai } from "@workspace/integrations-openai-ai-server";

export async function generatePracticeQuestions(
  topic: string,
  topicCode: string,
  count: number = 3
): Promise<string[]> {
  const topicLabel = topicCode ? `${topic} (${topicCode})` : topic;

  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a university exam question generator. Generate concise, exam-style questions. Return ONLY a numbered list of questions, no preamble or commentary.",
      },
      {
        role: "user",
        content: `Generate ${count} university exam questions for the topic: "${topicLabel}". Keep them simple, specific, and exam-focused. Mix short answer and essay style.`,
      },
    ],
    max_completion_tokens: 400,
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const lines = raw
    .split("\n")
    .map(l => l.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(l => l.length > 10);

  return lines.slice(0, count);
}

export async function generateExpectedPaper(topics: string[]): Promise<
  Array<{ number: number; question: string; topic: string; marks: number }>
> {
  const topicList = topics.slice(0, 5).join(", ");

  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a university exam paper designer. Generate a concise, realistic exam paper. Respond in JSON array format only.",
      },
      {
        role: "user",
        content: `Generate 5 exam questions for a university paper covering these topics: ${topicList}.

Return a JSON array with this exact format:
[
  {"number": 1, "question": "...", "topic": "...", "marks": 10},
  ...
]

Vary marks (5, 8, 10, 15). Keep questions clear and exam-appropriate.`,
      },
    ],
    max_completion_tokens: 800,
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed.paper ?? []);
    return arr.slice(0, 5).map((q: any, i: number) => ({
      number: q.number ?? i + 1,
      question: q.question ?? "",
      topic: q.topic ?? topics[i] ?? "",
      marks: q.marks ?? 10,
    }));
  } catch {
    return topics.slice(0, 5).map((t, i) => ({
      number: i + 1,
      question: `Explain the key concepts of ${t} with examples.`,
      topic: t,
      marks: 10,
    }));
  }
}
