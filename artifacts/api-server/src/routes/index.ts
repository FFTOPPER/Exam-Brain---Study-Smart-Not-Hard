import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import analyzeRouter from "./analyze";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(analyzeRouter);

export default router;
