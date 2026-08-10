# -*- coding: utf-8 -*-
"""report/ 下 2026 行业研报抽取第 7 批：中泰证券《传媒行业2026 AI应用系列深度报告（三）：AI消费时代》营销/广告厂商案例。
来源（report_ocr_batch_20260723/ 新提取）：
  - 中泰证券 2026-04-19《传媒行业2026 AI应用系列深度报告（三）：AI消费时代，营销策略向「ACO×品牌力」演进》
（注：报告“投资建议/重点推荐”披露多家智能营销与程序化广告公司的量化经营数据，按“企业+AI动作+量化成效”抽取）
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch7_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch7_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公司财报与一致预期的整理，部分增速为剔除汇兑/股份支付后的口径；"
        "AI 营销效果受广告主预算周期与合规（数据隐私、GEO）影响，ACO 等新业态兑现节奏存在不确定性。")

SRC_TITLE = "AI消费时代，营销策略向「ACO×品牌力」演进——传媒行业2026 AI应用系列深度报告（三）"
SRC_PUB = "中泰证券"
SRC_DATE = "2026-04-19"


def mk(slug, title, org, summary, background, problem, solution, steps, results, roi,
       tech, models, tags, pub, year, conf="high", featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "retail", "scenarios": ["sales", "content-generation"],
        "businessFunctions": ["市场与销售"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"规模商用（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": "广告营销服务商、品牌方与程序化广告平台",
            "prerequisites": "具备广告/电商客户资源与投放数据积累，有 AI 驱动营销与创意生成落地基础",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自券商研报披露的公司经营数据，可供智能营销同业对标。",
        },
        "implementers": [{"name": f"{org['name']}（含生态合作伙伴）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": conf,
        "sources": [{"id": f"src-mkt-{slug}", "title": SRC_TITLE, "publisher": SRC_PUB,
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
    mk("research-2026-yidian-tianxia", "易点天下：AI 驱动国际化智能营销，2025 营收 38.30 亿元、同增 50.4%",
       {"id": "org-yidian", "name": "易点天下", "size": "medium", "region": "西安", "type": "private"},
       "易点天下业务遍及全球 230 多个国家和地区，以 AI 驱动国际化智能营销与电商场景服务。2025 年实现营业收入 38.30 亿元、同比增长 50.4%，剔除汇兑损益和股份支付影响的归母净利润为 2.52 亿元、同增 19.0%，广告平台业务增长强劲、电商场景快速发展。",
       "跨境营销服务商需处理多语言、多市场创意与投放，传统人工投放效率低、规模化难。",
       "全球 230+ 国家/地区的本地化创意与投放依赖大量人力；电商客户对效果与 ROI 要求持续提升。",
       "以 AI 重构国际化智能营销链路，提升广告平台投放效率与电商场景交付能力，覆盖创意生成、定向与效果优化全流程。",
       ["AI 国际化智能营销", "广告平台提效", "电商场景拓展", "230+ 国家/地区覆盖"],
       [{"label": "2025 营收", "value": "38.30 亿元（+50.4%）", "kind": "actual"},
        {"label": "归母净利（剔除汇兑/股份支付）", "value": "2.52 亿元（+19.0%）", "kind": "actual"}],
       "AI 驱动的营销与电商场景双增长带动营收高增，验证跨境智能营销的规模商业化路径。",
       ["大模型", "内容生成", "智能营销"], ["易点天下 AI 营销平台"],
       ["智能营销", "跨境电商", "广告平台", "AI出海"],
       "2026-04-19", 2025, conf="high", featured=True),

    mk("research-2026-mobvista", "汇量科技：程序化广告平台覆盖 35 亿活跃设备，2025 收入 20.47 亿美元、溢利增 346.2%",
       {"id": "org-mobvista", "name": "汇量科技", "size": "medium", "region": "广州", "type": "private"},
       "汇量科技的程序化广告平台已成为全球头部平台之一，覆盖 35 亿活跃设备；2025 年实现总收入 20.47 亿美元，期内溢利同比增长 346.2%，游戏场景业务占比 74.6%，多元化拓展初见成效。",
       "全球程序化广告竞争激烈，平台需在算法效率与变现能力上持续领先以维持份额。",
       "跨设备、跨场景的实时竞价与创意匹配复杂；游戏等垂类对 ROI 与留存要求高。",
       "以 AI 算法驱动程序化广告实时竞价与创意优化，覆盖 35 亿活跃设备；以游戏场景为基本盘并向多元垂类拓展。",
       ["AI 程序化广告平台", "35 亿设备覆盖", "游戏场景深耕", "垂类多元化拓展"],
       [{"label": "覆盖活跃设备", "value": "35 亿", "kind": "actual"},
        {"label": "2025 总收入", "value": "20.47 亿美元", "kind": "actual"},
        {"label": "期内溢利", "value": "同比增长 346.2%", "kind": "actual"}],
       "AI 算法驱动的程序化广告带来收入与利润高增，规模化设备覆盖构筑平台壁垒。",
       ["大模型", "智能体", "程序化广告"], ["汇量科技 Mintegral 平台"],
       ["程序化广告", "智能营销", "游戏出海", "AI算法"],
       "2026-04-19", 2025),

    mk("research-2026-bluefocus", "蓝色光标：AI 布局推动 2025 收入 686.93 亿元、实现扭亏为盈",
       {"id": "org-bluefocus", "name": "蓝色光标", "size": "large", "region": "北京", "type": "private"},
       "蓝色光标为海外头部媒体广告代理商，2025 年预计实现收入 686.93 亿元、归母净利润 2.25 亿元，实现扭亏为盈，经营活动现金流量净额 6.32 亿元；公司 SDK 基础功能建成、头部媒体广告代理业务稳固，并积极推动 AI 布局。",
       "头部广告代理商面临传统代理业务毛利承压与 AI 原生营销工具冲击，亟需转型。",
       "代理业务增长见顶、利润薄；需以 AI 提升交付效率并开拓新收入曲线。",
       "稳固头部媒体广告代理基本盘，建成 SDK 基础功能并布局 AI 营销能力，以效率提升与现金流改善支撑转型。",
       ["头部媒体代理稳固", "SDK 基础功能建成", "AI 营销布局", "现金流改善"],
       [{"label": "2025 收入", "value": "686.93 亿元", "kind": "actual"},
        {"label": "归母净利润", "value": "2.25 亿元（扭亏为盈）", "kind": "actual"},
        {"label": "经营现金流净额", "value": "6.32 亿元", "kind": "actual"}],
       "AI 与效率提升助力公司扭亏为盈、现金流回正，验证广告代理龙头的 AI 转型可行性。",
       ["大模型", "内容生成", "智能营销"], ["蓝色光标 AI 营销体系"],
       ["智能营销", "广告代理", "AI转型", "扭亏为盈"],
       "2026-04-19", 2025),

    mk("research-2026-applovin", "Applovin：AI 驱动移动广告，2025 收入 54.81 亿美元、同增 70%、EBITDA 利润率 82%",
       {"id": "org-applovin", "name": "Applovin", "size": "large", "region": "海外", "type": "foreign"},
       "Applovin 为全球领先的 AI 驱动移动广告技术平台，2025 年实现总收入 54.81 亿美元、同比增长 70.0%，调整后 EBITDA 利润率达 82%；游戏广告以 28% 的市场份额位居行业第一。",
       "移动广告平台需在竞价、归因与创意上以 AI 持续提效，才能在高毛利下扩大份额。",
       "广告 ROI 与变现效率是平台核心竞争点；游戏垂类对精准投放与留存要求极高。",
       "以 AI 全面驱动移动广告的竞价、归因与创意优化，聚焦游戏等高价值场景，以高 EBITDA 利润率实现规模盈利。",
       ["AI 移动广告技术平台", "竞价/归因/创意优化", "游戏场景第一份额", "高 EBITDA 利润率"],
       [{"label": "2025 总收入", "value": "54.81 亿美元（+70.0%）", "kind": "actual"},
        {"label": "调整后 EBITDA 利润率", "value": "82%", "kind": "actual"},
        {"label": "游戏广告份额", "value": "28%（行业第一）", "kind": "actual"}],
       "AI 驱动的移动广告带来收入高增与超高利润率，确立游戏广告赛道龙头地位。",
       ["大模型", "智能体", "程序化广告"], ["Applovin AXON AI 引擎"],
       ["程序化广告", "移动广告", "AI引擎", "游戏营销"],
       "2026-04-19", 2025),
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
