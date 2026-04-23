export const DOCUMENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const DOCUMENT_UPLOAD_TYPES = [
  { extension: "txt", mimeTypes: ["text/plain"], previewable: true },
  { extension: "md", mimeTypes: ["text/markdown"], previewable: true },
  { extension: "markdown", mimeTypes: ["text/markdown"], previewable: true },
  { extension: "csv", mimeTypes: ["text/csv"], previewable: true },
  { extension: "tsv", mimeTypes: ["text/tab-separated-values"], previewable: true },
  { extension: "json", mimeTypes: ["application/json"], previewable: true },
  { extension: "html", mimeTypes: ["text/html"], previewable: true },
  { extension: "htm", mimeTypes: ["text/html"], previewable: true },
  { extension: "rtf", mimeTypes: ["application/rtf", "text/rtf"], previewable: true },
  { extension: "pdf", mimeTypes: ["application/pdf"], previewable: false },
  {
    extension: "docx",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    previewable: false,
  },
] as const;

type SupportedDocumentUpload = (typeof DOCUMENT_UPLOAD_TYPES)[number];

export const DOCUMENT_UPLOAD_ACCEPT = DOCUMENT_UPLOAD_TYPES.map((entry) => `.${entry.extension}`).join(",");

function getExtension(fileName: string) {
  const segments = fileName.toLowerCase().split(".");
  return segments.length > 1 ? segments.at(-1) ?? "" : "";
}

function getSupportedUpload(file: Pick<File, "name" | "type">): SupportedDocumentUpload | null {
  const extension = getExtension(file.name);
  const byExtension = DOCUMENT_UPLOAD_TYPES.find((entry) => entry.extension === extension);

  if (byExtension) {
    return byExtension;
  }

  if (!file.type) {
    return null;
  }

  return DOCUMENT_UPLOAD_TYPES.find((entry) => entry.mimeTypes.some((mimeType) => mimeType === file.type)) ?? null;
}

export function normalizeUploadedText(text: string) {
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
}

export function getDocumentUploadError(file: Pick<File, "name" | "size" | "type">) {
  if (file.size === 0) {
    return "The selected file is empty.";
  }

  if (file.size > DOCUMENT_UPLOAD_MAX_BYTES) {
    return "Upload a file smaller than 10 MB.";
  }

  if (!getSupportedUpload(file)) {
    return "Upload a PDF, DOCX, TXT, MD, RTF, CSV, JSON, or HTML file.";
  }

  return null;
}

export function isClientPreviewableUpload(file: Pick<File, "name" | "type">) {
  return getSupportedUpload(file)?.previewable ?? false;
}

export function titleFromUploadName(fileName: string) {
  const basename = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();

  if (!basename) {
    return null;
  }

  return basename.slice(0, 54);
}
