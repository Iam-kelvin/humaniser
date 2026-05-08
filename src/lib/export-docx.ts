import { Document, Packer, Paragraph, TextRun } from "docx";

import { segmentStructuredDocument } from "@/lib/rewrite/structured";

function buildParagraphs(text: string) {
  const structured = segmentStructuredDocument(text);
  const paragraphs: Paragraph[] = [];

  const pushSpacer = () => {
    paragraphs.push(
      new Paragraph({
        children: [],
        spacing: {
          after: 160,
        },
      }),
    );
  };

  structured.sections.forEach((section, index) => {
    if (section.type === "header" || section.type === "closing") {
      section.lines.forEach((line) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(line)],
            spacing: {
              after: 60,
            },
          }),
        );
      });
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.text,
              bold: section.type === "title",
            }),
          ],
          spacing: {
            after: 180,
          },
        }),
      );
    }

    if (index < structured.sections.length - 1) {
      pushSpacer();
    }
  });

  return paragraphs;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "humanised-rewrite";
}

export async function downloadDocx(text: string, fileName: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: buildParagraphs(text),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sanitizeFileName(fileName)}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
