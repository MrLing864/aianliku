import sys, os, glob, gc, fitz
from rapidocr_onnxruntime import RapidOCR

SRC = r"c:/Users/Administrator/Desktop/aianliku/code/report"
OUT = r"c:/Users/Administrator/Desktop/aianliku/code/report_ocr"
os.makedirs(OUT, exist_ok=True)

engine = None
PAGE_RESET = 20  # 每处理 N 页重建 OCR 引擎，释放累积内存，避免 OOM

def get_engine():
    global engine
    if engine is None:
        engine = RapidOCR()
    return engine

def ocr_pdf(pdf_path, out_path, name):
    global engine
    doc = fitz.open(pdf_path)
    if os.path.exists(out_path):
        os.remove(out_path)
    donep = out_path + ".done"
    if os.path.exists(donep):
        os.remove(donep)
    total = doc.page_count
    done = 0
    for i, page in enumerate(doc):
        try:
            # 周期性重建引擎以释放可能的内存泄漏
            if done > 0 and done % PAGE_RESET == 0:
                try:
                    del engine
                except Exception:
                    pass
                engine = None
                gc.collect()
            pix = page.get_pixmap(dpi=100)
            tmp = out_path + f".p{i}.png"
            pix.save(tmp)
            try:
                result, _ = get_engine()(tmp)
                lines = [r[1] for r in result] if result else []
                text = "\n".join(lines)
            except Exception as e:
                text = f"[OCR ERROR {e}]"
            if os.path.exists(tmp):
                os.remove(tmp)
            with open(out_path, "a", encoding="utf-8") as f:
                f.write(f"\n===== PAGE {i+1} =====\n{text}")
        except Exception as e:
            with open(out_path, "a", encoding="utf-8") as f:
                f.write(f"\n===== PAGE {i+1} =====\n[RENDER ERROR {e}]")
        done += 1
        print(f"  [{name}] page {i+1}/{total}", flush=True)
    with open(donep, "w", encoding="utf-8") as f:
        f.write("done")
    return total

def list_pdfs():
    pdfs = sorted(glob.glob(os.path.join(SRC, "*.pdf")))
    for i, p in enumerate(pdfs):
        name = os.path.splitext(os.path.basename(p))[0]
        mark = "OK" if os.path.exists(os.path.join(OUT, name + ".txt.done")) else ".."
        print(f"{i:3d} [{mark}] {name}")
    print(f"TOTAL {len(pdfs)}")

def pending():
    pdfs = sorted(glob.glob(os.path.join(SRC, "*.pdf")))
    count = 0
    for p in pdfs:
        name = os.path.splitext(os.path.basename(p))[0]
        out_path = os.path.join(OUT, name + ".txt")
        if os.path.exists(out_path + ".done"):
            print(f"SKIP(done) {name}")
            continue
        t0 = time.time()
        try:
            n = ocr_pdf(p, out_path, name)
            print(f"OK {name} pages={n} time={time.time()-t0:.1f}s -> {os.path.getsize(out_path)}B", flush=True)
        except MemoryError:
            print(f"OOM {name} at page ~{done_page_hint(out_path)} (will resume on rerun)", flush=True)
            # 清理半成品，下次重跑该文件
            raise
        except Exception as e:
            print(f"ERR {name}: {e}", flush=True)
        count += 1
    print(f"DONE-PENDING {count} files")

def done_page_hint(out_path):
    try:
        with open(out_path, encoding="utf-8") as f:
            return f.read().count("===== PAGE")
    except Exception:
        return 0

def main():
    args = sys.argv[1:]
    if args and args[0] == "--list":
        list_pdfs()
        return
    if args and args[0] == "--pending":
        pending()
        return
    pdfs = sorted(glob.glob(os.path.join(SRC, "*.pdf")))
    # 子串过滤（单文件）
    if args and not args[0].lstrip("-").isdigit():
        sub = args[0]
        for p in pdfs:
            name = os.path.splitext(os.path.basename(p))[0]
            if sub in name:
                out_path = os.path.join(OUT, name + ".txt")
                if os.path.exists(out_path + ".done"):
                    print(f"SKIP(done) {name}")
                    continue
                try:
                    n = ocr_pdf(p, out_path, name)
                    print(f"OK {name} pages={n} -> {os.path.getsize(out_path)}B", flush=True)
                except Exception as e:
                    print(f"ERR {name}: {e}", flush=True)
        return
    # 区间模式: --range a b
    start, end = 0, len(pdfs)
    if args and args[0] == "--range":
        start = int(args[1])
        end = int(args[2])
    elif args and args[0].isdigit():
        start = int(args[0])
        end = start + (int(args[1]) if len(args) > 1 else len(pdfs) - start)
    for i, p in enumerate(pdfs):
        if i < start or i >= end:
            continue
        name = os.path.splitext(os.path.basename(p))[0]
        out_path = os.path.join(OUT, name + ".txt")
        if os.path.exists(out_path + ".done"):
            print(f"SKIP(done) {name}")
            continue
        try:
            n = ocr_pdf(p, out_path, name)
            print(f"OK {name} pages={n} -> {os.path.getsize(out_path)}B", flush=True)
        except Exception as e:
            print(f"ERR {name}: {e}", flush=True)
    print("DONE")

if __name__ == "__main__":
    import time
    main()
