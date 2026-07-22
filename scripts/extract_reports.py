import fitz, os, glob

src = r"c:/Users/Administrator/Desktop/aianliku/code/report"
out = r"c:/Users/Administrator/Desktop/aianliku/code/report_extracted"
os.makedirs(out, exist_ok=True)

for pdf in sorted(glob.glob(os.path.join(src, "*.pdf"))):
    name = os.path.splitext(os.path.basename(pdf))[0]
    try:
        doc = fitz.open(pdf)
        parts = []
        for i, page in enumerate(doc):
            parts.append(f"\n===== PAGE {i+1} =====\n")
            parts.append(page.get_text())
        text = "".join(parts)
        with open(os.path.join(out, name + ".txt"), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"OK {name} pages={doc.page_count} chars={len(text)}")
    except Exception as e:
        print(f"ERR {name}: {e}")
