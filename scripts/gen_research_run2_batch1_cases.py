# -*- coding: utf-8 -*-
"""report/ 下 2026 研报抽取 run2 第 1 批：公司覆盖类新公司（之前未处理）。
来源（report_ocr_batch_20260723_run2/ 新提取）：
  - 海通国际 2025-12-19《百融云创：硅基员工的推出有望重塑 to B 端 AI 应用商业模式》
  - 天风证券 2026-02-09《瑞芯微：AIoT 应用多点开花，平台化布局深耕边端侧 AI》
  - 国信证券 2026-02-10《哔哩哔哩深度：跨越盈利拐点，AI应用与游戏品类扩张加速商业化价值释放》
  - 广发证券 2026-02-11《星环科技：25Q4 收入增长提速，AI 基础软件发展前景向好》
（注：以上 4 家为 report/ 当前批次中 AI 落地动作明确、量化数据扎实的公司；其余新公司
  蘅东光/中科环保/科翔股份 自身 AI 应用动作弱，仅为 AI 基建供应链受益，按"典型案例"标准跳过）
入库：node scripts/insert-cases.mjs cases_json/gen_research_run2_batch1_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run2_batch1_cases.json")
COLLECTED = "2026-07-23"


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
            "text": f"{org['name']}的「{title}」源自券商研报披露的企业 AI 落地数据，可供同业对标。",
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


RISK = ("数据来自券商基于公司公告/业绩预告与公开报道整理，部分为产品宣称指标或一致预期；"
        "AI 商业化落地效果、客户付费意愿与合规（数据隐私、金融/内容监管）是规模化主要约束。")

# ---------- 百融云 ----------
BAIRONG = {
    "id": "org-bairong", "name": "百融云", "size": "medium", "region": "北京", "type": "private",
    "industry": "finance", "scenarios": ["agent", "customer-service", "sales", "knowledge-base"],
    "businessFunctions": ["市场与销售", "客户成功"],
    "suitableFor": "金融机构、保险及企业服务商的 AI 员工/智能体落地",
    "prerequisites": "具备金融/保险业务数据与自有或第三方大模型，有 Agent 生命周期管理与商业化运营基础",
}
# ---------- 瑞芯微 ----------
ROCKCHIP = {
    "id": "org-rockchip", "name": "瑞芯微", "size": "medium", "region": "福州", "type": "private",
    "industry": "manufacturing", "scenarios": ["agent", "ai-infra", "rnd-design"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "端侧/边缘侧 AI 设备厂商（机器人、汽车、工业视觉、消费电子）",
    "prerequisites": "具备 SoC/NPU 自研能力，有端侧大模型部署与软硬协同优化基础",
}
# ---------- 哔哩哔哩 ----------
BILIBILI = {
    "id": "org-bilibili", "name": "哔哩哔哩", "size": "large", "region": "上海", "type": "private",
    "industry": "software-internet", "scenarios": ["content-generation", "sales"],
    "businessFunctions": ["市场与销售"],
    "suitableFor": "内容平台、视频社区与品牌主的 AI 营销/内容生成",
    "prerequisites": "具备海量内容与用户行为数据，有智能营销工具与 GEO 内容优化能力",
}
# ---------- 星环科技 ----------
TRANSWARP = {
    "id": "org-transwarp", "name": "星环科技", "size": "medium", "region": "上海", "type": "private",
    "industry": "software-internet", "scenarios": ["knowledge-base", "ai-infra", "agent"],
    "businessFunctions": ["信息技术"],
    "suitableFor": "金融、能源、政务等行业的企业数智化与 AI 基础软件部署",
    "prerequisites": "具备数据全生命周期管理需求，有国产软硬件生态适配与向量库/知识平台落地基础",
}

CASES = [
    mk("run2-bairong-silicon-employee",
       "百融云：发布 ResultsCloud 平台与「硅基员工」，以 RaaS 模式重塑 to B AI 应用",
       BAIRONG,
       "2025 年 12 月，百融云创发布 ResultsCloud 平台，以「AI Infra 推理引擎 + AgentOS 智能操作系统 + AgentStore 应用商店」三层架构打造「硅基员工」（类 AI Agent）生态，提出 RaaS（Results-as-a-Service）商业模式，推动企业从「卖工具」向「卖结果」转型。首批四大硅基员工产品覆盖客服营销、招聘、跨境法财税、知识生产，量化成效显著。",
       "to B 软件长期以「卖工具/订阅」为主，客户需自行落地才能见效，厂商与业务结果脱节，难以规模化绑定客户价值。",
       "企业希望直接获得业务结果而非工具；B 端落地需解决部署周期、行业模型适配与持续迭代难题。",
       "以 ResultsCloud 三层架构落地硅基员工：自研 BRVorlex 推理引擎统一加速多模型，AgentOS 两周内部署并「越用越聪明」，AgentStore 上架行业硅基员工产品，按 RaaS 收费绑定业务结果。",
       ["ResultsCloud 平台发布", "BRVorlex 推理引擎", "AgentOS 两周部署", "AgentStore 四大硅基员工"],
       [{"label": "BRVorlex 推理性能", "value": "较通用框架提升 300%", "kind": "actual"},
        {"label": "百盈（客服营销）客户满意度", "value": "提升 40%", "kind": "actual"},
        {"label": "百才（招聘）周期/人效", "value": "缩短至 28 天、人效提升 5 倍", "kind": "actual"},
        {"label": "百鉴（跨境法财税）效率/成本", "value": "效率提升 90%、成本降低 70%", "kind": "actual"},
        {"label": "百智（知识生产）周期/效率", "value": "周期压缩至 4 天、效率提升 400%", "kind": "actual"}],
       "硅基员工以 RaaS 重构 to B AI 商业模式，四大产品量化成效突出，验证「卖结果」的可行性与高人效。",
       ["大模型", "智能体", "AI Infra", "RaaS"], ["BRVorlex 推理引擎", "百融自研金融/保险专用模型"],
       ["AI员工", "硅基员工", "RaaS", "金融AI", "智能体"],
       [{"id": "src-run2-bairong", "title": "百融云创：硅基员工的推出有望重塑 to B 端 AI 应用商业模式",
         "publisher": "海通国际", "type": "institution", "url": "", "publishedAt": "2025-12-19",
         "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]}],
       {"title": "百融云创：硅基员工的推出有望重塑 to B 端 AI 应用商业模式", "publisher": "海通国际", "year": 2025},
       "2025-12-19", 2025, conf="high", featured=True),

    mk("run2-rockchip-rk182x",
       "瑞芯微：端侧 AI 芯片龙头，RK182X 协处理器赋能 AIoT 设备向「环境智能体」演进",
       ROCKCHIP,
       "瑞芯微深耕端侧 AI SoC，自研 NPU 支持 1.5B/3B/7B 主流大模型本地部署。2025 年推出全球首款 3D 堆叠架构端侧算力协处理器 RK182X，运行 Qwen2.5-3B 达 100 Token/s（约市场同类 3 倍）、Qwen3-VL-2B 达 136 TPS；较竞品实现 3 倍性能提升与 6 倍能耗比优化。RK182X 已导入十余行业、数百客户项目，赋能机器人、汽车座舱、工业视觉等向「智能体」演进。",
       "端侧设备受带宽、功耗、延迟约束，大模型难以本地化部署，传统硬件仅能「看清」无法「看懂」，缺乏场景理解与主动服务能力。",
       "端侧大模型部署面临带宽/功耗瓶颈；碎片化 AIoT 场景需要高效、低功耗、可复用算力的芯片方案。",
       "以「SoC + 协处理器」双轨战略，自研 NPU 与 3D 堆叠 RK182X 协处理器支持视频/视觉/音频/文本多模态 AI；开放机器人 SDK 与汽车座舱方案，赋能数百客户项目规模化落地。",
       ["自研 NPU 多算力等级", "RK182X 3D 堆叠协处理器", "机器人/汽车 SDK", "十余行业数百客户导入"],
       [{"label": "2025 预计营收", "value": "43.87-44.27 亿元（同比 +39.88%~41.15%）", "kind": "actual"},
        {"label": "2025 预计归母净利", "value": "10.23-11.03 亿元（同比 +71.97%~85.42%）", "kind": "actual"},
        {"label": "RK182X 运行 Qwen2.5-3B", "value": "超 100 Token/s（约同类 3 倍）", "kind": "actual"},
        {"label": "RK182X 性能/能耗比", "value": "3 倍性能提升、6 倍能耗比优化", "kind": "actual"},
        {"label": "RK3588M 汽车座舱", "value": "进入多家头部车企、覆盖超 10 款车型", "kind": "actual"}],
       "端侧 AI 芯片以高算力、低功耗与多模态能力，驱动 AIoT 设备从功能机向智能体演进，带动公司营收与净利高增。",
       ["大模型", "智能体", "端侧 AI", "AI 芯片"], ["瑞芯微自研 NPU", "RK182X 端侧算力协处理器"],
       ["端侧AI", "AI芯片", "AIoT", "RK182X", "智能体"],
       [{"id": "src-run2-rockchip", "title": "瑞芯微：AIoT 应用多点开花，平台化布局深耕边端侧 AI",
         "publisher": "天风证券", "type": "institution", "url": "", "publishedAt": "2026-02-09",
         "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]}],
       {"title": "瑞芯微：AIoT 应用多点开花，平台化布局深耕边端侧 AI", "publisher": "天风证券", "year": 2026},
       "2026-02-09", 2025, conf="high", featured=True),

    mk("run2-bilibili-ai-marketing",
       "哔哩哔哩：2026「双核」战略以 AI 赋能营销，AI 内容播放量高增长、Q3 净利同比 +233%",
       BILIBILI,
       "B站 2026 年明确「内容心智 + AI 技术」双核战略，AI 技术全面融入营销环节，AI 内容播放量保持高增长；结合 GEO 产业趋势与「哔哩必达」等工具提升营销效率，有望对标 Meta 的 AI 商业化路径。2025 年实现全年扭亏为盈，Q3 调整后净利润 7.9 亿元、同比大增 233%，广告连续 11 个季度保持超 20% 增长。",
       "内容平台商业化长期受困于变现效率与单用户广告价值偏低，需以 AI 提升营销精准度与内容生产效率。",
       "广告变现效率低于行业均值；长视频内容成本高，需降低内容成本占比并提升单位时长收入。",
       "以双核战略将 AI 全面融入营销：AI 生成/优化内容提升播放与互动，GEO 与「哔哩必达」工具提升广告投放与匹配效率，释放百亿级广告增量空间。",
       ["双核战略", "AI 赋能营销", "哔哩必达工具", "GEO 内容优化"],
       [{"label": "2025 Q3 调整后净利润", "value": "7.9 亿元（同比 +233%）", "kind": "actual"},
        {"label": "2025 全年", "value": "扭亏为盈（盈利元年）", "kind": "actual"},
        {"label": "MAU / DAU", "value": "3.76 亿 / 1.17 亿，日均使用 112 分钟", "kind": "actual"},
        {"label": "广告增速", "value": "连续 11 个季度超 20% 增长", "kind": "actual"},
        {"label": "月付费用户", "value": "0.35 亿（同比 +17%）", "kind": "actual"}],
       "AI 赋能营销显著提升 B站商业化效率与盈利质量，从流量平台向高壁垒 AI 内容商业化生态演进。",
       ["大模型", "智能营销", "内容生成", "GEO"], ["哔哩必达 AI 营销平台"],
       ["AI营销", "内容平台", "哔哩哔哩", "GEO", "扭亏为盈"],
       [{"id": "src-run2-bilibili", "title": "哔哩哔哩深度：跨越盈利拐点，AI应用与游戏品类扩张加速商业化价值释放",
         "publisher": "国信证券", "type": "institution", "url": "", "publishedAt": "2026-02-10",
         "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]}],
       {"title": "哔哩哔哩深度：跨越盈利拐点，AI应用与游戏品类扩张加速商业化价值释放", "publisher": "国信证券", "year": 2026},
       "2026-02-10", 2025, conf="high", featured=True),

    mk("run2-transwarp-ai-infra",
       "星环科技：AI 基础软件矩阵（TDH/Sophon LLMOps/向量库）落地金融能源政务，25Q4 营收提速",
       TRANSWARP,
       "星环科技打造大数据与 AI 基础软件矩阵，涵盖 TDH 大数据平台、Sophon LLMOps 大模型运营工具、向量数据库 Hippo、知识平台 TKH。25Q4 营收 1.9-2.2 亿元、同比 +20.4%~38.9%（显著高于前三季度 7.4%），反映 AI 基础软件旺盛需求；基于海光 CPU 的 ArgoDB 联合方案在金融、能源、政务多行业落地并创 TPC-DS 性能纪录，受益于信息系统国产替代。",
       "企业数智化转型需要自主可控的数据与 AI 基础软件，但国产替代早期客户拓展慢、研发投入大、成果转化不确定。",
       "公共部门/金融机构 IT 支出波动，向量库、知识平台等 AI 工具需与客户数据量及业务升级绑定才能放量。",
       "以 TDH/Sophon LLMOps/Hippo/TKH 产品矩阵覆盖数据全生命周期与大模型运营；ArgoDB 联合国产 CPU 在关键行业落地，强化自主可控与国产替代优势。",
       ["大数据与 AI 基础软件矩阵", "ArgoDB 国产 CPU 联合方案", "金融/能源/政务落地", "亏损收窄"],
       [{"label": "25 全年营收", "value": "4.2-4.5 亿元（同比 +13.06%~21.13%）", "kind": "actual"},
        {"label": "25Q4 营收", "value": "1.9-2.2 亿元（同比 +20.4%~38.9%）", "kind": "actual"},
        {"label": "ArgoDB 联合方案", "value": "创 TPC-DS 性能纪录，落地多行业", "kind": "actual"},
        {"label": "25 年亏损", "value": "归母 -2.5~-2.2 亿元（较上年 -3.4 亿收窄）", "kind": "actual"}],
       "AI 基础软件需求旺盛带动营收提速与亏损收窄，国产替代趋势下产品矩阵在多行业加速渗透。",
       ["大模型", "知识库", "向量数据库", "AI 基础软件"], ["Sophon LLMOps", "Transwarp Hippo 向量库", "TKH 知识平台"],
       ["AI基础软件", "向量数据库", "知识平台", "国产替代", "星环科技"],
       [{"id": "src-run2-transwarp", "title": "星环科技：25Q4 收入增长提速，AI 基础软件发展前景向好",
         "publisher": "广发证券", "type": "institution", "url": "", "publishedAt": "2026-02-11",
         "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]}],
       {"title": "星环科技：25Q4 收入增长提速，AI 基础软件发展前景向好", "publisher": "广发证券", "year": 2026},
       "2026-02-11", 2025, conf="medium", featured=False, outcome="partial"),
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
