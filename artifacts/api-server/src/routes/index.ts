import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import analyzeRouter from "./analyze";
import generateQuestionsRouter from "./generateQuestions";
import generatePaperRouter from "./generatePaper";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(analyzeRouter);
router.use(generateQuestionsRouter);
router.use(generatePaperRouter);

export default router;
