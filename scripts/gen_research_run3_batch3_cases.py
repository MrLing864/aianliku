# -*- coding: utf-8 -*-
"""report/ 下 2025 研报抽取 run3 第 3 批：软件与互联网 / 零售 / 外贸 AI 应用
来源（report_ocr_run3/ 新提取）：
  - 中信建投 2025-11-16《传媒行业周观点：阿里计划加强C端AI应用布局，美图AI雪景功能海外出圈》
    （含 美图 / 值得买 / 万兴科技 / 焦点科技 四家公司的 AI 应用量化披露）
入库：node scripts/insert-cases.mjs cases_json/gen_research_run3_batch3_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_run3_batch3_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商依据公司公告/财报与第三方榜单整理，部分为单季度或预测口径；"
        "C 端创意/内容/出海应用受用户留存、付费转化与区域合规影响，商业化持续性需观察。")

SRC_ZJ = ("传媒行业周观点：阿里计划加强C端AI应用布局，美图AI雪景功能海外出圈", "中信建投", "2025-11-16")


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
            "text": f"{org['name']}的「{title}」源自公司财报/公告披露的 AI 应用数据，可供同类企业借鉴。",
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


MEITU = {
    "id": "org-meitu", "name": "美图公司(Meitu)", "size": "medium", "region": "中国", "type": "domestic",
    "industry": "software-internet", "scenarios": ["content-generation", "sales"],
    "businessFunctions": ["市场与销售", "研发与设计"],
    "suitableFor": "影像/设计类 App 的 AI 出圈功能与出海变现",
    "prerequisites": "具备图像生成/编辑大模型能力，有海外分发与「模型容器」接入能力",
}
ZDM = {
    "id": "org-zdm", "name": "值得买(什么值得买)", "size": "medium", "region": "中国", "type": "domestic",
    "industry": "retail", "scenarios": ["content-generation", "sales", "agent"],
    "businessFunctions": ["市场与销售", "研发与设计"],
    "suitableFor": "消费决策/内容电商平台的 AI 内容与 MCP 开放",
    "prerequisites": "具备消费语料与内容生产体系，有自研消费大模型与 MCP 开放能力",
}
WX = {
    "id": "org-wx", "name": "万兴科技(Wondershare)", "size": "medium", "region": "中国", "type": "domestic",
    "industry": "software-internet", "scenarios": ["content-generation", "rnd-design"],
    "businessFunctions": ["研发与设计", "市场与销售"],
    "suitableFor": "创意软件厂商的 AI 视频/多媒体化出海",
    "prerequisites": "具备多媒体大模型与创意软件产品矩阵，有海外订阅分发能力",
}
JD = {
    "id": "org-jdtech", "name": "焦点科技(Focus Technology)", "size": "medium", "region": "中国", "type": "domestic",
    "industry": "foreign-trade", "scenarios": ["agent", "sales"],
    "businessFunctions": ["市场与销售"],
    "suitableFor": "外贸 B2B 平台的 AI 采购助手与卖家智能体",
    "prerequisites": "具备外贸买家/卖家流量与商品数据，有自研外贸 AI 智能体能力",
}

CASES = [
    mk("run3-meitu-ai-image",
       "美图：AI 合照/雪景连续出圈，美图秀秀登顶 29 国应用总榜、欧洲 14 国免费榜",
       MEITU,
       "美图以「模型容器」定位高速接入头部大模型，连续推出 AI 合照、AI 雪景等出圈功能，美图秀秀登顶德国、韩国等 29 个国家和地区应用总榜、欧洲 14 国 iOS 免费榜，带动美图秀秀/美颜相机/Wink 全球月收入高速增长，验证 AI 图像功能的出海变现能力。",
       "影像 App 需以高频 AI 玩法持续获取海外用户与付费。",
       "图像功能同质化、用户增长与留存承压；出海需本地化与模型快速迭代。",
       "以「模型容器」接入头部大模型，快速推出 AI 合照、AI 雪景等爆款玩法，借社交传播撬动全球登顶与月收入增长。",
       ["模型容器接入", "AI 合照/雪景玩法", "社交裂变传播", "出海分发"],
       [{"label": "美图秀秀榜单", "value": "登顶 29 个国家和地区应用总榜", "kind": "actual"},
        {"label": "欧洲表现", "value": "欧洲 14 国 iOS 免费榜登顶", "kind": "actual"},
        {"label": "收入", "value": "美图秀秀/美颜相机/Wink 全球月收入高速增长", "kind": "actual"}],
       "AI 出圈玩法驱动全球登顶与月收入增长，验证影像 App 的 AI 出海变现路径。",
       ["生成式AI", "图像模型", "模型容器"], ["接入头部大模型", "自研图像模型"],
       ["AI图像", "美图", "出海", "模型容器", "AI出圈"],
       [{"id": "src-run3-zj", "title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "type": "institution",
         "url": "", "publishedAt": SRC_ZJ[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "year": 2025},
       "2025-11-16", 2025, conf="high", featured=True),

    mk("run3-zdm-ai-content",
       "值得买：前三季度 AI 收入 3229 万元，双 11 AIGC 内容 +62%、海纳 MCP 输出超 2800 万",
       ZDM,
       "值得买将 AI 融入消费决策与内容电商，「什么值得买」前三季度 AI 收入 3229 万元（占比约 5%），双 11 期间 AIGC 兴趣内容发布量同比 +62.17%、「张大妈」日活环比 +129.97%，海纳 MCP Server 对外输出超 2800 万次、带动 GMV 环比 +71.39%，AI 成为增长新引擎。",
       "消费决策平台需以 AI 提升内容生产效率与交易转化。",
       "内容生产依赖人工、效率低；平台需开放能力挖掘 B 端变现。",
       "以自研消费大模型驱动 AIGC 兴趣内容生产，并通过海纳 MCP Server 对外开放能力，连接生态伙伴放大 GMV。",
       ["消费大模型", "AIGC 内容生产", "海纳 MCP 开放", "生态 GMV 放大"],
       [{"label": "前三季度 AI 收入", "value": "3229 万元（占比约 5%）", "kind": "actual"},
        {"label": "双 11 AIGC 内容", "value": "发布量同比 +62.17%", "kind": "actual"},
        {"label": "张大妈日活（双 11）", "value": "环比 +129.97%、日均启动 +101.34%", "kind": "actual"},
        {"label": "海纳 MCP 输出", "value": "超 2800 万次、GMV 环比 +71.39%", "kind": "actual"}],
       "AI 同时拉动内容效率、用户活跃与 B 端开放收入，多指标验证消费 AI 商业化。",
       ["大模型", "MCP", "AIGC", "内容电商"], ["自研消费大模型", "MCP"],
       ["AI内容", "值得买", "AIGC", "MCP", "内容电商"],
       [{"id": "src-run3-zj", "title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "type": "institution",
         "url": "", "publishedAt": SRC_ZJ[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "year": 2025},
       "2025-11-16", 2025, conf="high", featured=False),

    mk("run3-wondershare-tianmu",
       "万兴科技：「天幕」多媒体大模型驱动，前三季度 AI 调用超 8 亿次、移动端收入翻倍",
       WX,
       "万兴科技以「天幕」多媒体大模型驱动创意软件 AI 化，前三季度 AI 服务器调用量超 8 亿次、移动端收入同比增长超 100%；天幕 AI 上线视频续写、文字重绘、AI 特效等功能，全年 AI 收入有望翻倍增长，AI 成为创意软件出海核心动能。",
       "创意软件厂商需以 AI 功能提升产品力与订阅增长。",
       "视频/图像创作门槛高、效率低；移动端与海外订阅需新的增长抓手。",
       "以「天幕」多媒体大模型重构视频/图像创作流程，推出视频续写、文字重绘、AI 特效等功能，强化移动端与出海订阅。",
       ["天幕多媒体大模型", "视频续写/文字重绘", "AI 特效", "移动端出海"],
       [{"label": "前三季度 AI 调用量", "value": "超 8 亿次", "kind": "actual"},
        {"label": "移动端收入", "value": "同比翻倍", "kind": "actual"},
        {"label": "全年 AI 收入", "value": "有望翻倍以上增长", "kind": "estimated"}],
       "多媒体大模型显著提升创作效率与移动端收入，AI 成为创意软件出海核心增长引擎。",
       ["多媒体大模型", "视频生成", "创意软件"], ["万兴天幕多媒体大模型"],
       ["AI视频", "万兴科技", "天幕", "创意软件", "出海"],
       [{"id": "src-run3-zj", "title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "type": "institution",
         "url": "", "publishedAt": SRC_ZJ[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "year": 2025},
       "2025-11-16", 2025, conf="high", featured=False),

    mk("run3-focus-sourcingai",
       "焦点科技：中国制造网推出 SourcingAI 采购助手，Agent 年费约 1000 元、渗透超 50%",
       JD,
       "焦点科技旗下中国制造网（MIC）推出 AI 采购助手 SourcingAI，辅助海外买家搜索产品与采购决策，采用 Agent 订阅模式（年费约 1000 元/年）；叠加 AI 麦可渗透率超 50%、覆盖千万级买家，对标阿里 Accio 打开外贸 B2B 的 AI 商业化空间。",
       "外贸 B2B 平台需以 AI 降低买卖匹配成本、提升转化。",
       "买家搜索与采购决策低效；卖家缺乏智能客服与营销工具。",
       "以 SourcingAI 为海外买家提供 Agent 化采购助手，以 AI 麦可服务卖家，采用订阅制变现并提升平台匹配效率。",
       ["SourcingAI 采购助手", "AI 麦可卖家工具", "Agent 订阅变现", "买家流量转化"],
       [{"label": "SourcingAI 发布/收费", "value": "10.22 发布、Agent 年费约 1000 元/年", "kind": "actual"},
        {"label": "MIC 买家规模", "value": "千万级", "kind": "actual"},
        {"label": "AI 麦可渗透率", "value": "Q3 末超 50%", "kind": "actual"}],
       "SourcingAI + AI 麦可以订阅制打开外贸 B2B 的 AI 商业化，对标头部出海采购 Agent。",
       ["大模型", "智能体", "外贸AI"], ["SourcingAI", "AI 麦可"],
       ["外贸AI", "焦点科技", "SourcingAI", "中国制造网", "智能体"],
       [{"id": "src-run3-zj", "title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "type": "institution",
         "url": "", "publishedAt": SRC_ZJ[2], "collectedAt": COLLECTED, "accessibility": "available",
         "supports": ["summary", "results"]}],
       {"title": SRC_ZJ[0], "publisher": SRC_ZJ[1], "year": 2025},
       "2025-11-16", 2025, conf="high", featured=False),
]

if __name__ == "__main__":
    data = [build(c) for c in CASES]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"written {len(data)} cases -> {OUT}")
