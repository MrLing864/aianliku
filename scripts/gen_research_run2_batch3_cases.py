# -*- coding: utf-8 -*-
"""report/ 下 2026 研报抽取 run2 第 3 批：DeepSeek 开源模型生态 + 端侧 AI 芯片（晶晨/星宸）。
来源（report_ocr_batch_20260723_run2/ 新提取）：
  - 中原证券 2026-01-22《计算机行业月报：AI应用全面加速，DeepSeek V4有望深刻改变全球AI的竞争格局》
  - 东吴证券 2026-02-23《2026年端侧AI产业深度：应用迭代驱动终端重构，见证端侧SoC芯片的价值重估与位阶提升》
入库：node scripts/insert-cases.mjs cases_json/gen_research_run2_batch3_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run2_batch3_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公司披露、Artificial Analysis 基准与媒体公开报道整理；"
        "开源模型商业化路径、国产芯片适配广度与端侧 AI 终端出货节奏存在不确定性。")

SRC_ZY_TITLE = "AI应用全面加速，DeepSeek V4有望深刻改变全球AI的竞争格局——计算机行业月报"
SRC_ZY_PUB = "中原证券"
SRC_ZY_DATE = "2026-01-22"
SRC_DW_TITLE = "2026年端侧AI产业深度：应用迭代驱动终端重构，见证端侧SoC芯片的价值重估与位阶提升"
SRC_DW_PUB = "东吴证券"
SRC_DW_DATE = "2026-02-23"


def mk(slug, title, org, summary, background, problem, solution, steps, results, roi,
       tech, models, tags, sources, src_report, pub, year, conf="high", featured=False,
       outcome="success"):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": org["industry"], "scenarios": org["scenarios"],
        "businessFunctions": org["businessFunctions"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"规模商用（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": org["suitableFor"],
            "prerequisites": org["prerequisites"],
            "priority": "建议优先",
            "text": f"{org['name']}的「{title}」源自券商研报披露的开源生态/芯片市占数据，可供同业对标。",
        },
        "implementers": [{"name": f"{org['name']}（含生态合作伙伴）", "role": "其他"}],
        "outcomeStatus": outcome, "confidence": conf,
        "sources": sources,
        "featured": featured, "publishedAt": pub, "implementationYear": year,
        "implementationTimePrecision": "year", "techPath": tech, "modelStack": models,
        "sourceReport": src_report,
        "tags": tags, "seo": {"metaTitle": f"{title} - 企业 AI 应用案例",
                              "metaDescription": summary[:80], "keywords": tags},
    }


DEEPSEEK = {
    "id": "org-deepseek", "name": "DeepSeek(深度求索)", "size": "large", "region": "杭州", "type": "private",
    "industry": "software-internet", "scenarios": ["agent", "ai-infra"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "需要低成本、高性能大模型能力的企业与开发者",
    "prerequisites": "具备大模型预训练与推理优化能力，有开源生态与国产芯片协同适配基础",
}
AMLOGIC = {
    "id": "org-amlogic", "name": "晶晨股份", "size": "large", "region": "上海", "type": "private",
    "industry": "manufacturing", "scenarios": ["ai-infra", "rnd-design"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "端侧 AI SoC 与智能终端芯片厂商",
    "prerequisites": "具备 SoC 自研能力，有全球运营商渠道与自研 NPU/多媒体架构积累",
}
SIGMASTAR = {
    "id": "org-sigmastar", "name": "星宸科技", "size": "medium", "region": "厦门", "type": "private",
    "industry": "manufacturing", "scenarios": ["ai-infra", "rnd-design"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "视频安防与 AI 新终端（AI 眼镜）芯片厂商",
    "prerequisites": "具备视频编解码与端侧 AI 推理芯片能力，有细分赛道渠道卡位优势",
}

CASES = [
    mk("run2-deepseek-open-ecosystem",
       "DeepSeek：全开源模型矩阵（价格约竞品 1/30）+ 国产芯片 day0 适配，V4 编程领先",
       DEEPSEEK,
       "DeepSeek 以全系列开源大模型构建高性价比 AI 生态：R1 价格约为 OpenAI o1 的 1/30，V2 价格约为 GPT-4 Turbo 的 1/70；V3.2-Exp 发布当日即实现寒武纪、华为昇腾 day0 适配，并大幅降价（API 超 50%）。据媒体报道，有望于 2 月发布的 V4 编程能力超过 Claude 与 GPT 系列。其自研 TileLang 将 CUDA/C++ 算子代码从 500 余行压缩至约 80 行、性能提升约 30%，推动国产软硬件生态去英伟达化。",
       "海外闭源大模型价格高企、生态锁定强，国内企业与开发者难以低成本获取顶尖模型能力，国产芯片缺乏成熟软件栈。",
       "闭源模型成本高、国产芯片软件生态薄弱；需要低成本高性能开源模型 + 软硬协同适配。",
       "以全系列开源 MoE 模型（R1/V3 系列）提供高性价比能力；通过 day0 国产芯片适配与开源 TileLang 算子语言打通软硬件生态，以开源策略冲击全球竞争格局。",
       ["全系列开源 MoE 模型", "国产芯片 day0 适配", "TileLang 开源算子", "极致性价比定价"],
       [{"label": "R1 价格", "value": "约为 OpenAI o1 的 1/30", "kind": "actual"},
        {"label": "V3.2-Exp API", "value": "发布当日寒武纪/昇腾 day0 适配、降价超 50%", "kind": "actual"},
        {"label": "V4 编程能力", "value": "超过 Claude 与 GPT 系列（媒体报道）", "kind": "estimated"},
        {"label": "TileLang 算子", "value": "代码 500→80 行、性能提升约 30%", "kind": "actual"}],
       "DeepSeek 以开源+极致性价比+国产适配重构全球大模型竞争格局，为国内 AI 应用与国产芯片生态提供低成本底座。",
       ["大模型", "智能体", "开源生态", "AI 基础设施"], ["DeepSeek 全系列开源 MoE 模型", "TileLang"],
       ["开源大模型", "DeepSeek", "国产适配", "高性价比", "智能体"],
       [{"id": "src-run2-ds-zy", "title": SRC_ZY_TITLE, "publisher": SRC_ZY_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_ZY_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZY_TITLE, "publisher": SRC_ZY_PUB, "year": 2026},
       "2026-01-22", 2025, conf="high", featured=True),

    mk("run2-amlogic-soc-leadership",
       "晶晨股份：端侧 AI SoC 龙头，机顶盒全球市占 31.5%、智能电视 16.8%，Q2 出货 4400 万颗",
       AMLOGIC,
       "晶晨股份为端侧 AI SoC 全球龙头。在机顶盒 SoC 领域，以 2024 年相关收入计全球市占率 31.5%（每 3 台智能机顶盒搭载 1 颗晶晨芯片），2025Q2 系统级 SoC 单季出货近 4400 万颗，业务覆盖全球 250 余家主流运营商及 Netflix 等流媒体巨头；在智能电视 SoC 领域全球市占率 16.8%（第二），每 5 台智能电视有 1 台搭载其芯片。公司推出全球首颗 8K 超高清机顶盒 SoC S928X（集成自研 NPU），以高研发构筑壁垒（2022-2024 年每年研发费用超 10 亿元、占营收比超 20%）。",
       "端侧 AI 应用落地依赖终端硬件算力与效率，机顶盒/电视等大屏终端需本地化 AI 推理能力支撑画质与交互升级。",
       "大屏终端需低功耗、高算力 SoC 支撑端侧 AI；全球运营商渠道与高端制程是竞争壁垒。",
       "以自研 NPU 与异构计算架构推出 8K 机顶盒 SoC 等高端产品；依托全球 250+ 运营商渠道与头部电视品牌合作，向全场景 AIoT 平台加速重构。",
       ["自研 NPU SoC", "8K 机顶盒 S928X", "全球运营商渠道", "全场景 AIoT 平台"],
       [{"label": "机顶盒 SoC 全球市占率", "value": "31.5%（全球第一）", "kind": "actual"},
        {"label": "智能电视 SoC 全球市占率", "value": "16.8%（全球第二）", "kind": "actual"},
        {"label": "2025Q2 单季 SoC 出货", "value": "近 4400 万颗", "kind": "actual"},
        {"label": "渠道覆盖", "value": "全球 250+ 主流运营商", "kind": "actual"}],
       "晶晨以全球领先的端侧 SoC 市占率与自研 NPU 能力，成为大屏与 AIoT 终端 AI 化的核心算力底座。",
       ["大模型", "端侧 AI", "AI 芯片"], ["晶晨自研 NPU", "S928X 8K SoC"],
       ["端侧AI", "AI芯片", "晶晨股份", "SoC", "机顶盒"],
       [{"id": "src-run2-am-dw", "title": SRC_DW_TITLE, "publisher": SRC_DW_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_DW_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_DW_TITLE, "publisher": SRC_DW_PUB, "year": 2026},
       "2026-02-23", 2025, conf="high", featured=True),

    mk("run2-sigmastar-vision-ai",
       "星宸科技：视频安防 AI 芯片份额超 40%，卡位 AI 眼镜新终端赛道",
       SIGMASTAR,
       "星宸科技在视频安防 AI 芯片领域具备领先卡位，视频安防份额超 40%，并借助在视觉 AI 的成熟方案卡位 AI 眼镜这一尚未被证伪的优质端侧场景。在端侧 AI 由云端向物理世界延伸的产业趋势下，星宸以视频编解码与端侧推理芯片能力，向 AI 新终端（AI 眼镜、具身智能）拓展，受益于 IoT 蓝海市场与国产替代机遇。",
       "安防与 IoT 终端亟需本地化视频 AI 推理能力，AI 眼镜等新终端对低功耗视觉芯片提出新要求。",
       "视觉 AI 芯片需兼顾算力、功耗与成本；新终端赛道格局未定，需提前卡位。",
       "以视频安防 AI 芯片的高份额为基础，复用视觉 AI 方案向 AI 眼镜等新终端延展，绑定终端厂商抢占蓝海。",
       ["视频安防 AI 芯片", "AI 眼镜卡位", "视觉 AI 方案复用", "新终端拓展"],
       [{"label": "视频安防 AI 芯片份额", "value": "超 40%", "kind": "actual"},
        {"label": "赛道卡位", "value": "AI 眼镜（优质端侧场景）", "kind": "actual"}],
       "星宸以视觉 AI 芯片高份额构筑壁垒，向 AI 眼镜等新终端延伸，受益于端侧 AI 蓝海与国产替代。",
       ["端侧 AI", "AI 芯片", "视觉 AI"], ["星宸视觉 AI SoC"],
       ["端侧AI", "AI芯片", "星宸科技", "视频安防", "AI眼镜"],
       [{"id": "src-run2-ss-dw", "title": SRC_DW_TITLE, "publisher": SRC_DW_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_DW_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_DW_TITLE, "publisher": SRC_DW_PUB, "year": 2026},
       "2026-02-23", 2025, conf="medium", featured=False),
]


def main():
    out = []
    for c in CASES:
        rec = build(c)
        out.append(rec)
        print(f"  [OK] {rec['title']}  (slug={rec['slug']})")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n已生成 {len(out)} 条案例 -> {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
