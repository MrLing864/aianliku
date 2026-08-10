# -*- coding: utf-8 -*-
"""report/ 下 2026 行业研报抽取第 9 批：头部 AI 原生应用（快手可灵 / 字节即梦 / 阿里通义MaaS）。
来源（report_ocr_batch_20260723/ 新提取）：
  - 华创证券 2026-05-18《传媒行业周观察：AI应用进入业绩验证期；快手拟拆分可灵AI》
  - 华创证券 2026-04-12《传媒行业周观察：阿里两大模型登顶榜单，AI应用《EVE》上线》
（注：研报引用 AI 产品榜/Sensor Tower 等第三方公开榜单的 MAU 与厂商披露数据，按“企业+AI产品+量化成效”抽取）
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch9_cases.py.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch9_cases.json")
COLLECTED = "2026-07-23"
RISK = ("MAU/估值数据来自券商引用的第三方榜单（AI 产品榜等）与媒体报道，存在统计口径与时效差异；"
        "AI 原生应用留存与付费转化仍需验证，视频生成赛道竞争激烈、算力成本高，估值与商业化节奏存在不确定。")

SRC_KS_TITLE = "AI应用进入业绩验证期；快手拟拆分可灵AI——传媒行业周观察（20260511-20260515）"
SRC_KS_PUB = "华创证券"
SRC_KS_DATE = "2026-05-18"
SRC_ALI_TITLE = "阿里两大模型登顶榜单，AI应用《EVE》上线——传媒行业周观察（20260406-20260410）"
SRC_ALI_PUB = "华创证券"
SRC_ALI_DATE = "2026-04-12"


def mk(slug, title, org, summary, background, problem, solution, steps, results, roi,
       tech, models, tags, sources, src_report, pub, year, conf="high", featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "software-internet", "scenarios": ["content-generation", "agent"],
        "businessFunctions": ["研发与设计", "市场与销售"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"规模商用（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": "布局 AI 原生应用与多模态内容生成的互联网公司",
            "prerequisites": "具备大模型/多模态生成能力与海量 C 端流量分发渠道",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自券商研报引用的公开榜单与厂商数据，可供 AI 应用团队对标。",
        },
        "implementers": [{"name": f"{org['name']}（含生态合作伙伴）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": conf,
        "sources": sources,
        "featured": featured, "publishedAt": pub, "implementationYear": year,
        "implementationTimePrecision": "year", "techPath": tech, "modelStack": models,
        "sourceReport": src_report,
        "tags": tags, "seo": {"metaTitle": f"{title} - 企业 AI 应用案例",
                              "metaDescription": summary[:80], "keywords": tags},
    }


CASES = [
    mk("research-2026-kuaishou-keling", "快手可灵 AI：视频生成 MAU 达 785 万，拟以约 200 亿美元估值融资",
       {"id": "org-kuaishou", "name": "快手", "size": "large", "region": "北京", "type": "listed"},
       "快手可灵 AI 为视频生成领域的头部 AI 原生应用。据 AI 产品榜，2026 年 4 月可灵 AI MAU 环比增长 7% 至 785 万；快手发布自愿性公告称正评估拟议重组可灵 AI 相关资产或引入外部融资，媒体称其可能以约 200 亿美元估值融资，海外榜单与付费转化出现边际积极变化。",
       "视频生成赛道用户需求爆发，但 C 端留存与付费转化、B 端商业化仍需验证，独立融资有助于释放价值。",
       "AI 视频生成产品需持续投入算力与模型；估值与商业化节奏受留存/付费数据影响大。",
       "以可灵 AI 视频生成能力服务 C 端创作者与 B 端客户，借 AI 原生应用热度推动 MAU 与付费转化；以资产分拆/外部融资独立放大估值。",
       ["可灵 AI 视频生成", "MAU 持续增长", "海外榜单/付费转化改善", "资产分拆与外部融资"],
       [{"label": "2026年4月 MAU", "value": "785 万（环比 +7%）", "kind": "actual"},
        {"label": "拟融资估值", "value": "约 200 亿美元（媒体称）", "kind": "estimated"},
        {"label": "付费转化", "value": "海外边际积极变化", "kind": "actual"}],
       "可灵 AI 以头部 MAU 与付费转化改善验证视频生成商业化，资产分拆有望释放独立估值。",
       ["大模型", "多模态", "视频生成"], ["快手 可灵 AI（自研视频生成模型）"],
       ["视频生成", "AI原生应用", "可灵", "快手"],
       [{"id": "src-ks-20260518", "title": SRC_KS_TITLE, "publisher": SRC_KS_PUB, "type": "report",
         "url": "", "publishedAt": SRC_KS_DATE, "collectedAt": COLLECTED,
         "accessibility": "available", "supports": ["summary", "results"]}],
       {"title": SRC_KS_TITLE, "publisher": SRC_KS_PUB, "year": 2026},
       "2026-05-18", 2026, conf="medium", featured=True),

    mk("research-2026-bytedance-jimeng", "字节跳动即梦 AI：多模态生成 MAU 超 9000 万，出海环比增 16%",
       {"id": "org-bytedance", "name": "字节跳动", "size": "giant", "region": "北京", "type": "private"},
       "字节跳动旗下多模态应用即梦 AI 保持高速增长。据 AI 产品榜，2026 年 4 月即梦 AI 国内 MAU 超过 9000 万、环比增长 16%，出海 MAU 达 9249 万、环比增长 16% 位列全球第 9；配合豆包等字节系产品矩阵，形成覆盖文本/图像/视频的多模态 AI 布局。",
       "多模态生成应用竞争白热化，需以持续的产品体验与流量分发维持用户规模与增长。",
       "多模态应用留存与差异化体验要求高；出海需应对合规与本地化。",
       "以即梦 AI 提供图像/视频多模态生成能力，依托字节系产品矩阵与流量分发持续拉新；以海外版 Dola 等产品协同拓展出海。",
       ["即梦 AI 多模态生成", "9000万+ MAU", "出海 Dola 协同", "字节系产品矩阵"],
       [{"label": "国内 MAU", "value": "超 9000 万（环比 +16%）", "kind": "actual"},
        {"label": "出海 MAU", "value": "9249 万（环比 +16%，全球第9）", "kind": "actual"}],
       "即梦 AI 以超 9000 万 MAU 与双位数环比增长确立多模态生成头部地位，出海协同放大规模。",
       ["大模型", "多模态", "视频生成", "出海"], ["字节 即梦 AI / 豆包"],
       ["多模态", "AI原生应用", "即梦", "字节跳动"],
       [{"id": "src-ks-20260518", "title": SRC_KS_TITLE, "publisher": SRC_KS_PUB, "type": "report",
         "url": "", "publishedAt": SRC_KS_DATE, "collectedAt": COLLECTED,
         "accessibility": "available", "supports": ["summary", "results"]}],
       {"title": SRC_KS_TITLE, "publisher": SRC_KS_PUB, "year": 2026},
       "2026-05-18", 2026, conf="high"),

    mk("research-2026-alibaba-tongyi", "阿里巴巴通义千问：Qwen3.6 调用量登顶，MaaS ARR 将破 300 亿元",
       {"id": "org-alibaba", "name": "阿里巴巴", "size": "giant", "region": "杭州", "type": "listed"},
       "阿里巴巴通义千问大模型企业级落地加速：Qwen3.6 Plus 上线第二周即位列模型调用量榜单 Top1，新发布多模态模型 Happy Horse 性能位列 Artificial Analysis 榜首；据财报会披露，阿里 AI MaaS 服务 ARR 将于 2026 年 6 月突破 100 亿元、年底突破 300 亿元，模型能力提升直接驱动 MaaS（API 及订阅）收入增长。",
       "大模型企业级变现需要以调用量与 MaaS 收入证明商业化，头部厂商比拼模型性能与生态。",
       "模型能力需持续迭代以拉动调用；MaaS 收入规模与增速是商业化核心验证指标。",
       "以通义千问系列模型（含多模态 Happy Horse）提升性能与调用量；以 MaaS（API/订阅）模式将模型能力转化为规模化收入，绑定云与电商生态。",
       ["通义千问 Qwen3.6", "多模态 Happy Horse", "MaaS ARR 营收", "云+电商生态绑定"],
       [{"label": "模型调用量", "value": "Qwen3.6 Plus 榜单 Top1", "kind": "actual"},
        {"label": "多模态性能", "value": "Happy Horse 榜首", "kind": "actual"},
        {"label": "MaaS ARR", "value": "6月破100亿、年底破300亿元", "kind": "estimated"}],
       "通义千问以性能登顶与 MaaS ARR 高速放量，验证大模型企业级商业化路径与云生态协同。",
       ["大模型", "多模态", "MaaS", "智能体"], ["阿里 通义千问 Qwen3.6 / Happy Horse"],
       ["大模型", "通义千问", "MaaS", "阿里AI"],
       [{"id": "src-ali-20260412", "title": SRC_ALI_TITLE, "publisher": SRC_ALI_PUB, "type": "report",
         "url": "", "publishedAt": SRC_ALI_DATE, "collectedAt": COLLECTED,
         "accessibility": "available", "supports": ["summary", "results"]},
        {"id": "src-ks-20260518", "title": SRC_KS_TITLE, "publisher": SRC_KS_PUB, "type": "report",
         "url": "", "publishedAt": SRC_KS_DATE, "collectedAt": COLLECTED,
         "accessibility": "available", "supports": ["summary", "results"]}],
       {"title": SRC_ALI_TITLE, "publisher": SRC_ALI_PUB, "year": 2026},
       "2026-04-12", 2026, conf="high", featured=True),
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
