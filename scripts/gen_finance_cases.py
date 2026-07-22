# -*- coding: utf-8 -*-
"""生成《人工智能大模型技术财务应用蓝皮书》（智能财务研究院, 2024）8个企业财务落地案例（匿名A-H）的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "manufacturing": {"id": "industry-manufacturing", "code": "C", "name": "制造业", "displayName": "制造业", "slug": "manufacturing",
                      "description": "生产、质检、设备维护、供应链与经营管理中的 AI 实践。", "icon": "Factory",
                      "featured": True, "standardVersion": "GB/T 4754-2017+1"},
    "other": {"id": "industry-other", "code": "Z99", "name": "其他", "displayName": "其他行业", "slug": "other",
              "description": "难以归入上述行业的综合 AI 应用案例。", "icon": "Layers", "featured": False,
              "standardVersion": "GB/T 4754-2017+1"},
    "finance": {"id": "industry-finance", "code": "J", "name": "金融业", "displayName": "金融", "slug": "finance",
                "description": "风控、合规、运营与知识服务案例。", "icon": "Landmark", "featured": True,
                "standardVersion": "GB/T 4754-2017+1"},
    "automotive": {"id": "industry-automotive", "code": "C36", "name": "汽车制造业", "displayName": "汽车", "slug": "automotive",
                   "description": "整车与零部件企业的研发、营销、生产与智能座舱 AI 实践。", "icon": "Car",
                   "featured": True, "standardVersion": "GB/T 4754-2017+1", "parentCode": "C"},
    "healthcare": {"id": "industry-healthcare", "code": "Q84", "name": "卫生", "displayName": "医疗健康", "slug": "healthcare",
                   "description": "病历、随访、辅助诊疗和医院运营案例。", "icon": "HeartPulse", "featured": True,
                   "standardVersion": "GB/T 4754-2017+1", "parentCode": "Q"},
    "education": {"id": "industry-education", "code": "P", "name": "教育", "displayName": "教育", "slug": "education",
                  "description": "教学内容、教务、知识问答和学习支持案例。", "icon": "GraduationCap", "featured": True,
                  "standardVersion": "GB/T 4754-2017+1"},
}

SCN = {
    "knowledge-base": {"id": "scene-knowledge", "name": "企业知识库", "slug": "knowledge-base",
                       "description": "让制度、产品和业务资料可检索、可问答。", "synonyms": ["知识问答", "RAG", "内部知识库"],
                       "icon": "LibraryBig", "featured": True},
    "workflow": {"id": "scene-workflow", "name": "流程自动化", "slug": "workflow",
                 "description": "连接业务系统，减少重复录入和人工流转。", "synonyms": ["Workflow", "RPA", "自动化流程"],
                 "icon": "Workflow", "featured": True},
    "ocr": {"id": "scene-ocr", "name": "OCR / 文档识别", "slug": "ocr",
            "description": "从票据、合同、单据和图片提取结构化信息。", "synonyms": ["文字识别", "文档识别", "录单"],
            "icon": "ScanText", "featured": True},
    "customer-service": {"id": "scene-customer-service", "name": "智能客服", "slug": "customer-service",
                         "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服", "客服机器人", "在线客服"],
                         "icon": "MessagesSquare", "featured": True},
    "forecast": {"id": "scene-forecast", "name": "预测与分析", "slug": "forecast",
                 "description": "需求、销量、库存、设备和经营指标预测。", "synonyms": ["需求预测", "数据分析", "预测性维护"],
                 "icon": "ChartNoAxesCombined", "featured": False},
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
              "icon": "Bot", "featured": True},
    "quality-inspection": {"id": "scene-quality", "name": "智能质检", "slug": "quality-inspection",
                           "description": "视觉、语音或文本质量检查和异常识别。", "synonyms": ["视觉质检", "AI质检"],
                           "icon": "ScanSearch", "featured": True},
}

REPORT_TITLE = "《人工智能大模型技术财务应用蓝皮书》（智能财务研究院, 2024）"
REPORT_PUBLISHER = "智能财务研究院（上海国家会计学院 / 金蝶 / 元年 / 中兴新云 / 用友 / 浪潮 / 汉得 / 久其）"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags,
       model_stack, org_size="未披露", region="未披露", client=""):
    slug = f"case-finance-2024-{idx:02d}"
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
                     "type": "institution", "publishedAt": "2024-09", "collectedAt": TODAY,
                     "accessibility": "available", "supports": ["财务应用蓝皮书", "行业案例"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2024, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2024},
        "ctaText": "预约同款 AI 落地方案咨询",
    }
    doc["editorComment"]["text"] = (
        f"该案例收录于智能财务研究院《人工智能大模型技术财务应用蓝皮书》，覆盖财务中台、智能客服、"
        f"智能审单、智能风控等场景，是财务大模型落地的代表性实践，建议财务部门参考。"
    )
    return doc


cases = [
    mk(1, "A集团（家电制造企业）", "private", "manufacturing", ["customer-service", "ocr", "forecast", "agent"], ["财务"],
       "A集团基于财务中台GPT打造财务智能客服与生成式分析，财务问答与管报自动化",
       "某家电制造集团A构建财务中台GPT平台，落地生成式智能客服、非结构化附件智能审核、生成式财务分析与生成式管报等场景，将财务制度、核算规则与历史数据沉淀为可问答知识，提升财务共享服务效率与经营洞察能力。",
       "大型制造集团财务共享中心咨询量大、附件审核繁琐、管报编制周期长。",
       "财务咨询依赖人工、非结构化附件审核慢、财务分析与管报编制效率低。",
       "构建财务中台GPT平台（大模型+财务知识库），在智能客服/附件审核/财务分析/管报场景落地。",
       ["搭建财务中台GPT平台", "沉淀财务制度与核算知识库", "落地智能客服与附件审核", "生成式财务分析与管报"],
       [{"label": "应用场景", "value": "智能客服/附件审核/财务分析/管报", "kind": "actual"},
        {"label": "价值", "value": "财务共享服务效率与洞察提升", "kind": "actual"}],
       "财务共享服务提效、管报提速",
       "财务数据敏感，需权限与合规。",
       "制造集团财务共享中心",
       "财务中台GPT、财务知识库", "建议优先",
       "企业自建财务中台", "财务中台GPT打通客服与管报",
       ["制造业", "智能财务", "财务中台", "生成式分析"], ["财务GPT"]),

    mk(2, "B公司（大型企业集团）", "private", "other", ["workflow", "ocr", "knowledge-base", "agent"], ["财务"],
       "B公司构建智能财务平台，智能审单机器人替代人工稽核",
       "某大型企业集团B搭建智能财务平台，落地智能审单机器人、智能交单、智能财务制度助手与智能财务数据分析助手，将报销、稽核、制度问答与数据分析流程智能化。",
       "集团报销与稽核量大、制度问答重复、数据分析依赖人工。",
       "人工审单慢易错、交单繁琐、制度查询耗时、分析滞后。",
       "构建企业大模型应用架构与智能助手，覆盖审单/交单/制度问答/数据分析场景。",
       ["搭建智能财务平台", "智能审单机器人", "智能交单与制度助手", "数据分析助手"],
       [{"label": "应用场景", "value": "智能审单/交单/制度问答/数据分析", "kind": "actual"},
        {"label": "价值", "value": "稽核与报销效率提升", "kind": "actual"}],
       "财务流程自动化与合规增强",
       "需对接业务系统，保证数据准确。",
       "各类大型企业集团财务部门",
       "企业大模型、财务平台", "建议优先",
       "企业自建", "智能审单机器人替代人工稽核",
       ["其他行业", "智能财务", "智能审单", "流程自动化"], ["企业大模型"]),

    mk(3, "C银行", "soe", "finance", ["forecast", "quality-inspection", "agent"], ["风控", "财务"],
       "C银行应用大模型于风险评估、投资组合推荐与欺诈检测",
       "某银行C将大模型应用于风险评估防控、投资组合推荐与欺诈行为检测，通过技术突破提升风险识别及时性与投资决策辅助能力。",
       "银行风险管理与投资决策依赖人工经验，欺诈手段演化快。",
       "风险评估滞后、投顾覆盖有限、欺诈检测难。",
       "构建大模型风险评估与投顾框架，结合技术突破提升检测与推荐能力。",
       ["构建风险评估框架", "投资组合推荐模型", "欺诈行为检测", "技术突破落地"],
       [{"label": "应用场景", "value": "风险评估/投顾推荐/欺诈检测", "kind": "actual"},
        {"label": "价值", "value": "风险识别与决策辅助增强", "kind": "actual"}],
       "风控与投顾能力提升",
       "金融合规严格，需可解释与留痕。",
       "银行、金融机构风险与投顾部门",
       "大模型、风险数据", "建议优先",
       "企业自建", "大模型赋能银行风控与投顾",
       ["金融", "银行", "风控", "欺诈检测"], ["大模型"]),

    mk(4, "D汽车企业", "private", "automotive", ["ocr", "workflow", "forecast", "agent"], ["财务"],
       "D汽车企业基于大模型实现智能采集、智能审核、智能月结与经营分析",
       "某汽车企业D将大模型应用于智能采集、智能审核、智能月结、智能风控与经营分析，打通从票据采集到月结与经营洞察的财务全流程智能化。",
       "汽车企业财务流程长、凭证与审核量大、月结与经营分析耗时。",
       "采集审核人工重、月结周期长、经营分析滞后。",
       "大模型落地智能采集/审核/月结/风控/经营分析五类场景。",
       ["智能采集与识别", "智能审核", "智能月结", "智能风控与经营分析"],
       [{"label": "应用场景", "value": "采集/审核/月结/风控/经营分析", "kind": "actual"},
        {"label": "价值", "value": "财务全流程智能化提效", "kind": "actual"}],
       "财务全流程提效与风险可控",
       "需对接ERP与业务系统。",
       "汽车及制造企业的财务部门",
       "大模型、ERP集成", "建议优先",
       "企业自建", "汽车企业财务全流程智能化",
       ["汽车", "智能财务", "智能月结", "经营分析"], ["大模型"]),

    mk(5, "E大型基础设施综合服务商", "soe", "other", ["workflow", "ocr", "forecast"], ["财务"],
       "E基建服务商落地智能差旅、智能审核与智能融资决策",
       "某大型基础设施综合服务商E将大模型应用于智能差旅、智能审核与智能融资决策，提升费用管控与资金运作效率。",
       "基建服务商差旅频繁、审核量大、融资决策复杂。",
       "差旅报销繁琐、审核慢、融资决策依赖经验。",
       "大模型落地智能差旅/审核/融资决策场景。",
       ["智能差旅", "智能审核", "智能融资决策"],
       [{"label": "应用场景", "value": "智能差旅/审核/融资决策", "kind": "actual"},
        {"label": "价值", "value": "费用管控与资金效率提升", "kind": "actual"}],
       "费用与资金管理水平提升",
       "需对接差旅与资金系统。",
       "基建、工程类企业财务部门",
       "大模型、差旅/资金系统", "条件具备后开展",
       "企业自建", "基建服务商智能财务应用",
       ["其他行业", "智能财务", "智能差旅", "融资决策"], ["大模型"]),

    mk(6, "F医药企业", "private", "healthcare", ["quality-inspection", "customer-service", "workflow"], ["财务"],
       "F医药企业落地合规性监控与智能财务客服",
       "某医药企业F将大模型应用于合规性监控与智能财务客服，强化医药行业监管下的财务合规与内部服务效率。",
       "医药行业监管严格，财务合规要求高、内部咨询量大。",
       "合规监控难、财务咨询重复。",
       "大模型落地合规监控与智能财务客服场景。",
       ["合规性监控应用", "智能财务客服"],
       [{"label": "应用场景", "value": "合规监控/智能财务客服", "kind": "actual"},
        {"label": "价值", "value": "合规与内部服务增强", "kind": "actual"}],
       "财务合规与服务效率提升",
       "医药合规敏感，需严格审核。",
       "医药企业财务与合规部门",
       "大模型、合规规则库", "条件具备后开展",
       "企业自建", "医药企业智能财务应用",
       ["医疗健康", "智能财务", "合规监控", "财务客服"], ["大模型"]),

    mk(7, "G大学", "soe", "education", ["agent", "workflow", "quality-inspection"], ["财务", "教务"],
       "G大学基于财务智能体实现智能财务助理、智能填报与智能稽核",
       "某高校G构建财务智能体（Al Agents/数字会计/智能助理），落地智能财务助理、智能填报与智能稽核，提升师生报销体验与财务稽核效率。",
       "高校财务面向师生，报销咨询与填报量大、稽核繁琐。",
       "报销咨询重复、填报繁琐、稽核效率低。",
       "构建财务模型与知识服务、智能能力组件与财务智能体，落地助理/填报/稽核。",
       ["构建财务模型与知识服务", "智能能力组件", "财务智能体", "助理/填报/稽核落地"],
       [{"label": "应用场景", "value": "智能助理/智能填报/智能稽核", "kind": "actual"},
        {"label": "价值", "value": "师生报销体验与稽核效率提升", "kind": "actual"}],
       "高校财务服务与稽核提效",
       "需保护师生隐私数据。",
       "高校、科研机构的财务部门",
       "财务智能体、高校财务系统", "条件具备后开展",
       "企业自建", "高校财务智能体",
       ["教育", "高校", "财务智能体", "智能填报"], ["财务智能体"]),

    mk(8, "H投资集团", "soe", "finance", ["agent", "forecast", "knowledge-base", "quality-inspection"], ["财务", "风控"],
       "H投资集团落地司库管理、虚假贸易识别与工程风险评价",
       "某投资集团H将大模型应用于共享服务智能问答、管理报告智能分析、司库管理与虚假贸易识别、决算分析填报助手、工程风险评价与合规管理，强化集团财务与风险管控。",
       "投资集团业态多、司库与贸易风险复杂、工程评价繁琐。",
       "问答重复、报告分析慢、虚假贸易识别难、工程评价繁。",
       "大模型落地共享问答/管理报告/司库识别/决算助手/工程风险场景。",
       ["共享服务智能问答", "管理报告智能分析", "司库与虚假贸易识别", "决算助手与工程风险评价"],
       [{"label": "应用场景", "value": "共享问答/管报/司库识别/决算/工程风险", "kind": "actual"},
        {"label": "价值", "value": "集团财务与风控能力增强", "kind": "actual"}],
       "集团财务管控与风控提升",
       "需对接司库与业务系统。",
       "投资集团、国企集团的财务与风控部门",
       "大模型、司库系统", "条件具备后开展",
       "企业自建", "投资集团智能财务与风控",
       ["金融", "投资集团", "司库管理", "虚假贸易识别"], ["大模型"]),
]

out_path = "scripts/extracted/finance-2024-cases.json"
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
