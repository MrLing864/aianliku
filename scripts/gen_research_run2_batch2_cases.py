# -*- coding: utf-8 -*-
"""report/ 下 2026 研报抽取 run2 第 2 批：海外软件巨头 AI 应用（微软/Salesforce/ServiceNow/谷歌TPU）。
来源（report_ocr_batch_20260723_run2/ 新提取）：
  - 招银国际 2025-12-09《美国互联网与软件行业2026展望：应用持续起量，关注投资回报周期》
  - 国泰海通证券 2026-01-12《2025年全球人工智能技术、政策、产业与投融资趋势全景洞察报告》
（注：两份报告均披露海外 SaaS/云巨头 AI 应用的明确量化经营数据，按"企业+AI动作+量化成效"抽取）
入库：node scripts/insert-cases.mjs cases_json/gen_research_run2_batch2_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run2_batch2_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公司财报/业绩会披露与一致预期整理，部分为财年口径或前瞻性指引；"
        "海外 AI 应用商业化仍受 ROI 验证周期、资本开支回报节奏与监管影响，国内落地需结合本地生态。")

SRC_CMBI_TITLE = "美国互联网与软件行业2026展望：应用持续起量，关注投资回报周期"
SRC_CMBI_PUB = "招银国际"
SRC_CMBI_DATE = "2025-12-09"
SRC_GTHT_TITLE = "2025年全球人工智能技术、政策、产业与投融资趋势全景洞察报告"
SRC_GTHT_PUB = "国泰海通证券"
SRC_GTHT_DATE = "2026-01-12"


def mk(slug, title, org, summary, background, problem, solution, steps, results, roi,
       tech, models, tags, sources, src_report, pub, year, conf="high", featured=False,
       outcome="success"):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "software-internet", "scenarios": org["scenarios"],
        "businessFunctions": org["businessFunctions"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"规模商用（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": org["suitableFor"],
            "prerequisites": org["prerequisites"],
            "priority": "建议优先",
            "text": f"{org['name']}的「{title}」源自海外软件巨头财报/业绩会披露的 AI 应用数据，可供国内企业软件对标。",
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


MICROSOFT = {
    "id": "org-microsoft", "name": "微软(Microsoft)", "size": "giant", "region": "海外", "type": "foreign",
    "scenarios": ["agent", "rnd-design", "content-generation"],
    "businessFunctions": ["研发与设计", "市场与销售"],
    "suitableFor": "大型企业及开发团队的 AI 编程、智能体与办公效率落地",
    "prerequisites": "具备云基础设施与庞大企业客户基础，有模型托管、微调与智能体开发平台能力",
}
SALESFORCE = {
    "id": "org-salesforce", "name": "Salesforce", "size": "large", "region": "海外", "type": "foreign",
    "scenarios": ["agent", "sales"],
    "businessFunctions": ["市场与销售", "客户成功"],
    "suitableFor": "企业 CRM 与销售、客服场景的智能体落地",
    "prerequisites": "具备 CRM 客户数据与数据云整合能力，有企业级智能体编排与计费基础",
}
SERVICENOW = {
    "id": "org-servicenow", "name": "ServiceNow", "size": "large", "region": "海外", "type": "foreign",
    "scenarios": ["agent", "customer-service"],
    "businessFunctions": ["信息技术", "客户成功"],
    "suitableFor": "企业 ITSM、运维与流程自动化的 AI 智能体落地",
    "prerequisites": "具备 IT 流程数据与工作流平台，有企业级 AI 产品 ACV 化运营基础",
}
GOOGLE = {
    "id": "org-google-tpu", "name": "谷歌(Google)", "size": "giant", "region": "海外", "type": "foreign",
    "scenarios": ["ai-infra", "agent"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "云厂商与大规模推理场景的 AI 算力降本",
    "prerequisites": "具备自研 ASIC 与超大规模数据中心，有软硬协同优化与全栈软件闭环能力",
}

CASES = [
    mk("run2-microsoft-copilot-ai-foundry",
       "微软：Azure AI Foundry 托管 1.1 万+模型、服务 8 万客户，Copilot Agent Mode 重构开发",
       MICROSOFT,
       "微软将战略重心从单点工具转向支撑 AI 智能体规模化落地的平台与生态。Azure AI Foundry（模型工厂）已集成 1.1 万+ 由微软或合作伙伴托管的模型，服务 8 万客户、覆盖 80% 财富 500 强；1QFY26 Azure 与其他云服务收入同比增长 40%。Copilot 升级 Agent Mode（代理模式）可自主完成代码编写到提交的全流程，Copilot Tuning 提供低代码微调，GitHub Copilot 深度嵌入开发流程，形成「平台+智能体」协同框架。",
       "企业 AI 落地需从原型走向标准化、规模化，但模型选型、微调与智能体编排门槛高，单点工具难以形成生态。",
       "企业缺乏统一 AI 开发与部署平台；开发者需高效智能体化编程能力以降低交付成本。",
       "以 Azure AI Foundry + Windows AI Foundry 构建「云端+本地」双轨智能体开发部署体系；以 Copilot Agent Mode/Tuning 与 GitHub Copilot 将 AI 嵌入开发全流程，连接前沿模型与产业需求。",
       ["Azure AI Foundry 模型工厂", "Copilot Agent Mode", "Copilot Tuning 低代码微调", "GitHub Copilot 嵌入开发"],
       [{"label": "Azure AI Foundry 托管模型", "value": "1.1 万+ 模型", "kind": "actual"},
        {"label": "服务客户", "value": "8 万（覆盖 80% 财富 500 强）", "kind": "actual"},
        {"label": "1QFY26 Azure 云服务收入", "value": "同比 +40%", "kind": "actual"},
        {"label": "M365 商业/消费者云收入", "value": "同比 +17%/+26%（ARPU 提升）", "kind": "actual"}],
       "Azure AI Foundry 以平台化托管与智能体生态绑定海量企业客户，Copilot 推动开发范式智能化，云与生产力业务双增。",
       ["大模型", "智能体", "AI 编程", "平台生态"], ["Azure AI Foundry", "GitHub Copilot", "M365 Copilot"],
       ["AI编程", "智能体平台", "Copilot", "微软AI", "Azure"],
       [{"id": "src-run2-ms-cmbi", "title": SRC_CMBI_TITLE, "publisher": SRC_CMBI_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_CMBI_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]},
        {"id": "src-run2-ms-gtht", "title": SRC_GTHT_TITLE, "publisher": SRC_GTHT_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_GTHT_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_CMBI_TITLE, "publisher": SRC_CMBI_PUB, "year": 2025},
       "2025-12-09", 2025, conf="high", featured=True),

    mk("run2-salesforce-agentforce",
       "Salesforce：企业智能体 Agentforce 的 ARR 同比 +330% 至超 5 亿美元，驱动 AI 商业化",
       SALESFORCE,
       "Salesforce 以差异化 Agentforce 智能体方案与数据云整合推动 AI 商业化。3QFY26 Agentforce 及 Data 360 业务 ARR 同比增长 114% 至约 14 亿美元，其中 Agentforce 业务 ARR 同比大增 330% 至超 5 亿美元；受益于智能体业务增长，管理层指引 FY30E 总营收突破 600 亿美元、FY26-30 自有业务收入复合增速超 10%。",
       "CRM 厂商面临从「流程工具」向「自主智能体」升级，需以 AI 直接创造业务价值而非仅提效。",
       "企业客户服务与销售需自动化执行复杂任务；数据孤岛阻碍智能体落地与计费。",
       "以 Agentforce 智能体平台承载客服/销售自主任务执行，结合 Data Cloud 数据云整合统一客户数据，按 ARR 商业化并上调长期营收指引。",
       ["Agentforce 智能体平台", "Data Cloud 数据云整合", "ARR 商业化", "长期营收指引"],
       [{"label": "3QFY26 Agentforce+Data 360 ARR", "value": "约 14 亿美元（同比 +114%）", "kind": "actual"},
        {"label": "Agentforce ARR", "value": "超 5 亿美元（同比 +330%）", "kind": "actual"},
        {"label": "FY30E 总营收指引", "value": "突破 600 亿美元", "kind": "estimated"}],
       "Agentforce 以企业智能体打开 AI 商业化增量，ARR 高速放量验证「智能体即服务」的企业付费意愿。",
       ["大模型", "智能体", "企业服务"], ["Salesforce Agentforce", "Data Cloud"],
       ["企业智能体", "Agentforce", "Salesforce", "AI商业化"],
       [{"id": "src-run2-sf-cmbi", "title": SRC_CMBI_TITLE, "publisher": SRC_CMBI_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_CMBI_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_CMBI_TITLE, "publisher": SRC_CMBI_PUB, "year": 2025},
       "2025-12-09", 2025, conf="high", featured=True),

    mk("run2-servicenow-ai-agent",
       "ServiceNow：企业 AI 智能体产品 ACV 目标 FY26 末超 10 亿美元，占收入约 6%",
       SERVICENOW,
       "ServiceNow 凭借企业客户基础与先发优势持续受益于生成式 AI。公司目标 FY25/26 末 AI 产品 ACV 分别超 5 亿/10 亿美元（对应约占总收入 4%/6%），较 1Q25 的 2.5 亿美元 ACV 显著提升；同时利用 AI 持续提升内部经营效率，预计 FY26 non-GAAP 运营利润率再提升 1 个百分点。",
       "企业 ITSM/流程厂商需以 AI 从「记录系统」升级为「行动系统」，直接自动化复杂工作流。",
       "企业工作流自动化需可靠智能体；AI 产品需以 ACV 化运营证明变现能力与利润率改善。",
       "以生成式 AI 产品嵌入 ITSM/运维工作流，提供智能体化自动执行；以 ACV 口径运营 AI 产品，并用于内部效率提升以扩张利润率。",
       ["AI 产品嵌入工作流", "ACV 化运营", "内部效率提升", "利润率扩张"],
       [{"label": "FY26 末 AI 产品 ACV 目标", "value": "超 10 亿美元（占收入约 6%）", "kind": "estimated"},
        {"label": "1Q25 AI 产品 ACV", "value": "2.5 亿美元", "kind": "actual"},
        {"label": "FY26 non-GAAP 运营利润率", "value": "预计再提升 1 个百分点", "kind": "estimated"}],
       "ServiceNow 以企业 AI 智能体将 IT 流程自动化变现，ACV 快速爬坡验证企业级智能体的付费确定性。",
       ["大模型", "智能体", "企业服务"], ["ServiceNow AI 产品"],
       ["企业智能体", "ServiceNow", "ITSM", "AI商业化"],
       [{"id": "src-run2-sn-cmbi", "title": SRC_CMBI_TITLE, "publisher": SRC_CMBI_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_CMBI_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_CMBI_TITLE, "publisher": SRC_CMBI_PUB, "year": 2025},
       "2025-12-09", 2025, conf="high", featured=False),

    mk("run2-google-tpu-cost",
       "谷歌：自研 TPU Ironwood 推理成本较 GPU 低 30-40%，ASIC 规模化降本成基建标配",
       GOOGLE,
       "谷歌以自研 ASIC 重构 AI 算力成本。第五代 TPU Ironwood 通过架构优化形成 1.77 PB HBM3e 共享内存池与 42.5 Exaflops FP8 算力，内部实测同等负载下推理成本较 GPU 旗舰系统低 30%-40%；第五代 TPU、亚马逊 Trainium2 的单位算力成本已分别降至英伟达 H100 的 70%、60%，推动 ASIC 从可选项变为大规模应用的刚性需求。",
       "大模型推理在超大规模场景下面临 GPU 通用架构的成本与功耗瓶颈，需以专用化架构降本。",
       "高并发推理场景下通用 GPU 冗余成本高；垂直领域对算力成本、功耗与延迟有极致要求。",
       "以自研 TPU 等 ASIC 将计算逻辑硬化至硅片，剔除 GPU 通用冗余；以架构优化（共享内存池、高密度算力）实现能效与成本双重突破，规模化部署降本。",
       ["自研 TPU Ironwood", "ASIC 专用架构", "成本较 GPU 低 30-40%", "规模化部署"],
       [{"label": "TPU Ironwood 推理成本", "value": "较 GPU 旗舰系统低 30%-40%", "kind": "actual"},
        {"label": "第五代 TPU/Trainium2 单位算力成本", "value": "降至 H100 的 70%/60%", "kind": "actual"},
        {"label": "Ironwood 算力/内存", "value": "42.5 Exaflops FP8 / 1.77 PB HBM3e", "kind": "actual"}],
       "谷歌以自研 ASIC 实现 AI 推理成本结构性下降，ASIC 规模化降本成为超大规模 AI 基础设施的标配路径。",
       ["大模型", "AI 芯片", "AI 基础设施"], ["Google TPU Ironwood", "TPU v5"],
       ["AI芯片", "TPU", "ASIC", "算力降本", "谷歌"],
       [{"id": "src-run2-g-tpu", "title": SRC_GTHT_TITLE, "publisher": SRC_GTHT_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_GTHT_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_GTHT_TITLE, "publisher": SRC_GTHT_PUB, "year": 2026},
       "2026-01-12", 2025, conf="high", featured=False),
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
