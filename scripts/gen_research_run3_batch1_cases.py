# -*- coding: utf-8 -*-
"""report/ 下 2025 研报抽取 run3 第 1 批：软件与互联网 / 教育 行业 AI 应用
来源（report_ocr_run3/ 新提取）：
  - 招商证券 2025-10-30《亚信科技：AI大模型应用与交付业务Q3高增，获阿里云深度赋能》
  - 东北证券 2025-11-28《汉得信息：自建AI应用体系，单季AI收入破亿》
  - 国信证券 2025-11-03《SNOWFLAKE：专注于数据云服务，分析、AI与应用开发一体构筑生态壁垒》
  - 开源证券 2025-11-05《好未来：AI应用重塑教育生态，最新季度营收&利润超预期》
入库：node scripts/insert-cases.mjs cases_json/gen_research_run3_batch1_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run3_batch1_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公司财报/业绩会披露与一致预期整理，部分为财年口径或前瞻性指引；"
        "AI 应用商业化仍受 ROI 验证周期、客户付费意愿与生态绑定深度影响，国内落地需结合本地业务与数据基础。")

SRC_YX = ("亚信科技：AI大模型应用与交付业务Q3高增，获阿里云深度赋能", "招商证券", "2025-10-30")
SRC_HAND = ("汉得信息：自建AI应用体系，单季AI收入破亿", "东北证券", "2025-11-28")
SRC_SNOW = ("SNOWFLAKE：专注于数据云服务，分析、AI与应用开发一体构筑生态壁垒", "国信证券", "2025-11-03")
SRC_TAL = ("好未来：AI应用重塑教育生态，最新季度营收&利润超预期", "开源证券", "2025-11-05")


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
            "text": f"{org['name']}的「{title}」源自公司财报/业绩会披露的 AI 应用量化数据，可供同行业企业参考。",
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


ASIAINFO = {
    "id": "org-asiainfo", "name": "亚信科技", "size": "large", "region": "中国", "type": "domestic",
    "industry": "software-internet", "scenarios": ["agent"],
    "businessFunctions": ["市场与销售", "研发与设计"],
    "suitableFor": "通信、政企客户的 AI 大模型应用交付与行业智能体落地",
    "prerequisites": "具备行业软件积累与交付团队，有大模型集成、行业知识库与生态合作（如云厂商）能力",
}
HAND = {
    "id": "org-hand", "name": "汉得信息", "size": "large", "region": "中国", "type": "domestic",
    "industry": "software-internet", "scenarios": ["agent", "knowledge-base"],
    "businessFunctions": ["市场与销售", "研发与设计"],
    "suitableFor": "制造业、消费等企业的 B 端 AI 应用与 ERP/流程智能化落地",
    "prerequisites": "具备企业 IT 服务与客户基础，有自研 AI 应用体系与知识库构建能力",
}
SNOWFLAKE = {
    "id": "org-snowflake", "name": "Snowflake", "size": "giant", "region": "海外", "type": "foreign",
    "industry": "software-internet", "scenarios": ["knowledge-base", "ai-infra", "agent"],
    "businessFunctions": ["研发与设计", "战略与运营"],
    "suitableFor": "数据密集型企业的数据云 + AI 分析智能体落地",
    "prerequisites": "具备云原生数据仓库与多集群架构，有 Cortex AI、Snowpark 等 AI 开发与推理平台能力",
}
TAL = {
    "id": "org-tal", "name": "好未来(TAL)", "size": "large", "region": "海外", "type": "foreign",
    "industry": "education", "scenarios": ["content-generation", "agent"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "教育机构的 AI 课堂、智能硬件与个性化学习落地",
    "prerequisites": "具备教研内容与硬件产品能力，有自研教育大模型与个性化推荐引擎",
}

CASES = [
    mk("run3-asiainfo-ai-delivery",
       "亚信科技：AI 大模型应用与交付业务收入超 7500 万、同比 +26 倍，订单破 1.5 亿",
       ASIAINFO,
       "亚信科技将大模型能力封装为面向政企客户的 AI 应用与交付服务，成为阿里云「能力中心」伙伴。前三季度 AI 大模型应用与交付业务收入超 7500 万元、同比增长约 26 倍，新增订单突破 1.5 亿元，验证了 to B 大模型交付的商业化路径。",
       "通信软件服务商向 AI 应用服务商转型，需把大模型能力转化为可交付、可收费的行业解决方案。",
       "政企客户有 AI 需求但缺乏落地能力与行业 Know-how；单纯卖模型难以形成持续收入。",
       "依托大模型构建行业 AI 应用，提供从咨询、定制到交付的一体化服务，并绑定阿里云生态作为「能力中心」放大交付半径。",
       ["大模型行业应用构建", "政企客户交付", "阿里云能力中心合作", "订单规模化"],
       [{"label": "AI 大模型应用与交付 Q3 收入", "value": "超 7500 万元（同比 +26 倍）", "kind": "actual"},
        {"label": "新增订单", "value": "突破 1.5 亿元", "kind": "actual"},
        {"label": "生态地位", "value": "阿里云「能力中心」伙伴", "kind": "actual"}],
       "以「大模型应用交付」打开政企 AI 收费市场，收入增速与订单规模验证 to B 交付模式跑通。",
       ["大模型", "智能体", "行业知识库", "AI 交付"], ["通义千问（阿里云）", "自研行业大模型"],
       ["AI交付", "政企AI", "亚信科技", "阿里云", "大模型应用"],
       [{"id": "src-run3-yx", "title": SRC_YX[0], "publisher": SRC_YX[1], "type": "institution",
         "url": "", "publishedAt": SRC_YX[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_YX[0], "publisher": SRC_YX[1], "year": 2025},
       "2025-10-30", 2025, conf="high", featured=False),

    mk("run3-hand-deling-ai",
       "汉得信息：自建「得灵」B 端 AI 体系，2025Q3 单季 AI 收入破亿",
       HAND,
       "汉得信息搭建「得灵」B 端 AI 应用体系，面向企业客户提供 AI+ERP、知识库、流程自动化等交付。2025Q3 单季 AI 相关收入突破 1 亿元、前三季度约 2.1 亿元，全年目标 3 亿元、2026 年目标 5-6 亿元，标志传统 IT 服务商 AI 转型兑现。",
       "企业软件服务商需从项目制交付转向可复制的 AI 产品化收入。",
       "客户 ERP/流程场景碎片化，缺乏统一 AI 入口与知识沉淀；AI 收入难以规模化。",
       "以「得灵」体系整合大模型、企业知识库与流程自动化，提供面向多行业的 B 端 AI 应用与交付，按收入目标阶梯放量。",
       ["得灵 B 端 AI 体系", "企业知识库构建", "流程自动化交付", "行业客户复制"],
       [{"label": "2025Q3 单季 AI 收入", "value": "突破 1 亿元", "kind": "actual"},
        {"label": "前三季度 AI 收入", "value": "约 2.1 亿元", "kind": "actual"},
        {"label": "全年 / 2026 目标", "value": "3 亿元 / 5-6 亿元", "kind": "estimated"}],
       "「得灵」将传统 IT 服务升级为可规模化的 AI 产品收入，单季破亿验证 B 端 AI 商业化。",
       ["大模型", "企业知识库", "流程自动化", "智能体"], ["自研得灵大模型", "主流开源/闭源大模型"],
       ["B端AI", "汉得信息", "得灵", "企业知识库", "AI转型"],
       [{"id": "src-run3-hand", "title": SRC_HAND[0], "publisher": SRC_HAND[1], "type": "institution",
         "url": "", "publishedAt": SRC_HAND[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_HAND[0], "publisher": SRC_HAND[1], "year": 2025},
       "2025-11-28", 2025, conf="high", featured=False),

    mk("run3-snowflake-cortex-agent",
       "Snowflake：以 Cortex AI 构建数据领域 Agent，FY2026Q2 收入 11.45 亿美元（+31.78%）",
       SNOWFLAKE,
       "Snowflake 以「数据云 + Cortex AI」打通数据分析与生成式 AI，推出 Snowflake Intelligence 平台让用户用自然语言创建数据领域 Agent，自动分析汇总企业数据并执行任务。FY2026Q2 收入 11.45 亿美元（同比 +31.78%），全球客户 12062 家，654 家客户年产品消费超 100 万美元。",
       "企业数据散落于数据仓库与湖仓，业务人员难以用自然语言直接分析与行动。",
       "数据分析门槛高、依赖工程师；生成式 AI 缺乏企业专属数据与治理底座。",
       "以 Snowflake Intelligence + Cortex AI 让用户用自然语言发掘数据，结合 Cortex Analyst/Search 与企业数据交互，构建可执行的「数据 Agent」。",
       ["Snowflake Intelligence 平台", "Cortex AI 数据分析", "Snowpark 模型训练", "Native App 分发"],
       [{"label": "FY2026Q2 收入", "value": "11.45 亿美元（同比 +31.78%）", "kind": "actual"},
        {"label": "全球客户", "value": "12062 家", "kind": "actual"},
        {"label": "年产品消费超 100 万美元客户", "value": "654 家（同比 +29.76%）", "kind": "actual"}],
       "数据云与 AI 融合提升客户黏性与消费，AI 新品推动平台从「存储计算」迈向「数据智能体」。",
       ["数据云", "Cortex AI", "Snowpark", "生成式AI"], ["Cortex AI", "Snowflake ML"],
       ["数据云", "Snowflake", "Cortex AI", "数据Agent", "海外AI"],
       [{"id": "src-run3-snow", "title": SRC_SNOW[0], "publisher": SRC_SNOW[1], "type": "institution",
         "url": "", "publishedAt": SRC_SNOW[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_SNOW[0], "publisher": SRC_SNOW[1], "year": 2025},
       "2025-11-03", 2025, conf="high", featured=True),

    mk("run3-tal-ai-education",
       "好未来：AI 课堂 + 学习机双轮驱动，FY2026Q2 收入 8.614 亿美元（+39.1%）",
       TAL,
       "好未来将 AI 深度植入教育场景：AI 课堂用「复活」百余名历史作家提升趣味性，学习机推出「AI 思维一对一」。带动 FY2026Q2 收入 8.614 亿美元（同比 +39.1%）、Non-GAAP 净利 1.358 亿美元（同比 +82.7%）；学而思学习机份额 22% 居行业第二。",
       "教培机构转型素质与硬件，需以 AI 提升教学体验与学习硬件竞争力。",
       "线下教学同质化、留存与转化承压；学习硬件需差异化 AI 能力建立护城河。",
       "以自研教育大模型驱动 AI 课堂互动与个性化指导，叠加「AI 思维一对一」学习机，形成「服务 + 硬件」双增长曲线。",
       ["AI 课堂互动重构", "学习机 AI 功能", "个性化学习推荐", "线上线下融合"],
       [{"label": "FY2026Q2 收入", "value": "8.614 亿美元（同比 +39.1%）", "kind": "actual"},
        {"label": "Non-GAAP 净利", "value": "1.358 亿美元（同比 +82.7%）", "kind": "actual"},
        {"label": "学而思学习机份额", "value": "22%（行业第二）", "kind": "actual"},
        {"label": "2025Q3 学习机线上销量", "value": "179.4 万台（同比 +29.6%）", "kind": "actual"}],
       "AI 重塑教学体验与硬件差异化，带动收入与利润双增，学而思稳居学习机头部。",
       ["大模型", "个性化学习", "AI 硬件"], ["自研教育大模型"],
       ["AI教育", "好未来", "学而思", "学习机", "教育大模型"],
       [{"id": "src-run3-tal", "title": SRC_TAL[0], "publisher": SRC_TAL[1], "type": "institution",
         "url": "", "publishedAt": SRC_TAL[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_TAL[0], "publisher": SRC_TAL[1], "year": 2025},
       "2025-11-05", 2025, conf="high", featured=False),
]

if __name__ == "__main__":
    data = [build(c) for c in CASES]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"written {len(data)} cases -> {OUT}")
