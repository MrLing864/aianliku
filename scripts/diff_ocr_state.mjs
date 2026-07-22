// 精确对比 report/ PDF 和 report_ocr/ 中的文件状态
import { readdirSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";

const REPORT_DIR = join(process.cwd(), "report");
const OCR_DIR = join(process.cwd(), "report_ocr");
const JSON_DIR = join(process.cwd(), "cases_json");

const pdfs = readdirSync(REPORT_DIR).filter(f => f.endsWith(".pdf"));
const ocrEntries = new Set(readdirSync(OCR_DIR));
const jsonFiles = new Set(readdirSync(JSON_DIR).filter(f => f.endsWith(".json")));

console.log(`报告PDF: ${pdfs.length} 个`);
console.log(`OCR输出: ${ocrEntries.size} 个文件`);
console.log(`已有JSON: ${jsonFiles.size} 个\n`);

let done = 0, needOcr = 0, hasTxtNoDone = 0;
for (const pdf of pdfs) {
  const baseName = pdf.replace(/\.pdf$/i, "");
  const doneFile = baseName + ".txt.done";
  const txtFile = baseName + ".txt";
  const hasTxt = ocrEntries.has(txtFile);
  const hasDone = ocrEntries.has(doneFile);

  if (hasDone) {
    done++;
  } else if (hasTxt) {
    hasTxtNoDone++;
    console.log("有TXT无done:", pdf);
  } else {
    needOcr++;
    // 列出前10个需要OCR的
    if (needOcr <= 10) console.log("需OCR:", pdf);
  }
}

console.log(`\n已完成OCR: ${done}`);
console.log(`有TXT无done: ${hasTxtNoDone}`);
console.log(`完全需OCR: ${needOcr}`);
