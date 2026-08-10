# -*- coding: utf-8 -*-
"""report/ 下 2026 研报抽取 run2 第 5 批（末批）：Meta AI 推荐、字节 Seedance 2.0、特斯拉 Optimus。
来源（report_ocr_batch_20260723_run2/ 新提取）：
  - 浙商证券 2026-02-08《北美云厂商资本开支与AI应用专题报告：AI驱动北美云厂资本开支继续高速增长，但ROIC环比下滑》
  - 长江证券 2026-02-08《AI应用正当时：字节发布Seedance2.0，AI视频生成迈上新台阶》
  - 招商证券 2026-02-09《全球产业趋势跟踪周报（0209）：AI应用加速产业渗透，机器人商业化时间节点前移》
入库：node scripts/insert-cases.mjs cases_json/gen_research_run2_batch5_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run2_batch5_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公司财报会与公开报道整理；Meta 推荐/广告 AI 的留存与变现、Seedance 视频生成的"
        "版权与合规、Optimus 人形机器人量产节奏均存在不确定性。")

SRC_ZS_TITLE = "AI驱动北美云厂资本开支继续高速增长，但ROIC环比下滑——北美云厂商资本开支与AI应用专题报告"
SRC_ZS_PUB = "浙商证券"
SRC_ZS_DATE = "2026-02-08"
SRC_CJ_TITLE = "AI应用正当时：字节发布Seedance2.0，AI视频生成迈上新台阶"
SRC_CJ_PUB = "长江证券"
SRC_CJ_DATE = "2026-02-08"
SRC_ZH_TITLE = "AI应用加速产业渗透，机器人商业化时间节点前移——全球产业趋势跟踪周报（0209）"
SRC_ZH_PUB = "招商证券"
SRC_ZH_DATE = "2026-02-09"


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
            "text": f"{org['name']}的「{title}」源自券商研报披露的数据，可供同业对标。",
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


META = {
    "id": "org-meta", "name": "Meta(Facebook)", "size": "giant", "region": "海外", "type": "foreign",
    "industry": "software-internet", "scenarios": ["agent", "sales"],
    "businessFunctions": ["市场与销售"],
    "suitableFor": "社交/内容平台的 AI 推荐与广告营销优化",
    "prerequisites": "具备海量用户行为与内容数据，有推荐系统与大模型广告优化能力",
}
SEEDANCE = {
    "id": "org-bytedance-seedance", "name": "字节跳动(Seedance)", "size": "giant", "region": "北京", "type": "private",
    "industry": "software-internet", "scenarios": ["content-generation"],
    "businessFunctions": ["市场与销售", "研发与设计"],
    "suitableFor": "短视频、影视与广告行业的 AI 视频生成与制作",
    "prerequisites": "具备视频生成大模型与即梦等分发平台，有多模态参考数据管线",
}
TESLA = {
    "id": "org-tesla", "name": "特斯拉(Tesla)", "size": "giant", "region": "海外", "type": "foreign",
    "industry": "automotive", "scenarios": ["agent", "rnd-design"],
    "businessFunctions": ["研发与设计", "生产制造"],
    "suitableFor": "人形机器人/具身智能的量产与场景落地",
    "prerequisites": "具备自动驾驶技术栈与供应链整合能力，有工厂产线改造与量产基础",
}

CASES = [
    mk("run2-meta-ai-recommendation",
       "Meta：AI 推荐系统拉升用户时长（Instagram 视频 +30%），2025 资本开支 714.6 亿美元",
       META,
       "Meta 以 AI 重构推荐与广告核心主业：在业绩会上披露，凭借更好的推荐系统，Facebook 用户时长提升 5%、Threads 提升 10%、Instagram 视频时长同比增长 30%；AI 升级广告平台与购物体验，赋能核心主业变现。为支撑 AI 战略，Meta 2025 年资本开支达 714.61 亿美元、同比大增 82.2%，并指引 2026 年资本开支 1150-1350 亿美元；25Q4 自由现金流 140.77 亿美元、同比+7.03%，市场认可其现金流反转。",
       "社交平台增长依赖用户时长与广告变现，传统推荐系统难以持续精细化匹配，增长触及天花板。",
       "推荐匹配效率需提升以拉动时长与留存；广告平台需 AI 升级提高转化率与 ROI。",
       "以大模型升级推荐系统提升内容匹配与用户时长；以 AI 重构广告平台与购物体验提高变现；以高强度 Capex 投入 AI 基建与算力保障战略落地。",
       ["AI 推荐系统升级", "广告平台 AI 化", "高强度 Capex 投入", "自由现金流反转"],
       [{"label": "Instagram 视频时长", "value": "同比增长 30%", "kind": "actual"},
        {"label": "Facebook/Threads 用户时长", "value": "分别 +5% / +10%", "kind": "actual"},
        {"label": "2025 资本开支", "value": "714.61 亿美元（同比 +82.2%）", "kind": "actual"},
        {"label": "25Q4 自由现金流", "value": "140.77 亿美元（同比 +7.03%）", "kind": "actual"}],
       "Meta 以 AI 推荐与广告升级直接拉升用户时长与变现，验证社交平台「AI 赋能核心主业」的变现飞轮。",
       ["大模型", "智能体", "智能推荐"], ["Meta 推荐/广告 AI 系统"],
       ["AI推荐", "智能营销", "Meta", "用户时长", "广告AI"],
       [{"id": "src-run2-meta-zs", "title": SRC_ZS_TITLE, "publisher": SRC_ZS_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_ZS_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZS_TITLE, "publisher": SRC_ZS_PUB, "year": 2026},
       "2026-02-08", 2025, conf="high", featured=True),

    mk("run2-bytedance-seedance",
       "字节 Seedance 2.0：视频生成可用率 90%+，5 秒特效成本从 3000 元降至 3 元",
       SEEDANCE,
       "字节跳动发布视频生成模型 Seedance 2.0 并上线即梦平台（会员 69 元起）。其具备自规划分镜与运镜、最多 9 图/3 视频/3 音频的多模态参考、音画同步与多镜头叙事一致性，达到接近「导演级」控制精度。据三方实测，可用率超 90%；成本端，90 分钟项目成本从一万多降至两千多，5 秒特效镜头制作成本从约 3000 元（人力一月）降至 3 元（AI 两分钟），推动 AI 视频从「抽卡玩具」走向工业工具。",
       "影视/短视频制作高度依赖人力，特效与多镜头叙事成本高、周期长，难以规模化与快速迭代。",
       "视频生成需解决运镜控制、多模态参考与角色一致性；成本与稳定性是工业化落地门槛。",
       "以 Seedance 2.0 世界模型雏形承载自规划分镜、多模态参考与音画同步；以即梦平台产品化分发，将生成稳定性与成本下探至工业可用水平。",
       ["Seedance 2.0 视频模型", "即梦平台上线", "导演级运镜控制", "成本下探至工业级"],
       [{"label": "三方实测可用率", "value": "超 90%", "kind": "actual"},
        {"label": "5 秒特效成本", "value": "约 3000 元（人力）→ 3 元（AI）", "kind": "actual"},
        {"label": "90 分钟项目成本", "value": "一万多 → 两千多", "kind": "actual"}],
       "Seedance 2.0 以高可用率与极致成本下探，推动 AI 视频从玩具走向工业工具，重构影视/短视频制作成本结构。",
       ["大模型", "多模态", "视频生成"], ["字节 Seedance 2.0", "即梦平台"],
       ["视频生成", "Seedance", "AI视频", "字节跳动", "即梦"],
       [{"id": "src-run2-sd-cj", "title": SRC_CJ_TITLE, "publisher": SRC_CJ_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_CJ_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_CJ_TITLE, "publisher": SRC_CJ_PUB, "year": 2026},
       "2026-02-08", 2026, conf="high", featured=True),

    mk("run2-tesla-optimus",
       "特斯拉 Optimus：第三代人形机器人亮相，目标年产百万台切入具身智能量产",
       TESLA,
       "特斯拉将战略重心延伸至具身智能，第三代 Optimus 人形机器人即将亮相，从第一性原理重新设计、可观察人类行为学习新技能，目标年产量达 100 万台；弗里蒙特工厂正转型生产 Optimus。同期 Figure AI 发布 Helix 02 实现单一神经网络对机器人全身自主控制，宇树开源 UnifoLM-VLA-0，行业从技术验证期迈入商业化初期。高盛预计全球人形机器人市场 2035 年达 1540 亿美元。",
       "制造业与服务业面临人力成本上升与高危/重复岗位缺口，通用型机器人需突破硬件与智能控制瓶颈。",
       "人形机器人量产受灵巧手、关节协同与训练数据瓶颈制约；需从研发走向量产落地。",
       "以自动驾驶技术栈与供应链整合能力赋能 Optimus；以工厂产线改造支撑量产，目标百万台级年产能，推动具身智能从验证走向规模化。",
       ["Optimus 第三代", "弗里蒙特工厂转型", "百万台年产目标", "具身智能量产"],
       [{"label": "Optimus 目标年产能", "value": "100 万台", "kind": "estimated"},
        {"label": "行业市场（高盛）", "value": "2035 年全球人形机器人 1540 亿美元", "kind": "estimated"},
        {"label": "技术里程碑", "value": "单一神经网络全身自主控制（Helix 02）", "kind": "actual"}],
       "特斯拉以量产能力切入人形机器人，推动具身智能从技术验证走向规模化商用，打开新增长曲线。",
       ["大模型", "智能体", "具身智能", "机器人"], ["特斯拉 Optimus", "FSD 技术栈"],
       ["人形机器人", "Optimus", "具身智能", "特斯拉", "量产"],
       [{"id": "src-run2-tesla-zh", "title": SRC_ZH_TITLE, "publisher": SRC_ZH_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_ZH_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZH_TITLE, "publisher": SRC_ZH_PUB, "year": 2026},
       "2026-02-09", 2026, conf="medium", featured=False, outcome="partial"),
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
