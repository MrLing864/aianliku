# -*- coding: utf-8 -*-
"""report/ 下 2026 行业研报抽取第 6 批：华源证券《AI电商，海外巨头是如何实践的？》代表厂商案例。
来源（report_ocr_batch_20260723/ 新提取）：
  - 华源证券 2026-04-16《互联网电商行业AI应用追寻系列报告（四）：AI电商，海外巨头是如何实践的？》
（注：该报告梳理海外电商巨头的 AI 落地实践，含明确量化经营数据，按“企业+AI动作+量化成效”逐家抽取）
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch6_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch6_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公开披露与第三方机构（First Page Sage、Marketplace Pulse、Statista 等）的整理，"
        "部分 GMV/用户数为口径估算；对话式电商交易闭环仍处早期，跳转体验、信任与合规（如 GEO 冲击 SEO）"
        "是规模化的主要约束，国内电商 AI 落地节奏与海外存在差异。")

SRC_TITLE = "AI电商，海外巨头是如何实践的？——互联网电商行业AI应用追寻系列报告（四）"
SRC_PUB = "华源证券"
SRC_DATE = "2026-04-16"


def mk(slug, title, org, summary, background, problem, solution, steps, results, roi,
       tech, models, tags, pub, year, conf="high", featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "retail", "scenarios": ["agent", "sales"],
        "businessFunctions": ["市场与销售", "客户成功"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"规模商用（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": "电商平台、品牌商家及电商 SaaS 服务商",
            "prerequisites": "具备商品/交易数据与用户行为积累，有对话式交互与智能推荐落地基础",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自券商研报披露的海外电商 AI 实践数据，可供国内同业对标。",
        },
        "implementers": [{"name": f"{org['name']}（含生态合作伙伴）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": conf,
        "sources": [{"id": f"src-ecom-{slug}", "title": SRC_TITLE, "publisher": SRC_PUB,
                     "type": "report", "url": "", "publishedAt": SRC_DATE,
                     "collectedAt": COLLECTED, "accessibility": "available",
                     "supports": ["summary", "results"]}],
        "featured": featured, "publishedAt": pub, "implementationYear": year,
        "implementationTimePrecision": "year", "techPath": tech, "modelStack": models,
        "sourceReport": {"title": SRC_TITLE, "publisher": SRC_PUB, "year": 2026},
        "tags": tags, "seo": {"metaTitle": f"{title} - 企业 AI 应用案例",
                              "metaDescription": summary[:80], "keywords": tags},
    }


CASES = [
    mk("research-2026-amazon-rufus", "亚马逊：主站嵌入对话购物助手 Rufus，2025 用户超 3 亿、GMV 贡献约 120 亿美元",
       {"id": "org-amazon", "name": "亚马逊(Amazon)", "size": "giant", "region": "海外", "type": "foreign"},
       "亚马逊于 2024 年上线对话购物助手 Rufus 并持续升级，支持自然语言对话、按场景搜索商品、自动加购、比价与多模态搜索。2025 年 Rufus 用户数量超 3 亿，对主站 GMV 贡献约 120 亿美元，成为直接驱动电商业务增长的核心 AI 入口。",
       "电商主站流量与转化依赖搜索/推荐，传统关键词检索难以理解复杂意图，用户决策链路长、比价效率低。",
       "用户自然语言购物意图难被传统搜索理解；跨场景（营销活动/生活事项）的商品匹配与最优价判断需大量人工。",
       "在亚马逊主站深度嵌入 Rufus 对话购物助手，以自然语言理解用户目的并跨场景检索商品；支持自动加购与多模态搜索，将 AI 直接转化为交易增量。",
       ["Rufus 对话购物助手上线", "自然语言/多模态搜索", "自动加购与比价", "主站交易闭环"],
       [{"label": "2025 年 Rufus 用户", "value": "超 3 亿", "kind": "actual"},
        {"label": "GMV 贡献", "value": "约 120 亿美元", "kind": "actual"}],
       "Rufus 以对话式入口重构主站购物体验，用户规模与 GMV 贡献双突破，验证“内部 AI 助手直接驱动业务增长”的电商范式。",
       ["大模型", "智能体", "对话式电商"], ["Amazon Rufus（自研大模型）"],
       ["AI电商", "对话购物", "Rufus", "智能推荐"],
       "2026-04-16", 2025, conf="high", featured=True),

    mk("research-2026-shopify-magic", "Shopify：AI 工具 Shopify Magic 赋能 270 万+ 商家，2025 GMV 达 3784 亿美元",
       {"id": "org-shopify", "name": "Shopify", "size": "large", "region": "海外", "type": "foreign"},
       "Shopify 以 AI 工具 Shopify Magic 赋能全渠道电商运营，覆盖建站、营销、客服与商品描述生成；作为 DTC 生态的“操作系统”，截至 2026 年 3 月初美国有超 270 万 Shopify 商店，2025 年 GMV 达 3784 亿美元、同比增长 29.5%。",
       "独立站商家需自主搭建与运营全链路电商，建站、营销与客服环节人力成本高、专业门槛高。",
       "DTC 商家缺技术与运营能力，商品内容生产与多语言营销效率低；中小商家难负担定制化 AI 投入。",
       "以 Shopify Magic 将大模型能力产品化嵌入建站/营销/客服流程；以 SaaS 模式规模化赋能 270 万+ 商家，降低 AI 使用门槛。",
       ["Shopify Magic AI 工具", "全渠道建站/营销赋能", "SaaS 规模化交付", "DTC 生态操作系统"],
       [{"label": "2025 年 GMV", "value": "3784 亿美元（+29.5%）", "kind": "actual"},
        {"label": "美国 Shopify 商店", "value": "超 270 万家", "kind": "actual"}],
       "AI 工具嵌入电商 SaaS 带动 GMV 近三成增长，证明“平台级 AI 普惠”可同时提升商家效率与平台交易规模。",
       ["大模型", "内容生成", "电商 SaaS"], ["Shopify Magic"],
       ["AI电商", "Shopify", "DTC", "电商SaaS"],
       "2026-04-16", 2025),

    mk("research-2026-google-gemini-ecom", "谷歌：Gemini 强化电商生态，零售 API Tokens 月耗增 11 倍、UCP 联合 20+ 伙伴",
       {"id": "org-google", "name": "谷歌(Google)", "size": "giant", "region": "海外", "type": "foreign"},
       "谷歌以 Gemini 增强电商生态内的需求转化：截至 2025 年 12 月，Google 零售客户 API 调用 Tokens 月消耗量较 2024 年同期扩增约 11 倍；2026 年 1 月在 NRF 年会推出 AI 电商开放标准 UCP，初始合作伙伴含 Shopify、Etsy、Wayfair、Target、沃尔玛等 20 多家公司，落地应用内交易闭环。",
       "搜索广告是谷歌电商变现核心，但传统搜索难以承载对话式、意图驱动的购物需求，面临 ChatGPT 等通用助手分流。",
       "零售客户 AI 调用量激增带来成本与架构压力；需以开放标准把 AI 能力嵌入电商全生命周期而非单点广告。",
       "以 Gemini 提升零售客户 API 调用与转化效率；推出 UCP 开放标准，联合 20+ 头部零售商以应用内闭环支付为切入点，未来覆盖结账、订单管理与交叉销售。",
       ["Gemini 电商调用增强", "UCP 开放标准", "20+ 伙伴应用内闭环", "电商全生命周期布局"],
       [{"label": "零售 API Tokens 月耗", "value": "较 2024 年同期增约 11 倍", "kind": "actual"},
        {"label": "UCP 初始合作伙伴", "value": "20+ 家公司", "kind": "actual"}],
       "Tokens 调用量十倍增长印证电商 AI 需求爆发，UCP 开放标准把谷歌搜索/AI 能力延展至交易闭环，巩固生态壁垒。",
       ["大模型", "智能体", "开放标准"], ["Google Gemini"],
       ["AI电商", "Gemini", "UCP", "开放标准"],
       "2026-04-16", 2026),
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
