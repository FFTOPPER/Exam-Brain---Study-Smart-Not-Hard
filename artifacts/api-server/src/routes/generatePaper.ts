import { Router } from "express";
import { GeneratePaperBody, GeneratePaperResponse } from "@workspace/api-zod";
import { generateExpectedPaper } from "../lib/questionGenerator";

const router = Router();

router.post("/generate-paper", async (req, res) => {
  const parsed = GeneratePaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "topics array is required." });
    return;
  }

  const { topics } = parsed.data;

  if (!topics || topics.length === 0) {
    res.status(400).json({ error: "NO_TOPICS", message: "Please provide at least one topic." });
    return;
  }

  try {
    const questions = await generateExpectedPaper(topics);
    const result = GeneratePaperResponse.parse({
      title: "Expected Question Paper",
      questions,
      generatedAt: new Date().toISOString(),
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Paper generation failed");
    res.status(500).json({ error: "GENERATION_ERROR", message: "Could not generate the question paper. Please try again." });
  }
});

export default router;
