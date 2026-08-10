# -*- coding: utf-8 -*-
"""report/ 下 2026 券商研报（公司覆盖类）第 3 批。
来源（report_ocr_batch_20260723/ 新提取）：
  - 咸亨国际  605056   西部证券 2026-04-14
  - 昆仑万维  300418   华泰证券 2026-04-26
  - 恺英网络  002517   国信证券 2026-04-29
  - 中科创达  300496   中银国际 2026-05-01
  - 腾讯控股  0700.HK  中泰证券 2026-05-15
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch3_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch3_cases.json")
COLLECTED = "2026-07-23"
RISK = ("研报数据为卖方预测与公开披露，部分 AI 业务量化成效处于投入或早期落地阶段，存在不及预期与合规风险；"
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
    mk("research-2026-xianheng-ai", "咸亨国际：SCM-AI 引入 DeepSeek，四足巡检机器人落地能源管网",
       {"id": "org-xianheng", "name": "咸亨国际", "size": "large", "region": "浙江杭州", "type": "private"},
       "manufacturing", ["agent", "ai-infra", "quality-inspection"], ["生产制造", "战略与运营"],
       "咸亨国际在 SCM-AI（供应链协同报价管理系统）大模型多模组能力中引入 DeepSeek 开源大模型，推动供应链管理从“流程驱动”向“认知驱动”跃迁；并依托“感知—决策—执行”具身智能体系，落地四足巡检机器人等应用，2025 年 4 月取得国家石油天然气管网集团首个行业级四足机器人成套解决方案项目，2026 年 3 月参与起草《电力厂站足式机器人巡检》团体标准。",
       "咸亨国际为 MRO 集约化供应商，下游能源、电网、应急等场景对智能巡检与供应链效率诉求提升，传统人工模式效率低、风险高。",
       "供应链协同报价依赖人工流程，效率低；电网/油气等高危场景人工巡检风险高、覆盖难；具身智能需求非标化与技术供给标准化存在错位。",
       "在 SCM-AI 中引入 DeepSeek 开源大模型，重塑供应链协同报价与物料管理能力；以四足/无人机等具身智能产品切入电力、管网巡检场景，构建空地一体化智能调度与协同作业体系。",
       ["SCM-AI 引入 DeepSeek", "四足巡检机器人研发与落地", "国家管网首单行业级项目", "参与足式机器人巡检团体标准"],
       [{"label": "国家管网四足机器人项目", "value": "首个行业级四足机器人成套解决方案项目", "kind": "actual"},
        {"label": "电缆故障数据积累", "value": "超 1.3 万次检测、1 万+ 条故障波形", "kind": "actual"},
        {"label": "SCM-AI 能力升级", "value": "引入 DeepSeek，供应链认知驱动", "kind": "actual"}],
       "AI 大模型驱动供应链协同提效，具身智能场景应用成为公司第二增长极，打开能源/电网智能巡检增量空间。",
       ["大模型", "智能体", "具身智能", "机器人"], ["DeepSeek（开源大模型）"],
       ["MRO", "具身智能", "供应链AI", "巡检机器人"],
       {"id": "src-res-xianheng-2026", "title": "咸亨国际（605056）：首次覆盖报告：MRO 集约化供应商，具身智能场景应用开拓者",
        "publisher": "西部证券", "type": "report", "url": "", "publishedAt": "2026-04-14",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]},
       {"title": "咸亨国际（605056）：首次覆盖报告：MRO 集约化供应商，具身智能场景应用开拓者", "publisher": "西部证券", "year": 2026},
       "2026-04-14", 2025),

    mk("research-2026-kunlun-ai", "昆仑万维：天工大模型驱动 AI 应用矩阵，短剧+AI 收入同比+864%",
       {"id": "org-kunlun", "name": "昆仑万维", "size": "large", "region": "北京", "type": "private"},
       "software-internet", ["content-generation", "agent"], ["市场与销售", "客户成功"],
       "昆仑万维以天工大模型为核心底座，构建“大模型+垂类应用”产品体系，自研 SkyReels-V4、Mureka V8 登顶全球评测第一；AI 办公 Skywork、AI 音乐 Mureka、AI 视频 SkyReels、AI 社交 Linky 多点布局。2025 年短剧与 AI 短剧平台业务收入 16.17 亿元（同比+864.92%），平台 MAU 突破 8000 万，天工 AI 月活约 430 万。",
       "昆仑万维持续推进“AI+短剧”战略，以 AI 内容生成与海外内容扩张打开第二增长曲线，但短期处于投入期、利润承压。",
       "海外内容生产成本高、本地化难；多模态内容（音乐/视频/办公）生成需强模型能力支撑规模化变现。",
       "以天工大模型为底座，自研视频/音乐/办公/社交等多模态 AI 应用；以 DramaWave+FreeReels 双平台推进 AI 短剧出海，形成“模型+应用+内容”商业化闭环。",
       ["天工大模型底座", "SkyReels/Mureka/Skywork/Linky 矩阵", "AI 短剧出海双平台", "多模态内容生成"],
       [{"label": "短剧与 AI 短剧平台收入", "value": "16.17 亿元", "improvement": "同比+864.92%", "kind": "actual"},
        {"label": "短剧平台 MAU", "value": "突破 8000 万", "kind": "actual"},
        {"label": "天工 AI 月活", "value": "约 430 万（2026-02）", "kind": "actual"}],
       "AI 应用矩阵收入快速释放，短剧+AI 出海规模化，验证“大模型+垂类应用”商业化路径（注：公司整体仍处投入期、利润承压）。",
       ["大模型", "多模态生成", "智能体"], ["天工大模型 / SkyReels-V4 / Mureka V8"],
       ["大模型", "AI短剧", "多模态生成", "出海"],
       {"id": "src-res-kunlun-2026", "title": "昆仑万维（300418）：关注 AI 应用及短剧商业化加速",
        "publisher": "华泰证券", "type": "report", "url": "", "publishedAt": "2026-04-26",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results", "roi"]},
       {"title": "昆仑万维（300418）：关注 AI 应用及短剧商业化加速", "publisher": "华泰证券", "year": 2026},
       "2026-04-26", 2025),

    mk("research-2026-kaiying-ai", "恺英网络：SOON AI 开发平台提效，EVE 切入 3D AI 陪伴",
       {"id": "org-kaiying", "name": "恺英网络", "size": "large", "region": "上海", "type": "private"},
       "software-internet", ["content-generation", "agent"], ["研发与设计", "客户成功"],
       "恺英网络以“AI+IP”双轮驱动：AI 全流程开发平台 SOON 实现游戏动画渲染、场景建模、剧情脚本生成等环节效率提升、开发周期显著缩短；子公司自然选择旗下 EVE 作为全球首款 3D AI 智能陪伴应用，依托多模态交互系统与情感对话大模型 Vibe 占据 AI 陪伴赛道先发优势；恺顽科技打造 AI 潮玩“暖星谷梦游记”形成“硬件+软件”生态。",
       "游戏行业竞争加剧、新品周期长，研发与内容生产成本高；陪伴类应用对多模态交互与情感化对话能力要求高。",
       "游戏研发环节（动画/建模/脚本）依赖人工、周期长；用户陪伴场景缺乏高沉浸感的 AI 交互产品。",
       "构建 SOON 全流程 AI 开发平台提升研发效率；以 EVE 3D AI 智能陪伴应用切入情感交互赛道；以 AI 潮玩实现“硬件+软件”生态闭环。",
       ["SOON AI 开发平台", "EVE 3D AI 陪伴应用", "AI 潮玩硬件+软件", "IP+AI 双轮驱动"],
       [{"label": "SOON 平台成效", "value": "动画渲染/场景建模/脚本生成效率提升、开发周期缩短", "kind": "actual"},
        {"label": "EVE 定位", "value": "全球首款 3D AI 智能陪伴应用", "kind": "actual"}],
       "AI 提效研发、IP 与 AI 双轮驱动，AI 前瞻布局有望成为游戏主业之外的第二成长曲线。",
       ["大模型", "智能体", "多模态生成"], ["Vibe 情感对话大模型"],
       ["游戏", "AI开发", "AI陪伴", "多模态"],
       {"id": "src-res-kaiying-2026", "title": "恺英网络（002517）：年报及 1 季报点评：游戏新品、用户平台及 AI 应用值得期待",
        "publisher": "国信证券", "type": "report", "url": "", "publishedAt": "2026-04-29",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results"]},
       {"title": "恺英网络（002517）：年报及 1 季报点评：游戏新品、用户平台及 AI 应用值得期待", "publisher": "国信证券", "year": 2026},
       "2026-04-29", 2025),

    mk("research-2026-thundersoft-aios", "中科创达：AIOS+AIBOX 全栈布局，智能物联网收入同比+133%",
       {"id": "org-thundersoft", "name": "中科创达", "size": "large", "region": "北京", "type": "private"},
       "manufacturing", ["agent", "ai-infra"], ["研发与设计", "生产制造"],
       "中科创达以 AIOS 为核心，围绕“芯片-AIOS-中间件-上层应用”构建全栈技术体系；面向整车智能化的 AI 原生操作系统“滴水 AIOS”结合 AIBOX（200TOPS 算力、支持 7B 大模型端侧运行）实现软硬协同，推动 AI 大模型规模化上车与 AI Agent 场景化落地。2025 年智能物联网收入 36.05 亿元（同比+133.3%），公司营收 77.78 亿元（同比+44.5%）。",
       "操作系统正由传统程序控制型向“程序控制+AI 模型决策”复合形态演进，智能汽车、机器人、AIPC 等终端对端侧 AI 能力需求激增。",
       "终端场景碎片化、端云协同复杂；大模型上车受算力、延迟与数据安全约束，缺乏一体化 OS+硬件方案。",
       "以 AIOS（滴水 AIOS）为系统底座，结合 AIBOX 端侧 AI 算力与端边云协同架构，覆盖智能座舱、舱驾融合、机器人、AIPC 等场景；以“AIOS+IoT”一站式平台交付垂直行业。",
       ["AIOS 全栈技术体系", "滴水 AIOS + AIBOX 软硬协同", "AI Agent 场景化上车", "机器人/AIoT 垂直落地"],
       [{"label": "智能物联网收入", "value": "36.05 亿元", "improvement": "同比+133.3%", "kind": "actual"},
        {"label": "2025 营收", "value": "77.78 亿元", "improvement": "同比+44.5%", "kind": "actual"},
        {"label": "AIBOX 端侧算力", "value": "200TOPS，支持 7B 大模型端侧运行", "kind": "actual"}],
       "AIOS 变革驱动全栈能力输出，智能物联网高增验证端侧 AI 商业化，有望持续支撑业绩增长。",
       ["大模型", "智能体", "端侧 AI", "操作系统"], ["滴水 AIOS / AIBOX"],
       ["AIOS", "端侧AI", "智能汽车", "机器人"],
       {"id": "src-res-thundersoft-2026", "title": "中科创达（300496）：25 年营收大幅增长，AIOS 应用场景快速拓展",
        "publisher": "中银国际", "type": "report", "url": "", "publishedAt": "2026-05-01",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results", "roi"]},
       {"title": "中科创达（300496）：25 年营收大幅增长，AIOS 应用场景快速拓展", "publisher": "中银国际", "year": 2026},
       "2026-05-01", 2025),

    mk("research-2026-tencent-hunyuan", "腾讯控股：混元 3.0 接入 130+ 产品，WorkBuddy 成最受欢迎效率智能体",
       {"id": "org-tencent", "name": "腾讯控股", "size": "large", "region": "深圳", "type": "private"},
       "software-internet", ["agent", "content-generation"], ["市场与销售", "客户成功"],
       "腾讯以混元 3.0 大模型为核心，内部 130 余款产品已完成接入；应用侧，腾讯营销 AIM+ 智能投放赋能广告主营销服务投放金额的约 30%，腾讯云效率 AI 智能体 WorkBuddy 以 DAU 计成为中国最受欢迎的效率 AI 智能体服务。1Q26 广告收入同比+20%，视频号总用户使用时长同比超+20%，AI 资本开支同比+16% 达 319 亿元。",
       "腾讯核心主业（游戏/广告/金融科技企服）稳健，AI 作为业务放大器，从模型到应用双线突破，重塑内容分发、广告投放与办公效率。",
       "内容分发与广告投放需更精准的 AI 匹配；企业内部与开发者缺少高效 AI 办公/智能体工具；中文大模型需对标顶尖水准。",
       "全力冲刺中文顶尖大模型（混元 3.0），大规模接入内部产品；以 AIM+ 智能投放与视频号推荐模型升级广告与内容分发；以 WorkBuddy 效率智能体服务企业办公场景。",
       ["混元 3.0 研发与产品接入", "AIM+ 智能投放", "视频号推荐模型升级", "WorkBuddy 效率智能体"],
       [{"label": "混元 3.0 接入产品", "value": "130+ 款内部产品", "kind": "actual"},
        {"label": "腾讯营销 AIM+ 赋能投放金额", "value": "约 30%", "kind": "actual"},
        {"label": "广告收入（1Q26）", "value": "同比+20%", "kind": "actual"},
        {"label": "WorkBuddy", "value": "DAU 计中国最受欢迎效率 AI 智能体", "kind": "actual"}],
       "模型+应用双线突破，AI 对广告、内容分发与办公效率的放大效应初步显现，云与企服收入受 AI 需求拉动增长。",
       ["大模型", "智能体", "推荐算法"], ["混元 3.0"],
       ["大模型", "智能体", "智能投放", "办公AI"],
       {"id": "src-res-tencent-2026", "title": "腾讯控股（0700.HK）：1Q26 业绩点评：AI 赋能初见成效，模型与应用双线突破",
        "publisher": "中泰证券", "type": "report", "url": "", "publishedAt": "2026-05-15",
        "collectedAt": COLLECTED, "accessibility": "available", "supports": ["summary", "results", "roi"]},
       {"title": "腾讯控股（0700.HK）：1Q26 业绩点评：AI 赋能初见成效，模型与应用双线突破", "publisher": "中泰证券", "year": 2026},
       "2026-05-15", 2026, featured=True),
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
