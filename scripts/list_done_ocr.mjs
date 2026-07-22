// 列出所有已OCR完成的文件名（基础名），方便后续对照使用
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPORT_DIR = join(process.cwd(), "report");
const OCR_DIR = join(process.cwd(), "report_ocr");

const pdfs = readdirSync(REPORT_DIR).filter(f => f.endsWith(".pdf")).sort();
const ocrEntries = new Set(readdirSync(OCR_DIR));

console.log("=== 已OCR完成的 PDF（有 .done 标记）===\n");
let idx = 1;
for (const pdf of pdfs) {
  const baseName = pdf.replace(/\.pdf$/i, "");
  const doneFile = baseName + ".txt.done";
  if (ocrEntries.has(doneFile)) {
    const txtFile = baseName + ".txt";
    const txtPath = join(OCR_DIR, txtFile);
    let size = 0;
    try { size = (await import("node:fs/promises")).stat(txtPath).then(s => s.size); } catch {}
    const sizeKB = Math.round(size / 1024);
    console.log(`${idx}. ${pdf} (OCR: ${sizeKB}KB)`);
    idx++;
  }
}
