# -*- coding: utf-8 -*-
"""report/ 下 2026 券商研报（公司覆盖类）第 2 批。
来源（report_ocr_batch_20260723/ 新提取）：
  - 壹网壹创  300792   华泰证券 2026-04-03
  - 宝信软件  600845   国泰海通证券 2026-04-08
  - 神州控股  0861.HK  长城证券 2026-04-13
  - 新点软件  688232   中泰证券 2026-04-14
（国博电子 688375 报告聚焦 GaN/6G/商业航天，无企业 AI 应用落地，跳过）
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch2_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch2_cases.json")
COLLECTED = "2026-07-23"
RISK = ("研报数据为卖方预测与公开披露，部分 AI 业务量化成效基于管理层指引或阶段性上线规模，存在不及预期与合规风险；"
        "大模型与 Agent 在垂直场景的落地需结合行业 Know-how 与数据治理，技术选型应随业务动态演进。")


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
            "prerequisites": "具备明确业务场景与数据基础，有推动 AI 产品化或内部提效的组织意愿",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自券商研报披露，量化经营数据可供同业对标参考。",
        },
        "implementers": [{"name": f"{org['name']}（含技术合作方）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": "medium",
        "sources": [dict(src)], "featured": featured,
        "publishedAt": pub, "implementationYear": year, "implementationTimePrecision": "year",
        "techPath": tech, "modelStack": models, "sourceReport": dict(sr), "tags": tags, "seo": {
            "metaTitle": f"{title} - 企业 AI 应用案例",
            "metaDescription": summary[:80], "keywords": tags,
        },
    }


CASES = [
    mk("research-2026-yiwy-agent", "壹网壹创：由电商服务商升级为“专家+AI Agent”全域智能服务",
       {"id": "org-yiwy", "name": "壹网壹创", "size": "large", "region": "杭州", "type": "private"},
       "retail", ["agent", "customer-service", "content-generation"], ["市场与销售", "客户成功"],
       "壹网壹创由传统电商全域服务商向“专家+AI Agent”全域电商服务战略升级，已完成 AI Agent 产品矩阵搭建与商用落地，推出大师生图、AI 客服、数素投、云见系统等垂直 AI 产品，助力毛戈平、Swisse、洁碧等品牌增长；2025 年归母净利润 1.08 亿元（同比+41.54%），毛利率提升至 29.28%（同比+4.47pct）。",
       "电商代运营行业竞争同质化，品牌对降本增效与内容生产力的诉求提升，传统人工服务模式难以规模化。",
       "品牌电商运营依赖人工，内容生产（图文/投放）效率低、成本高；客服与投放环节缺乏智能化。",
       "搭建“专家+AI Agent”产品矩阵：大师生图负责 AI 生图、AI 客服负责智能接待、数素投负责智能投放、云见系统负责数据洞察，以 AI 能力赋能品牌全域增长。",
       ["战略升级为专家+AI Agent", "AI Agent 产品矩阵商用", "大师生图/AI客服/数素投/云见系统落地", "多品牌规模化应用"],
       [{"label": "归母净利润", "value": "1.08 亿元", "improvement": "同比+41.54%", "kind": "actual"},
        {"label": "毛利率", "value": "29.28%", "improvement": "同比+4.47pct", "kind": "actual"}],
       "AI Agent 矩阵商用落地带来毛利率改善与利润高增，验证“电商服务+AI”升级路径，有望在 2026 年贡献增量。",
       ["大模型", "智能体", "内容生成"], ["壹网壹创 AI Agent 矩阵"],
       ["电商", "AI Agent", "智能客服", "内容生成"],
       {"id": "src-res-yiwy-2026", "title": "壹网壹创（300792）：26 年期待 AI 应用贡献增量",
        "publisher": "华泰证券", "type": "report", "url": "", "publishedAt": "2026-04-03",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results", "roi"]},
       {"title": "壹网壹创（300792）：26 年期待 AI 应用贡献增量", "publisher": "华泰证券", "year": 2026},
       "2026-04-03", 2025, featured=True),

    mk("research-2026-baosight-agents", "宝信软件：践行“AI+制造”，千余个智能体上线生产管理与设备维护",
       {"id": "org-baosight", "name": "宝信软件", "size": "large", "region": "上海", "type": "private"},
       "manufacturing", ["agent", "production-scheduling", "ai-infra"], ["生产制造", "信息技术"],
       "宝信软件践行“AI+制造”战略，已创建智能体 1000 多个并广泛应用于生产管理、设备维护等场景，完成 100 多个 AI 应用场景上线；持续迭代优化垂类模型，打造以转炉、高炉为代表的标杆性领域大模型。",
       "钢铁等流程行业面临下行周期，亟需通过智能化手段提升生产效率、降低运维成本、沉淀工业知识。",
       "生产管理与设备维护依赖人工经验，工业知识难以沉淀复用；行业下行期需以智能化降本增效。",
       "构建工业智能体平台，将 AI 能力嵌入生产管理、设备维护等核心环节；打造转炉、高炉等标杆领域大模型，形成“AI+制造”规模化应用。",
       ["AI+制造战略", "智能体平台建设（1000+）", "100+ AI 场景上线", "转炉/高炉领域大模型"],
       [{"label": "已创建智能体", "value": "1000+ 个", "kind": "actual"},
        {"label": "AI 应用场景上线", "value": "100+ 个", "kind": "actual"}],
       "智能体规模化上线推动工业知识沉淀与生产运维智能化，为流程行业“AI+制造”提供标杆范式（注：公司整体业绩受行业下行拖累）。",
       ["大模型", "智能体", "工业软件"], ["宝信垂类模型/领域大模型"],
       ["制造业", "工业智能体", "AI+制造", "领域大模型"],
       {"id": "src-res-baosight-2026", "title": "宝信软件（600845）：行业下行导致业绩承压，2026 打造业务增长新引擎",
        "publisher": "国泰海通证券", "type": "report", "url": "", "publishedAt": "2026-04-08",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]},
       {"title": "宝信软件（600845）：行业下行导致业绩承压，2026 打造业务增长新引擎", "publisher": "国泰海通证券", "year": 2026},
       "2026-04-08", 2025),

    mk("research-2026-chinadcs-scm", "神州控股：智能体“小金”嵌入供应链，双十一单量同比+50%",
       {"id": "org-chinadcs", "name": "神州控股", "size": "large", "region": "北京", "type": "private"},
       "logistics", ["agent", "workflow"], ["战略与运营", "客户成功"],
       "神州控股将自研智能体“小金”成功嵌入 OMS、WMS 等日常业务流程，双十一期间单量同比大增超 50%，全年发货单量突破亿级（同比+40%），存量客户净金额续费率高达 100%；并推出轻量化 SaaS“科捷云仓”降低中小客户使用门槛。",
       "供应链与仓配行业面临大促峰值压力与中小客户数字化门槛高的问题，运营效率与客户留存是关键。",
       "仓配运营依赖人工，大促峰值处理能力不足；中小客户缺乏低成本数字化工具，客户留存压力大。",
       "将智能体“小金”嵌入订单管理(OMS)、仓储管理(WMS)等流程实现智能调度与运营；以“科捷云仓”轻量化 SaaS 覆盖中小客户，提升续费与渗透。",
       ["智能体“小金”嵌入 OMS/WMS", "大促峰值智能调度", "科捷云仓 SaaS 推广", "客户续费提升"],
       [{"label": "双十一单量", "value": "同比+50%", "kind": "actual"},
        {"label": "全年发货单量", "value": "突破亿级（同比+40%）", "kind": "actual"},
        {"label": "存量客户净金额续费率", "value": "100%", "kind": "actual"}],
       "智能体驱动供应链运营效率与客户留存双提升，叠加轻量化 SaaS，业绩扭亏并打开中小客户增量空间。",
       ["大模型", "智能体", "供应链 SaaS"], ["神州控股“小金”智能体"],
       ["供应链", "智能体", "智能仓配", "SaaS"],
       {"id": "src-res-chinadcs-2026", "title": "神州控股（0861.HK）：业绩扭亏，AI 供应链应用成效显著",
        "publisher": "长城证券", "type": "report", "url": "", "publishedAt": "2026-04-13",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results", "roi"]},
       {"title": "神州控股（0861.HK）：业绩扭亏，AI 供应链应用成效显著", "publisher": "长城证券", "year": 2026},
       "2026-04-13", 2025),

    mk("research-2026-xd-software-gov", "新点软件：AI+政务/招采全面加速，垂直大模型与智能体规模落地",
       {"id": "org-xd-software", "name": "新点软件", "size": "large", "region": "江苏苏州", "type": "private"},
       "government", ["agent", "knowledge-base", "workflow"], ["战略与运营", "客户成功"],
       "新点软件迭代优化公共资源交易垂直领域大模型，推出多款“AI+”全流程场景智能体服务（政府侧）；政务智能体在北京、上海、广东、江苏、四川等地区广泛应用；发布住建行业数据资产管理平台 V1.0，并推出“筑小服”“住政通”两款大模型产品，累计服务 30 家央企、180 多家国企民企。",
       "政务服务与公共资源交易场景专业性强、流程繁复，亟需以 AI 提升办事效率与数据资产化能力。",
       "政务与招采流程依赖人工，专业门槛高、效率低；行业数据与知识难以沉淀与复用。",
       "构建招采/住建等垂直领域大模型，推出“AI+”全流程智能体服务；以政务智能体在政府侧多地区规模落地，并发布数据资产管理平台实现行业数据资产化。",
       ["招采垂直大模型迭代", "政务智能体多地落地", "筑小服/住政通大模型", "住建数据资产管理平台 V1.0"],
       [{"label": "政务智能体覆盖地区", "value": "北京/上海/广东/江苏/四川等", "kind": "actual"},
        {"label": "累计服务央国企", "value": "30 家央企 + 180+ 家国企民企", "kind": "actual"}],
       "AI+政务/招采产品化加速，政务智能体规模落地与政府侧数据资产化，构成数字政府业务的差异化壁垒。",
       ["大模型", "智能体", "知识库"], ["新点软件垂直领域大模型"],
       ["政务", "招采", "垂直大模型", "智能体"],
       {"id": "src-res-xd-2026", "title": "新点软件（688232）：经营持续承压，AI 赋能全面加速",
        "publisher": "中泰证券", "type": "report", "url": "", "publishedAt": "2026-04-14",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]},
       {"title": "新点软件（688232）：经营持续承压，AI 赋能全面加速", "publisher": "中泰证券", "year": 2026},
       "2026-04-14", 2025),
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
