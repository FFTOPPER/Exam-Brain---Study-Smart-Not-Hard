import { Router } from "express";
import { GenerateQuestionsBody, GenerateQuestionsResponse } from "@workspace/api-zod";
import { generatePracticeQuestions } from "../lib/questionGenerator";

const router = Router();

router.post("/generate-questions", async (req, res) => {
  const parsed = GenerateQuestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "topic is required." });
    return;
  }

  const { topic, topicCode = "", count = 3 } = parsed.data;

  try {
    const questions = await generatePracticeQuestions(topic, topicCode, count);
    const result = GenerateQuestionsResponse.parse({ topic, questions });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Question generation failed");
    res.status(500).json({ error: "GENERATION_ERROR", message: "Could not generate questions. Please try again." });
  }
});

export default router;
