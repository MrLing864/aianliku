# -*- coding: utf-8 -*-
"""生成《大模型金融应用实践及发展建议报告》（北京金融信息化研究所, 2024）8个新增银行/券商案例的完整 CaseStudy JSON。工行/农行/平安已在其他报告中覆盖，此处跳过。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "finance": {"id": "industry-finance", "code": "J", "name": "金融业", "displayName": "金融", "slug": "finance",
                "description": "风控、合规、运营与知识服务案例。", "icon": "Landmark", "featured": True,
                "standardVersion": "GB/T 4754-2017+1"},
}

SCN = {
    "knowledge-base": {"id": "scene-knowledge", "name": "企业知识库", "slug": "knowledge-base",
                       "description": "让制度、产品和业务资料可检索、可问答。", "synonyms": ["知识问答", "RAG", "内部知识库"],
                       "icon": "LibraryBig", "featured": True},
    "content-generation": {"id": "scene-content", "name": "内容生成", "slug": "content-generation",
                           "description": "营销、商品、培训和多语言内容生产。", "synonyms": ["AIGC", "营销文案", "内容创作"],
                           "icon": "Sparkles", "featured": False},
    "workflow": {"id": "scene-workflow", "name": "流程自动化", "slug": "workflow",
                 "description": "连接业务系统，减少重复录入和人工流转。", "synonyms": ["Workflow", "RPA", "自动化流程"],
                 "icon": "Workflow", "featured": True},
    "customer-service": {"id": "scene-customer-service", "name": "智能客服", "slug": "customer-service",
                         "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服", "客服机器人", "在线客服"],
                         "icon": "MessagesSquare", "featured": True},
    "forecast": {"id": "scene-forecast", "name": "预测与分析", "slug": "forecast",
                 "description": "需求、销量、库存、设备和经营指标预测。", "synonyms": ["需求预测", "数据分析", "预测性维护"],
                 "icon": "ChartNoAxesCombined", "featured": False},
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
              "icon": "Bot", "featured": True},
    "ocr": {"id": "scene-ocr", "name": "OCR / 文档识别", "slug": "ocr",
            "description": "从票据、合同、单据和图片提取结构化信息。", "synonyms": ["文字识别", "文档识别", "录单"],
            "icon": "ScanText", "featured": True},
}

REPORT_TITLE = "《大模型金融应用实践及发展建议报告》（北京金融信息化研究所, 2024）"
REPORT_PUBLISHER = "北京金融信息化研究所"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags,
       model_stack, org_size="未披露", region="未披露", client=""):
    slug = f"case-finance-practice-2024-{idx:02d}"
    src_id = f"src-{slug}-0"
    doc = {
        "id": slug, "slug": slug, "version": 1, "title": title,
        "organization": {"id": f"org-{slug}", "name": org_name, "size": org_size, "region": region, "type": org_type},
        "industry": IND[industry_slug], "scenarios": scn(*scenario_slugs),
        "businessFunctions": business_functions, "summary": summary, "background": background,
        "problem": problem, "solution": solution, "implementationSteps": steps,
        "duration": "未披露", "cost": "未披露", "results": results, "roi": roi, "risks": risks,
        "editorComment": {"suitableFor": suitable_for, "prerequisites": prerequisites,
                          "priority": priority, "text": ""},
        "implementers": [{"name": implementer, "role": "技术提供方"}],
        "outcomeStatus": "success", "contentStatus": "published", "confidence": "high",
        "sources": [{"id": src_id, "title": REPORT_TITLE, "publisher": REPORT_PUBLISHER,
                     "type": "institution", "publishedAt": "2024", "collectedAt": TODAY,
                     "accessibility": "available", "supports": ["金融应用实践", "行业报告"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2024, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2024},
        "ctaText": "预约同款 AI 落地方案咨询",
    }
    doc["editorComment"]["text"] = (
        f"该案例收录于北京金融信息化研究所《大模型金融应用实践及发展建议报告》，"
        f"反映了国内银行在智能客服、智能办公、智能研发与智能投研等场景的大模型落地实践。"
    )
    return doc


cases = [
    mk(1, "中国邮政储蓄银行", "soe", "finance", ["knowledge-base", "customer-service"], ["客服", "办公"],
       "邮储银行基于Langchain与向量库搭建“灵犀”知识问答与“小邮助手”",
       "邮储银行运用大模型技术搭建智能知识问答系统“灵犀”，采用Langchain与向量数据库技术，结合大模型自然语言理解与生成能力，实现垂直领域知识智能解答；并搭建“小邮助手”智能机器人，提供在线业务知识问答、热点问题分类展示，实现业务难点要点即时回复与精准提示，提升柜员操作体验与业务处理效率。",
       "邮储网点多、柜员业务知识查询频繁，传统知识库依赖人力运维、响应慢。",
       "知识库运维依赖人力、多语义理解难、柜员操作指导慢。",
       "Langchain+向量库构建灵犀知识问答；小邮助手提供即时业务问答与提示。",
       ["搭建灵犀知识问答系统", "Langchain+向量库落地", "上线小邮助手机器人", "赋能柜员与业务办理"],
       [{"label": "能力", "value": "专业知识智能解答、即时回复提示", "kind": "actual"},
        {"label": "价值", "value": "柜员操作体验与业务效率提升", "kind": "actual"}],
       "网点业务知识服务提效",
       "金融数据敏感，需私有化与合规。",
       "银行、金融机构的知识问答与柜员辅助",
       "Langchain、向量数据库、大模型", "建议优先",
       "邮储银行", "灵犀+小邮助手知识问答",
       ["金融", "银行", "知识库", "智能客服"], ["Langchain", "向量数据库"], client="邮储银行"),

    mk(2, "北京银行", "soe", "finance", ["agent", "knowledge-base", "workflow"], ["客服", "办公", "经营管理"],
       "北京银行“京智助手”大模型对话机器人覆盖全行1万+员工",
       "北京银行搭建“京智助手”大模型对话机器人，提供行内知识问答、数据分析、任务执行等功能，应用于协同办公、智能客服、合规管理等场景。目前已向全行10000多名员工开放，并建设移动端与PAD端，在合规管理、数据分析和流程自动化场景取得应用成效。",
       "银行内部知识分散、员工办公与合规查询效率低。",
       "知识查询慢、办公自动化不足、合规管理依赖人工。",
       "构建京智助手对话机器人，覆盖知识问答/数据分析/任务执行，多端开放。",
       ["搭建京智助手", "覆盖知识问答/数据分析/任务执行", "面向全行开放多端", "落地办公/客服/合规场景"],
       [{"label": "覆盖员工", "value": "全行10000+名员工", "kind": "actual"},
        {"label": "应用场景", "value": "协同办公/智能客服/合规管理", "kind": "actual"}],
       "全员办公与合规效率提升",
       "金融合规，需内容审核。",
       "银行的全员AI助手建设",
       "大模型、京智助手平台", "建议优先",
       "北京银行", "京智助手覆盖1万+员工",
       ["金融", "银行", "智能助手", "全员AI"], ["京智助手"], client="北京银行"),

    mk(3, "交通银行", "soe", "finance", ["workflow", "content-generation"], ["办公", "客服"],
       "交通银行基于大模型打造会议纪要助手，口语记录自动生成书面纪要",
       "交通银行在办公软件中嵌入基于大模型的智能问答助手，为员工提供人资规章、授信、对公、零售等场景的会话式咨询；同时利用大模型搭建会议纪要助手，从口语化的会议记录中提取讨论主题、观点、结论，组织成连贯自然的语言，生成书面化会议纪要和待办事项。",
       "银行会议多、纪要整理耗时，员工咨询依赖人工。",
       "会议纪要手工整理慢、员工咨询渠道分散。",
       "嵌入办公软件的大模型问答助手+会议纪要自动生成。",
       ["嵌入办公智能问答助手", "覆盖多业务场景咨询", "搭建会议纪要助手", "口语→书面纪要与待办"],
       [{"label": "能力", "value": "会议纪要自动生成与待办提取", "kind": "actual"},
        {"label": "价值", "value": "办公与咨询效率提升", "kind": "actual"}],
       "办公协同效率提升",
       "会议内容涉敏，需脱敏。",
       "银行的智能办公场景",
       "大模型、办公集成", "建议优先",
       "交通银行", "会议纪要助手自动成稿",
       ["金融", "银行", "智能办公", "会议纪要"], ["大模型"], client="交通银行"),

    mk(4, "上海银行", "soe", "finance", ["knowledge-base", "workflow"], ["客服", "办公"],
       "上海银行融合大模型与行内知识库，智能办公与客服双提效",
       "上海银行在客户服务领域运用大模型理解能力并结合行内知识库，自动完成有效知识提取与采编，解决知识库运维依赖人力、多语义理解等问题；在办公场景搭建智能办公助手，接入知识库实现长文档自动检索生成知识条目，并接入办公系统提供公文检查、写作、总结润色等功能。",
       "上海银行知识库运维难、客服复杂场景分解慢、公文写作负担重。",
       "知识库运维人力高、客服复杂场景难、办公写作慢。",
       "大模型+知识库实现知识自动采编；智能办公助手覆盖写作/检查/润色。",
       ["大模型+知识库客服", "知识自动提取采编", "搭建智能办公助手", "公文检查与写作润色"],
       [{"label": "能力", "value": "知识自动采编与办公写作辅助", "kind": "actual"},
        {"label": "价值", "value": "客服与办公效率提升", "kind": "actual"}],
       "客服与办公双提效",
       "金融内容需合规审核。",
       "银行的智能办公与客服",
       "大模型、行内知识库", "建议优先",
       "上海银行", "智能办公+客服双提效",
       ["金融", "银行", "知识库", "智能办公"], ["大模型"], client="上海银行"),

    mk(5, "兴业银行 / 兴银理财", "soe", "finance", ["forecast", "knowledge-base"], ["投研"],
       "兴业银行构建研报摘要一体化方案，兴银理财投研提效",
       "兴业银行通过大模型技术实现研报摘要智能生成，构建包括研报文档结构化、信息抽取和大语言模型语义理解摘要生成的一体化解决方案，实现研报核心内容智能提炼，提高了兴银理财子公司投研团队查询、阅读内外部研报的效率，加快投资决策效率并节省人力成本。",
       "投研团队需阅读海量研报，核心观点提炼耗时。",
       "研报阅读量大、摘要慢、投资决策滞后。",
       "研报结构化+信息抽取+大模型语义摘要一体化方案。",
       ["研报文档结构化", "信息抽取", "大模型语义摘要", "服务兴银理财投研"],
       [{"label": "价值", "value": "研报查询阅读效率提升、决策加快", "kind": "actual"},
        {"label": "成本", "value": "一定程度节省人力成本", "kind": "actual"}],
       "投研团队效率与决策提速",
       "投研内容需人工复核。",
       "银行理财子公司的投研场景",
       "大模型、研报结构化", "建议优先",
       "兴业银行", "研报摘要一体化提效",
       ["金融", "银行", "智能投研", "研报摘要"], ["大模型"], client="兴业银行/兴银理财"),

    mk(6, "国泰君安证券", "soe", "finance", ["forecast", "knowledge-base", "ocr"], ["投研", "办公"],
       "国泰君安用NL2SQL与OCR升级投研问答与智慧办公",
       "国泰君安证券利用大模型的自然语言到结构化查询（NL2SQL）能力，改进传统问答系统的精准性和灵活性，实现投研领域行情、公司、基金等数据的精确高效问答；并将大模型与OCR、语音识别结合，开发智能办公助手与知识库问答，提供会议纪要生成、邮件撰写等工具。",
       "券商投研数据查询门槛高、办公文档处理慢。",
       "数据查询需SQL、办公文档处理繁琐。",
       "NL2SQL实现投研数据问答；OCR+大模型构建办公助手。",
       ["NL2SQL投研问答", "OCR+大模型办公助手", "会议纪要与邮件工具", "知识库问答"],
       [{"label": "能力", "value": "投研数据精确问答、办公自动化", "kind": "actual"},
        {"label": "价值", "value": "投研与办公效率提升", "kind": "actual"}],
       "投研与办公双提效",
       "金融数据需合规。",
       "券商的投研与办公场景",
       "大模型、NL2SQL、OCR", "建议优先",
       "国泰君安", "NL2SQL投研问答",
       ["金融", "证券", "智能投研", "NL2SQL"], ["大模型", "NL2SQL"], client="国泰君安证券"),

    mk(7, "华泰证券", "soe", "finance", ["content-generation", "forecast"], ["投研"],
       "华泰证券探索大模型自动撰写研究报告初稿",
       "华泰证券探索运用大模型对文本的学习理解能力，学习历史研报的撰写模式、分析逻辑和行文风格，实现研究报告初稿的自动撰写；已初步搭建内容召回、内容生成的线上撰写服务框架，打通非结构化财报解析、embedding财报知识库构建、历史研报高相关内容召回与生成。",
       "券商研究员撰写研报工作量大、初稿耗时长。",
       "研报撰写慢、初稿依赖人工。",
       "学习历史研报风格，构建召回+生成框架自动写初稿。",
       ["学习历史研报模式", "构建召回+生成框架", "财报非结构化解析", "研报初稿自动撰写"],
       [{"label": "能力", "value": "研究报告初稿自动撰写", "kind": "actual"},
        {"label": "价值", "value": "研究员撰写效率提升", "kind": "actual"}],
       "投研写作效率提升",
       "研报需合规审查与人工把关。",
       "券商的研究报告自动化",
       "大模型、embedding知识库", "建议优先",
       "华泰证券", "研报初稿自动撰写",
       ["金融", "证券", "研报生成", "内容生成"], ["大模型"], client="华泰证券"),

    mk(8, "国信证券", "private", "finance", ["customer-service", "content-generation", "forecast"], ["客服", "投研"],
       "国信证券用大模型自动生成服务话术与客户指标数据",
       "国信证券探索运用大模型技术自动化生成服务话术和客户指标数据，涵盖知识问答、行业分析、行情快报、客户资产配置建议、资讯推送摘要、投诉建议反馈等，提升运营人员的服务质量和效率；并运用大模型辅助代码生成，协助IT、产品、运营人员进行代码编写与数据分析。",
       "券商运营人员服务话术与指标数据生成慢，研发效率低。",
       "话术/指标生成慢、研发辅助不足。",
       "大模型自动生成话术与指标数据；辅助代码生成与数据分析。",
       ["自动化服务话术生成", "客户指标数据生成", "资讯摘要与配置建议", "辅助代码与数据分析"],
       [{"label": "能力", "value": "话术/指标/摘要自动生成", "kind": "actual"},
        {"label": "价值", "value": "运营与研发效率提升", "kind": "actual"}],
       "运营与研发双提效",
       "金融内容需合规。",
       "券商的运营与研发场景",
       "大模型、代码辅助", "建议优先",
       "国信证券", "话术与指标自动生成",
       ["金融", "证券", "智能客服", "代码辅助"], ["大模型"], client="国信证券"),
]

out_path = "scripts/extracted/finance-practice-2024-cases.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)
print(f"Generated {len(cases)} cases -> {out_path}")

with open(out_path, "r", encoding="utf-8") as f:
    data = json.load(f)
print(f"Verified: {len(data)} cases")
bad = 0
for c in data:
    if not isinstance(c["industry"], dict) or "slug" not in c["industry"]:
        bad += 1; print("BAD industry:", c["slug"])
    for s in c["scenarios"]:
        if not isinstance(s, dict) or "slug" not in s:
            bad += 1; print("BAD scenario:", c["slug"])
    for req in ["outcomeStatus", "confidence", "editorComment", "sources"]:
        if req not in c:
            bad += 1; print("MISSING", req, c["slug"])
print("Validation issues:", bad)
