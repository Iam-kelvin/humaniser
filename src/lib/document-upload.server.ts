import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { normalizeUploadedText } from "@/lib/document-upload";

function getExtension(fileName: string) {
  const segments = fileName.toLowerCase().split(".");
  return segments.length > 1 ? segments.at(-1) ?? "" : "";
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return normalizeUploadedText(result.text);
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeUploadedText(result.value);
}

export async function extractUploadedDocumentText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = getExtension(file.name);

  switch (extension) {
    case "pdf":
      return extractPdfText(buffer);
    case "docx":
      return extractDocxText(buffer);
    default:
      return normalizeUploadedText(buffer.toString("utf8"));
  }
}
