import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { UploadPapersResponse } from "@workspace/api-zod";
import { sessionStore } from "../lib/sessionStore";
import { extractTextFromBuffer } from "../lib/textExtractor";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.post("/upload", upload.array("files", 10), async (req, res) => {
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
});

export default router;
