# -*- coding: utf-8 -*-
"""report/ 下 2025 研报抽取 run3 第 2 批：教育 / 医疗健康 / 软件与互联网 AI 应用
来源（report_ocr_run3/ 新提取）：
  - 交银国际 2025-11-06《有道：AI技术及应用推动广告、高中业务稳健增长；维持买入》
  - 中信建投 2025-12-21《医疗器械行业简评：AI健康应用蚂蚁阿福下载量攀升，继续看好AI医疗投资机会》
  - 招银国际 2025-11-14《百度：2025百度世界大会：推动AI应用加速落地》
  - 渤海证券 2025-12-18《计算机行业周报：小米发布开源大模型，AI应用布局有望深化》
入库：node scripts/insert-cases.mjs cases_json/gen_research_run3_batch2_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run3_batch2_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公司业绩会/财报与第三方榜单整理，部分为预测或单季度口径；"
        "C 端 AI 应用受用户留存、付费转化与硬件周期影响，商业化持续性需持续观察。")

SRC_DAO = ("有道：AI技术及应用推动广告、高中业务稳健增长；维持买入", "交银国际", "2025-11-06")
SRC_AFU = ("医疗器械行业简评：AI健康应用蚂蚁阿福下载量攀升，继续看好AI医疗投资机会", "中信建投", "2025-12-21")
SRC_BIDU = ("百度：2025百度世界大会：推动AI应用加速落地", "招银国际", "2025-11-14")
SRC_XIAOMI = ("计算机行业周报：小米发布开源大模型，AI应用布局有望深化", "渤海证券", "2025-12-18")


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
            "text": f"{org['name']}的「{title}」源自公司业绩会/财报披露的 AI 应用数据，可供同类企业借鉴。",
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


DAO = {
    "id": "org-dao", "name": "网易有道(DAO)", "size": "large", "region": "海外", "type": "foreign",
    "industry": "education", "scenarios": ["sales", "content-generation"],
    "businessFunctions": ["市场与销售", "研发与设计"],
    "suitableFor": "教育科技公司的 AI 广告与学习产品智能化",
    "prerequisites": "具备教育内容与流量基础，有自研教育/翻译大模型与广告算法能力",
}
AFU = {
    "id": "org-antafu", "name": "蚂蚁集团(蚂蚁阿福)", "size": "giant", "region": "中国", "type": "domestic",
    "industry": "healthcare", "scenarios": ["customer-service", "knowledge-base"],
    "businessFunctions": ["客户成功"],
    "suitableFor": "C 端健康管理、医疗问答与硬件数据联动场景",
    "prerequisites": "具备医疗大模型、健康知识库与多设备数据接入能力",
}
BAIDU = {
    "id": "org-baidu", "name": "百度(Baidu)", "size": "giant", "region": "中国", "type": "domestic",
    "industry": "software-internet", "scenarios": ["agent", "sales", "content-generation"],
    "businessFunctions": ["市场与销售", "研发与设计", "战略与运营"],
    "suitableFor": "搜索、内容、营销与无代码开发等 C 端/企业 AI 应用落地",
    "prerequisites": "具备自研大模型、数字人、智能体与无代码开发平台等全栈 AI 能力",
}
XIAOMI = {
    "id": "org-xiaomi", "name": "小米(Xiaomi)", "size": "giant", "region": "中国", "type": "domestic",
    "industry": "software-internet", "scenarios": ["rnd-design", "agent"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "手机、汽车、智能家居厂商的开源大模型与智能体布局",
    "prerequisites": "具备大模型自研能力，有终端硬件与互联网服务生态矩阵",
}

CASES = [
    mk("run3-dao-ai-growth",
       "网易有道：AI 技术推动广告收入同比 +40%，AI 落地提升高中与硬件竞争力",
       DAO,
       "有道以 AI 技术驱动广告与学习业务，3Q 广告收入在 AI 应用及新客户拓展推动下预计同比 +40%，AI 产品持续落地提升高中与智能硬件竞争力，AI 成为教育科技公司第二增长曲线。",
       "教育科技公司需以 AI 提升广告变现与学习产品差异化。",
       "广告与学习业务增长承压，硬件需以 AI 功能带动付费与留存。",
       "以自研教育/翻译大模型赋能广告投放与高中学习产品，并持续提升智能硬件 AI 能力，形成「广告 + 学习 + 硬件」协同。",
       ["AI 广告算法", "高中学习 AI 产品", "智能硬件 AI 功能", "新客户拓展"],
       [{"label": "3Q 广告收入（预计）", "value": "同比 +40%", "kind": "estimated"},
        {"label": "3Q 总收入（预计）", "value": "16.03 亿元（同比 +2%）", "kind": "estimated"},
        {"label": "AI 作用", "value": "提升高中与硬件产品竞争力", "kind": "actual"}],
       "AI 直接拉动广告增速并强化学习/硬件产品力，验证教育科技 AI 变现路径。",
       ["大模型", "AI 广告", "教育AI"], ["自研教育大模型", "AI 翻译模型"],
       ["AI教育", "网易有道", "AI广告", "教育大模型"],
       [{"id": "src-run3-dao", "title": SRC_DAO[0], "publisher": SRC_DAO[1], "type": "institution",
         "url": "", "publishedAt": SRC_DAO[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_DAO[0], "publisher": SRC_DAO[1], "year": 2025},
       "2025-11-06", 2025, conf="high", featured=False),

    mk("run3-antafu-health",
       "蚂蚁阿福：月活 1500 万居健康管理 AI 首位，新版 App 下载量登苹果总榜第 3",
       AFU,
       "蚂蚁集团旗下 AI 健康应用「蚂蚁阿福」完成品牌升级，月活达 1500 万稳居健康管理类 AI 应用首位，新版 App 发布后下载量位居苹果应用商店总榜第 3，可绑定三诺、鱼跃等硬件数据并给出专属健康建议，验证 C 端健康管理 AI 的用户价值。",
       "健康管理需求高频但分散，用户缺乏持续、可理解的健康陪伴与建议。",
       "健康数据孤岛、专业建议获取门槛高；C 端健康 AI 留存与信任难建立。",
       "以医疗大模型 + 健康知识库构建 AI 健康助手，打通多品牌硬件数据，提供实时监测与个性化建议，借生态流量快速起量。",
       ["医疗大模型构建", "健康知识库", "多硬件数据接入", "C 端流量分发"],
       [{"label": "月活", "value": "1500 万（健康管理 AI 首位）", "kind": "actual"},
        {"label": "新版 App 下载量", "value": "苹果应用商店总榜第 3", "kind": "actual"},
        {"label": "硬件联动", "value": "绑定三诺/鱼跃血糖、血压等设备数据", "kind": "actual"}],
       "C 端健康管理 AI 通过高频陪伴与硬件联动建立用户黏性，登顶下载榜验证需求。",
       ["大模型", "健康知识库", "多模态"], ["蚂蚁医疗大模型"],
       ["AI医疗", "蚂蚁阿福", "健康管理", "医疗大模型"],
       [{"id": "src-run3-afu", "title": SRC_AFU[0], "publisher": SRC_AFU[1], "type": "institution",
         "url": "", "publishedAt": SRC_AFU[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_AFU[0], "publisher": SRC_AFU[1], "year": 2025},
       "2025-12-21", 2025, conf="high", featured=False),

    mk("run3-baidu-ai-matrix",
       "百度：文心 5.0 + 超级智能体「伐谋」，慧播星双 11 GMV +91%、GenFlow 用户超 2000 万",
       BAIDU,
       "百度在 2025 世界大会发布文心 5.0 与全球首个可商用自我演化超级智能体「伐谋」；慧播星数字人双 11 期间 83% 开播主播使用、直播间 GMV 同比 +91%；文库网盘 GenFlow 智能体用户超 2000 万，无代码工具秒哒 2.0 累计生成 40 万+ 应用，AI 应用矩阵规模化落地。",
       "搜索与内容巨头需以原生多模态大模型重构核心产品并孵化新 AI 应用。",
       "搜索流量见顶、内容生产低效；企业缺乏可用的超级智能体与无代码开发工具。",
       "以文心 5.0 重构搜索/文库/网盘，推出自我演化超级智能体「伐谋」与数字人、无代码工具，形成「模型 + 智能体 + 应用」矩阵。",
       ["文心 5.0 重构核心产品", "伐谋超级智能体", "慧播星数字人", "秒哒无代码 + GenFlow"],
       [{"label": "慧播星数字人（双 11）", "value": "83% 主播使用、GMV +91%", "kind": "actual"},
        {"label": "GenFlow 智能体用户", "value": "超 2000 万（全球最大通用 Agent）", "kind": "actual"},
        {"label": "秒哒 2.0 生成应用", "value": "40 万+（服务超千万用户）", "kind": "actual"},
        {"label": "AI 搜索首条富媒体覆盖", "value": "约 70%", "kind": "actual"}],
       "多模态大模型驱动核心产品重构与智能体变现，数字人/无代码/通用 Agent 多点放量。",
       ["文心大模型", "智能体", "数字人", "无代码"], ["文心 5.0", "伐谋超级智能体"],
       ["百度", "文心大模型", "智能体", "数字人", "无代码", "AI应用矩阵"],
       [{"id": "src-run3-baidu", "title": SRC_BIDU[0], "publisher": SRC_BIDU[1], "type": "institution",
         "url": "", "publishedAt": SRC_BIDU[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_BIDU[0], "publisher": SRC_BIDU[1], "year": 2025},
       "2025-11-14", 2025, conf="high", featured=True),

    mk("run3-xiaomi-mimo",
       "小米：开源 MiMo-V2-Flash MoE 模型，代码能力比肩 Claude 4.5 而成本仅 2.5%",
       XIAOMI,
       "小米发布 Xiaomi MiMo-V2-Flash 开源 MoE 模型（总参 309B / 活跃 15B），专为智能体设计；多个 Agent 基准进入全球开源 Top2，代码能力超越所有开源模型、比肩 Claude 4.5 Sonnet，而推理成本仅其 2.5%、速度提升 2 倍，并上线 MiMO Studio 在线服务，依托手机/汽车/家居生态推进 AI 深度融合。",
       "终端厂商需以自研大模型打通硬件与互联网服务的 AI 体验。",
       "闭源模型成本高、生态绑定强；终端场景需要高性价比、Agent 友好的模型。",
       "自研 MiMo 系列 MoE 模型并以开源策略构建开发者生态，上线 MiMO Studio 在线体验，将模型能力注入手机、汽车与智能家居产品。",
       ["MiMo-V2-Flash 开源", "MiMO Studio 在线服务", "Agent 基准优化", "终端生态融合"],
       [{"label": "模型规模", "value": "总参 309B / 活跃 15B（专为 Agent）", "kind": "actual"},
        {"label": "Agent 基准", "value": "全球开源 Top2", "kind": "actual"},
        {"label": "代码能力 vs 成本", "value": "比肩 Claude 4.5 Sonnet、成本仅 2.5%、速度 2 倍", "kind": "actual"}],
       "开源高性能 MoE 模型以极致性价比建立开发者生态，并反哺终端 AI 体验闭环。",
       ["开源大模型", "MoE", "智能体"], ["Xiaomi MiMo-V2-Flash"],
       ["小米", "MiMo", "开源大模型", "MoE", "智能体"],
       [{"id": "src-run3-xiaomi", "title": SRC_XIAOMI[0], "publisher": SRC_XIAOMI[1], "type": "institution",
         "url": "", "publishedAt": SRC_XIAOMI[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_XIAOMI[0], "publisher": SRC_XIAOMI[1], "year": 2025},
       "2025-12-18", 2025, conf="high", featured=True),
]

if __name__ == "__main__":
    data = [build(c) for c in CASES]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"written {len(data)} cases -> {OUT}")
