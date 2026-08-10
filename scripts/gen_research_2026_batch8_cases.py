# -*- coding: utf-8 -*-
"""report/ 下 2026 行业研报抽取第 8 批：AI 旅游（中旅国际） + MiniMax 出海。
来源（report_ocr_batch_20260723/ 新提取）：
  - 环球旅讯 2026-05-08《旅游行业2026上半年AI旅游应用趋势洞察报告：神灯在手》
  - 中泰证券 2026-04-05《传媒行业2026 AI应用系列深度报告（二）：AI技术迭代与商业化加速》
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch8_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch8_cases.json")
COLLECTED = "2026-07-23"

RISK_TOUR = ("数据来自环球旅讯研究院联合中旅国际、数字100的问卷与深访（C 端各 3000 份、B 端 87 份），"
             "样本与口径存在局限；旅游 AI 仍处从“灵感”到“交易”的信任临界，ROI 测算、黑产与合规是落地约束。")
RISK_MINIMAX = ("数据来自券商基于公司披露与公开报道整理，MiniMax 仍处投入期、盈利未稳；"
                "海外监管与内容合规、多模态算力成本是出海规模化的主要不确定因素。")

SRC_TOUR_TITLE = "旅游行业2026上半年AI旅游应用趋势洞察报告：神灯在手"
SRC_TOUR_PUB = "环球旅讯研究院"
SRC_TOUR_DATE = "2026-05-08"
SRC_MX_TITLE = "AI技术迭代与商业化加速，国产大模型全球化竞争力凸显——传媒行业2026 AI应用系列深度报告（二）"
SRC_MX_PUB = "中泰证券"
SRC_MX_DATE = "2026-04-05"


def mk_tour(slug, title, org, summary, background, problem, solution, steps, results, roi,
            tech, models, tags, pub, year, conf="high", featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "other", "scenarios": ["agent", "customer-service"],
        "businessFunctions": ["客户成功", "市场与销售"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"标杆实践（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK_TOUR,
        "editorComment": {
            "suitableFor": "文旅集团、景区/乐园与旅游科技企业",
            "prerequisites": "具备目的地内容与游客服务数据，有智能体/多模态交互落地基础",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自旅游行业 AI 应用趋势报告披露的标杆实践，可供文旅同业参考。",
        },
        "implementers": [{"name": f"{org['name']}（含生态合作伙伴）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": conf,
        "sources": [{"id": f"src-tour-{slug}", "title": SRC_TOUR_TITLE, "publisher": SRC_TOUR_PUB,
                     "type": "report", "url": "", "publishedAt": SRC_TOUR_DATE,
                     "collectedAt": COLLECTED, "accessibility": "available",
                     "supports": ["summary", "results"]}],
        "featured": featured, "publishedAt": pub, "implementationYear": year,
        "implementationTimePrecision": "year", "techPath": tech, "modelStack": models,
        "sourceReport": {"title": SRC_TOUR_TITLE, "publisher": SRC_TOUR_PUB, "year": 2026},
        "tags": tags, "seo": {"metaTitle": f"{title} - 企业 AI 应用案例",
                              "metaDescription": summary[:80], "keywords": tags},
    }


def mk_mx(slug, title, org, summary, background, problem, solution, steps, results, roi,
          tech, models, tags, pub, year, conf="high", featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "software-internet", "scenarios": ["agent", "content-generation"],
        "businessFunctions": ["研发与设计", "市场与销售"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"规模商用（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK_MINIMAX,
        "editorComment": {
            "suitableFor": "AI 原生应用公司与全球化布局的大模型企业",
            "prerequisites": "具备全模态模型能力与海外应用分发渠道，有 C 端产品矩阵与成本优势",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自券商研报披露的国产大模型出海数据，可供 AI 公司出海对标。",
        },
        "implementers": [{"name": f"{org['name']}（含生态合作伙伴）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": conf,
        "sources": [{"id": f"src-mx-{slug}", "title": SRC_MX_TITLE, "publisher": SRC_MX_PUB,
                     "type": "report", "url": "", "publishedAt": SRC_MX_DATE,
                     "collectedAt": COLLECTED, "accessibility": "available",
                     "supports": ["summary", "results"]}],
        "featured": featured, "publishedAt": pub, "implementationYear": year,
        "implementationTimePrecision": "year", "techPath": tech, "modelStack": models,
        "sourceReport": {"title": SRC_MX_TITLE, "publisher": SRC_MX_PUB, "year": 2026},
        "tags": tags, "seo": {"metaTitle": f"{title} - 企业 AI 应用案例",
                              "metaDescription": summary[:80], "keywords": tags},
    }


CASES = [
    mk_tour("research-2026-ctg-aiyou", "中旅国际：“目的地 AI 伴游”文旅智能体，成为报告标杆案例",
       {"id": "org-ctg", "name": "中旅国际", "size": "large", "region": "香港", "type": "state-owned"},
       "中旅国际打造“目的地 AI 伴游”文旅智能体应用，作为《2026上半年AI旅游应用趋势洞察报告》第三章“B端企业AI应用实践”的标杆案例，以智能体重构游客在目的地的伴游、讲解与行程服务，实现“对外赋能”与“对内提效”双重价值。",
       "文旅行业 B 端企业一面渴望用 AI 降本增效，一面困惑于“技术价值”与“商业价值”的转化鸿沟。",
       "游客在目的地需要个性化伴游与即时讲解，传统导览人力成本高、体验割裂；企业内运营提效缺乏 AI 抓手。",
       "以文旅智能体承载目的地伴游、讲解与行程服务，对 C 端游客提供个性化体验、对 B 端实现运营提效，形成“对外赋能+对内提效”双轮。",
       ["目的地 AI 伴游智能体", "C 端个性化伴游", "B 端运营提效", "报告标杆案例"],
       [{"label": "报告定位", "value": "B端AI应用实践标杆案例", "kind": "actual"},
        {"label": "行业渗透（已在业务应用AI的企业）", "value": "从业者认知超七成", "kind": "actual"}],
       "文旅智能体打通“对外赋能+对内提效”，为旅游企业跨越“技术价值→商业价值”鸿沟提供可参考范式。",
       ["大模型", "智能体", "文旅"], ["中旅国际 目的地AI伴游智能体"],
       ["AI旅游", "文旅智能体", "AI伴游", "目的地服务"],
       "2026-05-08", 2026, conf="high", featured=True),

    mk_tour("research-2026-tour-industry", "旅游行业 AI 应用：C 端认知超 90%、渗透率约 80%，B 端双角色拥抱 AI",
       {"id": "org-tour-industry", "name": "旅游行业（趋势洞察）", "size": "other", "region": "全国", "type": "other"},
       "《2026上半年AI旅游应用趋势洞察报告》显示：消费者对旅游 AI 软件认知普及率超 90%、使用渗透率约 80%、经常使用者 22.5%；旅游企业中超七成已在业务应用 AI，35.9% 用于内部运营提效（智能客服/内容生成为主），64.0% 为 C/B 端提供 AI 解决方案，行业站在从“灵感”到“交易”的临界点。",
       "旅游行业进入生成式 AI 时代，C 端习惯已养成但信任未跨越，B 端渴求降本增效却困于价值转化。",
       "用户对 AI 推荐“愿发现不愿被决定”（66.2% 仍需回传统 APP 核实）；企业 AI 投入的 ROI 难测算。",
       "以“对外赋能+对内提效”双角色落地：C 端做智能客服与内容生成、B 端做运营提效，逐步跨越从灵感到交易的信任鸿沟。",
       ["C 端智能客服/内容生成", "B 端运营提效", "双角色落地", "信任鸿沟攻坚"],
       [{"label": "C端认知普及率", "value": "超 90%", "kind": "actual"},
        {"label": "C端使用渗透率", "value": "约 80%", "kind": "actual"},
        {"label": "企业AI应用占比", "value": "超七成", "kind": "actual"},
        {"label": "B端提供AI解决方案", "value": "64.0%", "kind": "actual"}],
       "旅游 AI 完成认知普及与习惯养成，进入交易闭环攻坚期，为智能客服/内容生成类应用提供明确需求底座。",
       ["大模型", "智能体", "智能客服", "内容生成"], ["行业通用大模型"],
       ["AI旅游", "智能客服", "内容生成", "行业趋势"],
       "2026-05-08", 2026, conf="medium"),

    mk_mx("research-2026-minimax-global", "MiniMax：全模态模型+应用出海，海外收入占比超七成、Talkie/星野爆款落地",
       {"id": "org-minimax", "name": "MiniMax", "size": "large", "region": "上海", "type": "private"},
       "MiniMax 为聚焦全模态的全球化 AI 公司，采用 MoE 架构与自研注意力机制，形成语言/视频/语音/音乐完整模型矩阵；坚持“模型+应用”一体化路线，海外收入占比超七成，Talkie/星野/海螺 AI 均实现爆款落地，MaxClaw 集成 OpenClaw 生态、工具调用量行业领先，成为国产 AI 出海标杆。",
       "国产大模型面临国内红海竞争，需以成本优势与全模态能力开拓海外增量市场。",
       "单一模型能力难形成壁垒；C 端应用分发与海外合规、多模态算力成本构成出海门槛。",
       "以全模态模型矩阵支撑“模型+应用”一体化，C 端布局通用 Agent、情感陪伴、视频/语音生成等爆款，海外为主引擎；以 MaxClaw 接入 OpenClaw 生态放大工具调用优势。",
       ["全模态模型矩阵", "C 端爆款应用", "海外为主引擎", "MaxClaw×OpenClaw 生态"],
       [{"label": "海外收入占比", "value": "超 70%", "kind": "actual"},
        {"label": "爆款应用", "value": "Talkie/星野/海螺 AI", "kind": "actual"},
        {"label": "工具调用", "value": "MaxClaw 行业领先", "kind": "actual"}],
       "全模态能力与成本优势转化为出海规模，海外收入主导验证国产大模型全球化竞争力。",
       ["大模型", "智能体", "多模态", "出海"], ["MiniMax 全模态模型矩阵 / MaxClaw"],
       ["大模型出海", "全模态", "AI原生应用", "MiniMax"],
       "2026-04-05", 2025, conf="high", featured=True),
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
