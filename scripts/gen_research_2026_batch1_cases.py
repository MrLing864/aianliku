# -*- coding: utf-8 -*-
"""从 report/ 下 2026 券商研报（公司覆盖类）抽取企业 AI 应用案例。

本批来源（均为本次 report_ocr_batch_20260723/ 新提取，非历史 TOP30/TOP10）：
  - 金山办公  688111.SH  广发证券 2026-03-26
  - 迈富时    2556.HK    长城证券 2026-04-08
  - 华锐精密  688059.SH  国投证券 2026-01-23
  - 卓越睿新  2687.HK    方正证券 2026-03-26
  - 中国软件国际 0354.HK 环球富盛 2026-03-28

入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch1_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch1_cases.json")

COLLECTED = "2026-07-23"
RISK = ("研报数据为卖方预测与公开披露，AI 业务量化成效部分基于管理层指引与预期值，存在不及预期风险；"
        "自研大模型与 Agent 的合规备案、数据安全及持续迭代能力是落地关键，技术选型需结合业务动态演进。")


def mk(slug, title, org, ind, scns, bf, summary, background, problem, solution, steps,
       results, roi, tech, models, tags, src, sr, pub, year, featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": ind, "scenarios": scns, "businessFunctions": bf, "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"持续迭代（{year}年落地）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": "与案例方同行业、有相似 AI 应用诉求的企业",
            "prerequisites": "具备明确业务场景与数据基础；有推动 AI 产品化或内部提效的组织意愿",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自券商研报披露，量化经营数据可供同业对标参考。",
        },
        "implementers": [{"name": f"{org['name']}（含技术合作方）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": "high",
        "sources": [dict(src)], "featured": featured,
        "publishedAt": pub, "implementationYear": year, "implementationTimePrecision": "year",
        "techPath": tech, "modelStack": models, "sourceReport": dict(sr), "tags": tags, "seo": {
            "metaTitle": f"{title} - 企业 AI 应用案例",
            "metaDescription": summary[:80], "keywords": tags,
        },
    }


CASES = [
    mk("research-2026-kingsoft-wpsai", "金山办公：WPS AI 驱动智能办公与 WPS 365 双增长",
       {"id": "org-kingsoft-office", "name": "金山办公", "size": "large", "region": "北京", "type": "private"},
       "software-internet", ["agent", "knowledge-base", "content-generation"], ["信息技术", "客户成功"],
       "金山办公推进“AI 与协作”战略，WPS AI 月活设备数超 8013 万（同比+307%），WPS 365 收入 7.20 亿元（同比+64.93%）；以 AI 会员体系驱动 C 端付费、以 WPS 365 一体化智能办公拉动 B 端政企客户增长。",
       "2025 年办公软件行业同质化竞争加剧，用户付费意愿依赖增值能力；企业文档协作与知识管理效率有待提升。",
       "传统办公软件增值能力有限、付费转化弱；政企客户文档协作、知识沉淀与智能处理效率低。",
       "WPS AI 提供写作、阅读、问答、PPT 生成等能力；WPS 365 整合文档、协作、AI 与企业管理，面向政企提供一体化智能办公方案，并以 AI 会员体系运营 C 端。",
       ["发布 WPS AI 个人版与企业版", "迭代 WPS 365 协作+AI 能力", "AI 会员体系运营", "政企客户规模化推广"],
       [{"label": "WPS AI 月活设备数", "value": "超 8013 万", "improvement": "同比+307%", "kind": "actual"},
        {"label": "WPS 365 收入", "value": "7.20 亿元", "improvement": "同比+64.93%", "kind": "actual"}],
       "AI 会员与 WPS 365 双增长，验证“AI+办公”商业化路径，C 端付费渗透与 B 端客单价同步提升，打开长期空间。",
       ["大模型", "智能体", "知识库"], ["WPS AI（自研+合作大模型）"],
       ["办公", "WPS AI", "智能办公", "知识库"],
       {"id": "src-res-kingsoft-2026", "title": "金山办公（688111）：AI 应用及信创共驱，业绩稳步兑现",
        "publisher": "广发证券", "type": "report", "url": "", "publishedAt": "2026-03-26",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]},
       {"title": "金山办公（688111）：AI 应用及信创共驱，业绩稳步兑现", "publisher": "广发证券", "year": 2026},
       "2026-03-26", 2025, featured=True),

    mk("research-2026-marketingforce-ai", "迈富时：AI 应用业务高增，人效提升驱动扭亏为盈",
       {"id": "org-marketingforce", "name": "迈富时", "size": "large", "region": "上海", "type": "private"},
       "software-internet", ["agent", "sales", "customer-service", "content-generation"], ["市场与销售", "客户成功"],
       "迈富时 2025 年 AI 应用业务收入 14.87 亿元（同比+76.5%），KA 客户 1609 家（同比+105.5%），人效提升 62.7%，外贸业务收入同比+134.4%，全年成功扭亏为盈；以 AI Agent 重构营销云全链路。",
       "营销与销售云服务行业中，中小企业与中大企业获客成本高、销售转化难，人工运营效率瓶颈明显。",
       "营销获客与销售转化依赖人工，运营效率低、成本高；企业 AI 应用门槛高、落地难。",
       "以 AI Agent 重构营销云，覆盖内容生成、智能客服、销售跟进、数据分析全链路；推出“全栈 Token 工厂”降低企业 AI 应用门槛，并通过内部 Agent 提升人效。",
       ["AI 应用业务规模化", "KA 客户拓展", "内部 Agent 提效", "外贸 AI 应用", "全栈 Token 工厂"],
       [{"label": "AI 应用业务收入", "value": "14.87 亿元", "improvement": "同比+76.5%", "kind": "actual"},
        {"label": "KA 客户数", "value": "1609 家", "improvement": "同比+105.5%", "kind": "actual"},
        {"label": "人效提升", "value": "62.7%", "improvement": "+62.7%", "kind": "actual"},
        {"label": "外贸业务收入", "value": "同比+134.4%", "improvement": "+134.4%", "kind": "actual"}],
       "收入高增叠加人效提升，2025 年成功扭亏为盈，验证 AI 应用在营销云场景的商业化闭环。",
       ["大模型", "智能体", "营销云"], ["迈富时 AI 大模型"],
       ["营销", "AI应用", "智能体", "SaaS"],
       {"id": "src-res-marketingforce-2026", "title": "迈富时（2556.HK）：收入及利润超预期，AI 应用商业化进展迅速",
        "publisher": "长城证券", "type": "report", "url": "", "publishedAt": "2026-04-08",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results", "roi"]},
       {"title": "迈富时（2556.HK）：收入及利润超预期，AI 应用商业化进展迅速", "publisher": "长城证券", "year": 2026},
       "2026-04-08", 2025),

    mk("research-2026-huarui-zhijia", "华锐精密：发布“华锐智加”工业软件，由硬件向 AI 软件延伸",
       {"id": "org-huarui-precision", "name": "华锐精密", "size": "large", "region": "湖南株洲", "type": "private"},
       "manufacturing", ["production-scheduling", "quality-inspection", "ai-infra"], ["生产制造", "研发与设计"],
       "华锐精密 2025 年 10 月发布“华锐智加”工业软件，加工效率可提升 5%-30%，同时提高产品良品率、优化企业管理成本并延长刀具使用寿命；2026 新品全球首发盛典上与 29 家客户伙伴签署战略合作协议，由数控刀具硬件向 AI 软件一体化布局。",
       "华锐精密为数控刀具国产龙头，高端数控机床投资门槛高，相比具身智能自动化设备缺乏高维外界感知能力。",
       "高端数控机床缺乏智能工艺优化与外部感知能力，软硬件一体化能力待补齐，存量机床价值未充分释放。",
       "发布“华锐智加”工业软件，融合 AI 工艺优化与感知能力，按金切机床存量配置软件，向“硬件+AI 软件”一体化布局延伸。",
       ["发布华锐智加工业软件", "AI 工艺优化与感知", "客户签约（29 家）", "软硬件一体化布局"],
       [{"label": "加工效率提升", "value": "5%-30%", "kind": "actual"},
        {"label": "首发盛典签约客户", "value": "29 家", "kind": "actual"}],
       "由硬件向 AI 软件延伸，按机床存量软件配置空间较大，打开软件增量收入与盈利空间。",
       ["AI 软件", "工艺优化", "智能感知"], ["华锐智加工业软件"],
       ["制造业", "工业软件", "数控", "AI工艺"],
       {"id": "src-res-huarui-2026", "title": "华锐精密（688059）：2025 全年业绩实现高增，看好 2026 年受益量价齐升+AI 软件放量",
        "publisher": "国投证券", "type": "report", "url": "", "publishedAt": "2026-01-23",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]},
       {"title": "华锐精密（688059）：2025 全年业绩实现高增，看好 2026 年受益量价齐升+AI 软件放量", "publisher": "国投证券", "year": 2026},
       "2026-01-23", 2025, featured=False),

    mk("research-2026-zhuoyuerexin-damingbai", "卓越睿新（智慧树）：自研“大明白”大模型+知识图谱全流程落地",
       {"id": "org-zhuoyuerexin", "name": "卓越睿新（智慧树）", "size": "large", "region": "上海", "type": "private"},
       "education", ["knowledge-base", "agent", "content-generation"], ["研发与设计", "客户成功"],
       "卓越睿新自研“大明白”教育大模型于 2025 年 11 月获网信办备案，覆盖“教、学、练、考、评、管”全流程；累计交付知识图谱超 5000 份，2025H1 知识图谱收入占比升至 55%，2025E 归母净利润 1.3 亿元（同比+22%）。",
       "卓越睿新为高等教育数字化龙头（智慧树），传统教育信息化覆盖场景窄、使用频次低，教师重复劳动多。",
       "教育信息化场景窄、教师重复劳动多；通用大模型难以适配学科专业性与教学规范。",
       "自研教育垂直大模型+知识图谱，打造 AI 助教、智能备课、学情分析、知识图谱等全流程产品，将碎片化教学资源可视化、系统化。",
       ["自研大明白大模型备案", "知识图谱规模化交付", "AI 助教/备课/学情分析", "覆盖教管全流程"],
       [{"label": "自研大模型备案", "value": "2025-11 获网信办备案", "kind": "actual"},
        {"label": "累计知识图谱交付", "value": "超 5000 份", "kind": "actual"},
        {"label": "知识图谱收入占比(2025H1)", "value": "55%", "improvement": "显著提升", "kind": "actual"},
        {"label": "2025E 归母净利润", "value": "1.3 亿元", "improvement": "同比+22%", "kind": "actual"}],
       "高毛利率知识图谱产品渗透率提升带动盈利质量改善，教育大模型+知识图谱构成垂直场景核心壁垒。",
       ["大模型", "知识图谱", "智能体"], ["大明白教育大模型（自研）"],
       ["教育", "知识图谱", "教育大模型", "AI助教"],
       {"id": "src-res-zhuoyuerexin-2026", "title": "卓越睿新（2687.HK）：自研大模型与 AI 智能体全流程规模化垂直落地，AI 原生应用+知识图谱共同打造新引擎",
        "publisher": "方正证券", "type": "report", "url": "", "publishedAt": "2026-03-26",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]},
       {"title": "卓越睿新（2687.HK）：自研大模型与 AI 智能体全流程规模化垂直落地，AI 原生应用+知识图谱共同打造新引擎", "publisher": "方正证券", "year": 2026},
       "2026-03-26", 2025),

    mk("research-2026-chinasoft-aiharmony", "中国软件国际：全栈 AI 产品破 20 亿，自研 Agent 提效",
       {"id": "org-chinasoft", "name": "中国软件国际", "size": "large", "region": "北京", "type": "private"},
       "software-internet", ["agent", "workflow"], ["信息技术", "客户成功"],
       "中软国际以“一体两翼”战略聚焦 AI，2025 年全栈全场景 AI 产品及服务销售额达 20.0 亿元（同比+109.2%），成功转向企业 Agentic AI 架构者；通过自研招聘及运营 Agent 等 AI 工具，行政开支同比下降 11.0%（占收入比 6.4%，降 0.8pct），人效显著提升。",
       "中软国际传统以 IT 服务外包为主，AI 转型期面临人员优化与降本增效压力，需向 AI 产品化升级。",
       "外包模式附加值有限；转型期人员优化与降本增效压力；需构建差异化 AI 产品能力。",
       "聚焦 AI 鸿蒙与 AI 智能业务操作系统，构建从物理世界智能感知到企业智能化运营的全栈 AI 产品；内部应用自研 Agent 优化人力与运营效率。",
       ["一体两翼 AI 战略", "全栈 AI 产品（20 亿）", "自研招聘/运营 Agent", "AI 鸿蒙+数字员工"],
       [{"label": "全栈 AI 产品及服务销售额", "value": "20.0 亿元", "improvement": "同比+109.2%", "kind": "actual"},
        {"label": "行政开支占收入比", "value": "6.4%", "improvement": "同比-0.8pct（绝对值-11.0%）", "kind": "actual"},
        {"label": "人效", "value": "显著提升", "kind": "actual"}],
       "新业务（全栈 AI）收入有望突破 30 亿元、毛利约 40%，AI 内部提效亦改善经营利润率。",
       ["大模型", "智能体", "数字员工"], ["自研 Agent"],
       ["AI鸿蒙", "Agent", "数字员工", "全栈AI"],
       {"id": "src-res-chinasoft-2026", "title": "中国软件国际（0354.HK）：聚焦 AI 鸿蒙与 AI 智能，继续全面拥抱 AI",
        "publisher": "环球富盛理财", "type": "report", "url": "", "publishedAt": "2026-03-28",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results", "roi"]},
       {"title": "中国软件国际（0354.HK）：聚焦 AI 鸿蒙与 AI 智能，继续全面拥抱 AI", "publisher": "环球富盛理财", "year": 2026},
       "2026-03-28", 2025),
]


def main():
    out = []
    for c in CASES:
        rec = build(c)
        out.append(rec)
        print(f"  [OK] {rec['title']}  (slug={rec['slug']}, industry={rec['industry']['id']}, scenarios={[s['id'] for s in rec['scenarios']]})")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n已生成 {len(out)} 条案例 -> {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
