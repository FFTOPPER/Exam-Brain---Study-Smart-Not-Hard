import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> {
  if (mimetype === "application/pdf") {
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (err) {
      console.error(`Failed to parse PDF ${filename}:`, err);
      return `[Could not extract text from ${filename}]`;
    }
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (err) {
      console.error(`Failed to parse Word document ${filename}:`, err);
      return `[Could not extract text from ${filename}]`;
    }
  }

  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (mimetype.startsWith("image/")) {
    return `[Image file: ${filename} — text extraction from images is not supported yet]`;
  }

  return "";
}
