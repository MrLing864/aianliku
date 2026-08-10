# -*- coding: utf-8 -*-
"""report/ 下 2026 研报抽取 run2 第 4 批：AI 编程与通用 Agent 应用（Cursor / 字节 Trae / Manus）。
来源（report_ocr_batch_20260723_run2/ 新提取）：
  - 信达证券 2026-02-13《计算机行业AI编程：重塑软件开发新范式，应用生态加速繁荣》
  - 中泰证券 2026-02-26《传媒行业2026AI应用系列深度报告（一）：AI应用重塑流量生态，推动营销需求趋势向上》
（注：报告披露 AI 编程 IDE 与通用 Agent 应用的明确量化经营数据，按"企业+AI动作+量化成效"抽取）
入库：node scripts/insert-cases.mjs cases_json/gen_research_run2_batch4_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run2_batch4_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商基于公司披露、融资公告与第三方平台（点点数据/QuestMobile）整理；"
        "AI 编程与 Agent 应用仍处高速渗透早期，模型能力、企业付费意愿与合规是规模化约束。")

SRC_XD_TITLE = "AI编程：重塑软件开发新范式，应用生态加速繁荣"
SRC_XD_PUB = "信达证券"
SRC_XD_DATE = "2026-02-13"
SRC_ZT_TITLE = "AI应用重塑流量生态，推动营销需求趋势向上——传媒行业2026AI应用系列深度报告（一）"
SRC_ZT_PUB = "中泰证券"
SRC_ZT_DATE = "2026-02-26"


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
            "text": f"{org['name']}的「{title}」源自券商研报披露的 AI 编程/Agent 应用数据，可供软件团队与 Agent 厂商对标。",
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


CURSOR = {
    "id": "org-cursor", "name": "Cursor(Anysphere)", "size": "large", "region": "海外", "type": "foreign",
    "scenarios": ["rnd-design", "agent"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "软件开发团队与企业的 AI 编程/智能体化开发落地",
    "prerequisites": "具备大模型编程能力与 IDE 产品，有开发者生态与订阅商业化基础",
}
TRAE = {
    "id": "org-trae", "name": "字节跳动(Trae)", "size": "giant", "region": "北京", "type": "private",
    "scenarios": ["rnd-design", "agent"],
    "businessFunctions": ["研发与设计"],
    "suitableFor": "国内开发者的 AI 原生编程环境落地",
    "prerequisites": "具备自研大模型（豆包等）与 IDE 产品能力，有全球化分发渠道",
}
MANUS = {
    "id": "org-manus", "name": "Manus", "size": "medium", "region": "海外", "type": "foreign",
    "scenarios": ["agent"],
    "businessFunctions": ["研发与设计", "市场与销售"],
    "suitableFor": "需要通用型自主 Agent 处理跨应用复杂任务的企业与个人",
    "prerequisites": "具备通用 Agent 编排与多工具调用能力，有任务执行闭环与商业化运营基础",
}

CASES = [
    mk("run2-cursor-ai-ide",
       "Cursor：AI 编程 IDE 年化收入突破 10 亿美元，被超 5 万家企业选择",
       CURSOR,
       "Cursor（Anysphere）以「IDE+AI」模式验证 AI 编程商业化路径：2025 年 11 月完成 23 亿美元融资、估值达 293 亿美元；年化收入（ARR）突破 10 亿美元、被超过 5 万家企业选择，半年内收入增长 10 倍（1 月超 1 亿→6 月超 5 亿→11 月超 10 亿）。在 Salesforce 内部，Cursor 数月内即从新工具变为 75% 工程师日常开发所用工具，证明 AI 编程 IDE 对传统开发流程的替代力。",
       "软件开发效率低、门槛高，传统 IDE 仅靠代码补全难以满足复杂任务自动化，专业与非专业开发者均渴望更高自主性。",
       "开发者需要能自主完成编码、调试、部署的智能体化 IDE；企业需可规模付费的 AI 编程工具。",
       "以 Cursor IDE 深度结合大模型（Agent 模式自主完成多文件编辑与终端命令），通过免费版引流、Pro/Business/Enterprise 订阅商业化，快速覆盖个人与企业开发者。",
       ["Cursor AI 编程 IDE", "Agent 模式自主编码", "免费+订阅商业化", "企业广泛采用"],
       [{"label": "年化收入（ARR）", "value": "突破 10 亿美元", "kind": "actual"},
        {"label": "企业客户", "value": "超 5 万家", "kind": "actual"},
        {"label": "收入增速", "value": "半年增长 10 倍", "kind": "actual"},
        {"label": "Salesforce 采用率", "value": "75% 工程师日常使用", "kind": "actual"}],
       "Cursor 以 IDE+AI 深度结合打开 AI 编程十亿级 ARR 市场，验证「AI 原生开发环境」的企业付费确定性。",
       ["大模型", "智能体", "AI 编程"], ["Cursor（多模型路由：GPT/Claude 等）"],
       ["AI编程", "Cursor", "AI IDE", "智能体编程", "软件开发"],
       [{"id": "src-run2-cur-xd", "title": SRC_XD_TITLE, "publisher": SRC_XD_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_XD_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_XD_TITLE, "publisher": SRC_XD_PUB, "year": 2026},
       "2026-02-13", 2025, conf="high", featured=True),

    mk("run2-bytedance-trae",
       "字节跳动 Trae：AI 原生编程 IDE 全球用户超 600 万、月活破 160 万",
       TRAE,
       "字节跳动推出 AI 原生集成开发环境 Trae，基于 VS Code 构建，主打「AI+IDE」开发模式，功能含 Builder、Chat 模式、CUE 智能编程工具与内置智能体 SOLO Coder，底层接入豆包、DeepSeek、MiniMax 等模型。截至 2025 年末，Trae 全球范围内收获超 600 万用户、覆盖近 200 个国家和地区、月活突破 160 万，成为国内厂商在全球 AI 编程赛道的重要落子。",
       "国内开发者缺乏自主可控、体验优秀的 AI 编程 IDE，海外 Cursor 快速普及带来竞争压力。",
       "开发者需本地化、多模型可选的 AI 编程环境；国产大模型需通过 IDE 产品化触达开发者。",
       "以 Trae AI 原生 IDE 承载 Builder/Chat/SOLO Coder 等能力，基于豆包等自研与第三方模型提供多模型编程，全球化分发快速获客。",
       ["Trae AI 原生 IDE", "Builder/Chat/SOLO Coder", "多模型接入", "全球化分发"],
       [{"label": "全球用户", "value": "超 600 万", "kind": "actual"},
        {"label": "覆盖国家/地区", "value": "近 200 个", "kind": "actual"},
        {"label": "月活", "value": "突破 160 万", "kind": "actual"}],
       "Trae 以 AI 原生 IDE 快速全球化获客，验证国内大模型厂商在 AI 编程赛道的出海与产品化能力。",
       ["大模型", "智能体", "AI 编程", "出海"], ["字节 Trae（豆包/DeepSeek/MiniMax）"],
       ["AI编程", "Trae", "AI IDE", "字节跳动", "出海"],
       [{"id": "src-run2-trae-xd", "title": SRC_XD_TITLE, "publisher": SRC_XD_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_XD_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_XD_TITLE, "publisher": SRC_XD_PUB, "year": 2026},
       "2026-02-13", 2025, conf="high", featured=False),

    mk("run2-manus-general-agent",
       "Manus：通用型 AI Agent 上线 8 个月 ARR 突破 1 亿美元，迈入实用工具拐点",
       MANUS,
       "Manus 为通用型自主 Agent 应用，能感知任务、自主执行、多轮交互并完成跨应用复杂工作，被视为 Agentic AI 成为全社会实用工具的关键拐点代表。据研报披露，Manus 上线 8 个月即实现年度经常性收入（ARR）突破 1 亿美元，标志通用 Agent 从行业展望走向规模化商业兑现；其后 Meta 收购 Manus，进一步强化其生态位。",
       "企业与个人面临大量跨应用、多步骤的复杂任务，传统软件需人工在多个工具间切换，缺乏自主执行能力。",
       "通用任务需 Agent 具备规划、工具调用与自我纠错能力；商业化需证明付费意愿与任务完成质量。",
       "以通用 Agent 架构承载任务拆解、工具调用与多轮执行，向 C 端/企业交付「任务执行」而非「内容输出」，快速实现 ARR 规模化。",
       ["通用 Agent 架构", "任务自主执行", "跨应用工具调用", "ARR 规模化"],
       [{"label": "上线 8 个月 ARR", "value": "突破 1 亿美元", "kind": "actual"},
        {"label": "行业定位", "value": "Agentic AI 实用工具拐点代表", "kind": "actual"}],
       "Manus 以通用 Agent 实现上线 8 个月 ARR 破亿美元，验证「自主执行型 AI 应用」的付费确定性与发展拐点。",
       ["大模型", "智能体"], ["Manus 通用 Agent"],
       ["通用Agent", "Manus", "自主智能体", "任务执行"],
       [{"id": "src-run2-manus-zt", "title": SRC_ZT_TITLE, "publisher": SRC_ZT_PUB, "type": "institution",
         "url": "", "publishedAt": SRC_ZT_DATE, "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZT_TITLE, "publisher": SRC_ZT_PUB, "year": 2026},
       "2026-02-26", 2025, conf="high", featured=True),
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
