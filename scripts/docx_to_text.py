# -*- coding: utf-8 -*-
"""将 report/ 下的 .docx 转为纯文本，输出到 report_ocr/<原名>.txt（按段落，保留换行）。"""
import os
import re
import zipfile
import xml.etree.ElementTree as ET

REPORT_DIR = os.path.join(os.path.dirname(__file__), "..", "report")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "report_ocr")
NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

os.makedirs(OUT_DIR, exist_ok=True)


def para_text(p):
    texts = []
    for t in p.iter(NS + "t"):
        texts.append(t.text or "")
    # 处理表格单元格内的换行已由段落拆分，这里直接拼接
    return "".join(texts)


def extract_docx(path):
    out = []
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    body = root.find(NS + "body")
    if body is None:
        return ""
    for elem in body:
        tag = elem.tag
        if tag == NS + "p":
            txt = para_text(elem).strip()
            if txt:
                out.append(txt)
        elif tag == NS + "tbl":
            # 表格：按行读取，单元格用 | 分隔
            for row in elem.findall(NS + "tr"):
                cells = []
                for cell in row.findall(NS + "tc"):
                    cell_text = []
                    for p in cell.findall(NS + "p"):
                        cell_text.append(para_text(p).strip())
                    cells.append(" ".join(cell_text))
                line = " | ".join(c for c in cells if c)
                if line.strip():
                    out.append("[表格] " + line)
    return "\n".join(out)


def main():
    files = sorted(f for f in os.listdir(REPORT_DIR) if f.lower().endswith(".docx"))
    print(f"发现 {len(files)} 个 docx 文件")
    for f in files:
        src = os.path.join(REPORT_DIR, f)
        name = re.sub(r"\.docx$", "", f, flags=re.I)
        dst = os.path.join(OUT_DIR, name + ".txt")
        text = extract_docx(src)
        with open(dst, "w", encoding="utf-8") as fh:
            fh.write(text)
        print(f"  {f} -> {os.path.basename(dst)}  ({len(text)} 字符)")


if __name__ == "__main__":
    main()
