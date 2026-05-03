import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { UploadPapersResponse } from "@workspace/api-zod";
import { sessionStore } from "../lib/sessionStore";
import { extractTextFromBuffer } from "../lib/textExtractor";

const router = Router();

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error(`Unsupported file type: ${file.mimetype}. Please upload PDF, Word (.docx), or image files.`) as any;
      err.code = "UNSUPPORTED_FILE_TYPE";
      cb(err);
    }
  },
});

router.post(
  "/upload",
  (req: Request, res: Response, next: NextFunction) => {
    upload.array("files", 10)(req, res, (err: any) => {
      if (err) {
        const message =
          err.code === "UNSUPPORTED_FILE_TYPE"
            ? err.message
            : err.code === "LIMIT_FILE_SIZE"
            ? "File too large. Maximum size is 20MB per file."
            : err.code === "LIMIT_FILE_COUNT"
            ? "Too many files. Maximum is 10 files at once."
            : "Upload failed. Please try again.";
        res.status(400).json({ error: err.code || "UPLOAD_ERROR", message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: "NO_FILES", message: "Please upload at least one file." });
      return;
    }

    try {
      const textParts: string[] = [];

      for (const file of files) {
        const text = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);
        if (text.trim()) {
          textParts.push(text);
        }
      }

      const totalText = textParts.join("\n\n");
      const sessionId = uuidv4();

      sessionStore.set(sessionId, {
        text: totalText,
        fileCount: files.length,
        createdAt: Date.now(),
      });

      const result = UploadPapersResponse.parse({
        sessionId,
        filesProcessed: files.length,
        totalText,
        preview: totalText.slice(0, 300) + (totalText.length > 300 ? "..." : ""),
      });

      res.json(result);
    } catch (err) {
      req.log.error({ err }, "Upload processing failed");
      res.status(500).json({ error: "PROCESSING_ERROR", message: "Failed to process uploaded files." });
    }
  }
);

export default router;
