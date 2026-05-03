import { Router } from "express";
import { z } from "zod/v4";
import { AnalyzeTopicsBody, AnalyzeTopicsResponse } from "@workspace/api-zod";
import { sessionStore } from "../lib/sessionStore";
import { analyzeText, scoreTopics, generateStudyPlan, generateThoughtBubbles } from "../lib/topicAnalyzer";

const router = Router();

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeTopicsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Invalid request body." });
    return;
  }

  const { sessionId, text: rawText, planDays = 2 } = parsed.data;

  let text = rawText || "";

  if (sessionId) {
    const session = sessionStore.get(sessionId);
    if (session) {
      text = session.text;
    } else {
      res.status(400).json({ error: "SESSION_NOT_FOUND", message: "Session not found. Please upload files again." });
      return;
    }
  }

  if (!text || text.trim().length < 10) {
    res.status(400).json({ error: "NO_TEXT", message: "No text to analyze. Please upload at least one file with readable content." });
    return;
  }

  const session = sessionId ? sessionStore.get(sessionId) : null;
  const paperCount = session?.fileCount ?? 1;

  const rawTopics = analyzeText(text);
  const scoredTopics = scoreTopics(rawTopics, paperCount);

  const topTopics = scoredTopics
    .filter(t => t.priority === "high" || t.priority === "medium")
    .slice(0, 3)
    .map(t => t.topic);

  const skipTopics = scoredTopics
    .filter(t => t.priority === "skip")
    .slice(0, 3)
    .map(t => t.topic);

  const studyPlan = generateStudyPlan(scoredTopics, planDays);
  const thoughtBubbles = generateThoughtBubbles(scoredTopics);

  const overallExamReadiness = scoredTopics.length > 0
    ? Math.round(scoredTopics.slice(0, 5).reduce((s, t) => s + t.examChancePercent, 0) / Math.min(5, scoredTopics.length))
    : 0;

  const lastNightTopics = scoredTopics
    .filter(t => t.priority === "high")
    .slice(0, 3)
    .map(t => t.topic);

  const result = AnalyzeTopicsResponse.parse({
    topics: scoredTopics,
    topTopics,
    skipTopics,
    studyPlan,
    overallExamReadiness,
    lastNightTopics,
    thoughtBubbles,
    paperCount,
    planDays,
  });

  res.json(result);
});

export default router;
