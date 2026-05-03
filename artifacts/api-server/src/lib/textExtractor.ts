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

  if (mimetype.startsWith("image/")) {
    return `[Image file: ${filename} — text extraction from images not supported yet]`;
  }

  return "";
}
