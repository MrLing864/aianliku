# -*- coding: utf-8 -*-
"""report/ 下 2026 行业研报抽取第 4 批：数说安全《AI 重塑网络安全行业》代表厂商案例。
来源（report_ocr_batch_20260723/ 新提取）：
  - 数说安全 2026-04-27《AI 重塑网络安全行业：网络安全智能化产品与市场报告》
（注：该报告为市场研究，含多家头部安全厂商已规模商用的量化数据，按“企业+AI动作+量化成效”逐家抽取）
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch4_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch4_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自第三方市场研究机构的厂商调研与公开披露，部分 AI 营收/客户数为厂商口径，存在统计口径与时效性差异；"
        "安全垂域大模型微调边际收益递减、智能体安全赛道尚处早期，厂商分化（数据底座+工程化+客户生态）将持续。")

SRC_TITLE = "AI 重塑网络安全行业：网络安全智能化产品与市场报告，从安全助手到安全智能体，能力边界、应用路径与代表厂商"
SRC_PUB = "数说安全"
SRC_DATE = "2026-04-27"


def mk(slug, title, org, summary, background, problem, solution, steps, results, roi,
       tech, models, tags, pub, year, conf="high", featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "software-internet", "scenarios": ["agent", "workflow"],
        "businessFunctions": ["信息技术", "客户成功"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": f"规模商用（{year}年）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": "网络安全厂商及有安全运营提效诉求的企业",
            "prerequisites": "具备安全运营数据积累与工程化能力，有私有化/云端大模型落地基础",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自第三方市场研究报告披露的厂商调研数据，可供同业对标。",
        },
        "implementers": [{"name": f"{org['name']}（含生态合作伙伴）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": conf,
        "sources": [{"id": f"src-res-sec-{slug}", "title": SRC_TITLE, "publisher": SRC_PUB,
                     "type": "report", "url": "", "publishedAt": SRC_DATE,
                     "collectedAt": COLLECTED, "accessibility": "available",
                     "supports": ["summary", "results"]}],
        "featured": featured, "publishedAt": pub, "implementationYear": year,
        "implementationTimePrecision": "year", "techPath": tech, "modelStack": models,
        "sourceReport": {"title": SRC_TITLE, "publisher": SRC_PUB, "year": 2026},
        "tags": tags, "seo": {"metaTitle": f"{title} - 企业 AI 应用案例",
                              "metaDescription": summary[:80], "keywords": tags},
    }


CASES = [
    mk("research-2026-sangfor-ai", "深信服：安全大模型全面 MCP 化，MSS 覆盖 3500 家、T1 研判 50→5 人",
       {"id": "org-sangfor", "name": "深信服", "size": "large", "region": "深圳", "type": "private"},
       "深信服将检测大模型与运营大模型全部 API/MCP 化，MSS（托管安全服务）覆盖 3500 家企业客户，将 T1 研判员从 50 人削减至 5 人，并已斩获 8 个海外百万美金大单；提出“人是 AI 的一个环节”理念，推动安全运营从“AI 辅助人”转向“人成为 AI 工作流审核环节”。",
       "网络安全运营告警海量、研判人力成本高，传统 SAST/运营工具难以规模化提效，安全厂商亟需以大模型重构交付模式。",
       "安全运营研判依赖大量人工，T1 层级重复劳动多、效率低；私有化与云端大模型效果与成本需平衡。",
       "将检测大模型与运营大模型 API/MCP 化并集成主流开发环境；以 MSS 托管模式规模化交付，把 T1 研判压缩到极小团队，人转为 AI 工作流审核；以开源基座+15 年安全运营语料构建壁垒。",
       ["安全大模型 API/MCP 化", "MSS 规模化交付", "T1 研判团队重构", "海外百万美金大单突破"],
       [{"label": "MSS 覆盖客户", "value": "3500 家企业", "kind": "actual"},
        {"label": "T1 研判员", "value": "50 人→5 人", "kind": "actual"},
        {"label": "海外百万美金大单", "value": "8 个", "kind": "actual"}],
       "人机关系重构与 MCP 化交付带来运营效率与客户规模双提升，验证“AI for Security”规模商业化，海外拓展打开增量。",
       ["大模型", "智能体", "MCP", "安全运营"], ["深信服安全 GPT / 检测+运营大模型"],
       ["网络安全", "安全大模型", "MSS", "MCP"],
       "2026-04-27", 2025, conf="high", featured=True),

    mk("research-2026-anheng-ai", "安恒信息：恒脑大模型驱动，2025 AI 收入超 2 亿、订阅客户逾千",
       {"id": "org-anheng", "name": "安恒信息", "size": "large", "region": "杭州", "type": "private"},
       "安恒信息 2025 年 AI 相关收入超过 2 亿元、订阅客户逾 1000 个；以“中国版 Cloud Code”为定位加速布局，恒脑大模型推动产品 MCP 化改造并建立 MCP 平台，覆盖安全运营与开发安全场景。",
       "安全运营与开发安全场景对智能辅助诉求强，厂商需在“AI 叫好不叫座”质疑中以可量化收入证明商业化。",
       "安全运营人力瓶颈与开发安全（SAST）误报率高、传统工具生存周期受 AI 原生工具冲击。",
       "以恒脑大模型为核心，推动全线产品 MCP 化改造并建立 MCP 平台；以订阅模式交付 AI 安全能力，覆盖安全运营与代码安全。",
       ["恒脑大模型落地", "产品 MCP 化改造+MCP 平台", "AI 订阅模式", "Cloud Code 定位布局"],
       [{"label": "2025 AI 相关收入", "value": "超过 2 亿元", "kind": "actual"},
        {"label": "AI 订阅客户", "value": "逾 1000 个", "kind": "actual"}],
       "AI 相关收入规模与订阅客户数双突破，打破“AI for Security 叫好不叫座”刻板印象，订阅模式改善收入质量。",
       ["大模型", "智能体", "MCP", "代码安全"], ["安恒恒脑大模型"],
       ["网络安全", "恒脑", "AI订阅", "开发安全"],
       "2026-04-27", 2025),

    mk("research-2026-venustech-ai", "启明星辰：“1+1+N”架构全产线 AI 化，AI 项目 35 个、客单价翻倍",
       {"id": "org-venustech", "name": "启明星辰", "size": "large", "region": "北京", "type": "private"},
       "启明星辰以“1+1+N”架构（统一大模型 + AIDK 智能体框架 + N 条产线智能体）推进全产线 AI 化，2025 年交付 AI 项目 35 个、AI 版客单价从 20 万元翻倍至 40-50 万元；与中国移动战略级绑定构成独特生态壁垒。",
       "安全厂商需将 AI 能力系统沉淀到全产线，避免单点插件式碎片化，并以客单价提升证明价值。",
       "AI 能力碎片化、缺统一框架；安全运营价值难以量化、客单价低。",
       "以统一大模型为底座、AIDK 智能体框架统一接口（支持 MCP/A2A 协议），驱动 N 条产线智能体化；借助中国移动生态实现规模落地与客单价提升。",
       ["“1+1+N”架构", "AIDK 智能体框架（MCP/A2A）", "全产线智能体化", "中国移动生态绑定"],
       [{"label": "交付 AI 项目", "value": "35 个", "kind": "actual"},
        {"label": "AI 版客单价", "value": "20 万元→40-50 万元（翻倍）", "kind": "actual"}],
       "全产线 AI 化带来客单价翻倍与项目规模化，叠加中国移动战略绑定，形成难以复制的生态壁垒。",
       ["大模型", "智能体", "MCP/A2A"], ["启明星辰安星/观星大模型"],
       ["网络安全", "智能体框架", "全产线AI", "运营商生态"],
       "2026-04-27", 2025),

    mk("research-2026-asiainfo-ai", "亚信安全：AIXDR 一年落地 60+ 客户，MTDR 响应压缩至 1 分钟",
       {"id": "org-asiainfo-sec", "name": "亚信安全", "size": "large", "region": "南京", "type": "private"},
       "亚信安全依托并购亚信科技形成的“安全+数智+连接”三合一战略，AIXDR 联动防御系统在一年内落地 60+ 客户；在成都世运会实战验证 MTDR（托管检测与响应）从小时级压缩至 1 分钟，构建运营商生态内差异化优势。",
       "运营商与大型活动场景对安全响应时效要求极高，传统 XDR 响应慢、协同弱。",
       "安全检测与响应链条长、MTTR 高；缺少跨“安全+数智+连接”的联动能力。",
       "以 AIXDR 联动防御系统打通检测-响应闭环，结合运营商生态规模化交付；以实战（世运会）验证 MTDR 分钟级响应。",
       ["AIXDR 联动防御系统", "运营商生态规模化", "成都世运会实战验证", "MTDR 分钟级响应"],
       [{"label": "AIXDR 落地客户", "value": "60+ 家", "kind": "actual"},
        {"label": "MTDR 响应时间", "value": "小时级→1 分钟", "kind": "actual"}],
       "AIXDR 规模落地与分钟级响应验证 AI 安全运营价值，运营商生态绑定构筑差异化壁垒。",
       ["大模型", "智能体", "XDR"], ["亚信安全 AIXDR"],
       ["网络安全", "XDR", "智能响应", "运营商"],
       "2026-04-27", 2025),

    mk("research-2026-360sec-ai", "360 数字安全：安全能力全面 MCP 化，OpenClaw 直连中石油/上海公安",
       {"id": "org-360sec", "name": "360 数字安全", "size": "large", "region": "北京", "type": "private"},
       "360 数字安全将所有安全检测、情报、响应能力全面 MCP 化，中石油和上海公安已通过 OpenClaw 直接调用 360 安全能力，代表“能力即服务（CaaS）”最前沿实践；保留 14B 自训模型用于精度敏感场景，通用任务全面转向开源基座。",
       "企业/政企客户呼唤按需调用的安全能力，传统一体化交付难以灵活适配多场景。",
       "安全能力割裂、集成成本高；客户希望像调用 API 一样按需获取安全能力。",
       "将核心安全能力 API/MCP 化，以 OpenClaw 作为“能力即服务”入口供中石油、上海公安等直连调用；以百 PB 级安全数据+14B 自训模型覆盖精度敏感场景。",
       ["安全能力全面 MCP 化", "OpenClaw 能力即服务", "中石油/上海公安直连", "14B 自训+开源基座"],
       [{"label": "OpenClaw 接入客户", "value": "中石油、上海公安等", "kind": "actual"},
        {"label": "安全数据规模", "value": "百 PB 级", "kind": "actual"}],
       "MCP 化与“能力即服务”重构安全交付范式，百 PB 数据+自训模型构成垂域精调壁垒。",
       ["大模型", "智能体", "MCP", "能力即服务"], ["360 BrainGPT / 14B 自训模型"],
       ["网络安全", "MCP", "能力即服务", "OpenClaw"],
       "2026-04-27", 2025, conf="medium"),
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
