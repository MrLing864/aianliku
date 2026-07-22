# -*- coding: utf-8 -*-
"""生成《大模型技术深度赋能保险行业白皮书》（阳光保险/清华五道口等, 2023/2025）6个国内险企案例的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "finance": {"id": "industry-finance", "code": "J", "name": "金融业", "displayName": "金融", "slug": "finance",
                "description": "风控、合规、运营与知识服务案例。", "icon": "Landmark", "featured": True,
                "standardVersion": "GB/T 4754-2017+1"},
    "healthcare": {"id": "industry-healthcare", "code": "Q84", "name": "卫生", "displayName": "医疗健康", "slug": "healthcare",
                   "description": "病历、随访、辅助诊疗和医院运营案例。", "icon": "HeartPulse", "featured": True,
                   "standardVersion": "GB/T 4754-2017+1", "parentCode": "Q"},
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
    "sales": {"id": "scene-sales", "name": "销售辅助", "slug": "sales",
              "description": "线索分析、销售跟进、沟通总结和方案生成。", "synonyms": ["销售助手", "商机分析", "销售Agent"],
              "icon": "TrendingUp", "featured": True},
    "ocr": {"id": "scene-ocr", "name": "OCR / 文档识别", "slug": "ocr",
            "description": "从票据、合同、单据和图片提取结构化信息。", "synonyms": ["文字识别", "文档识别", "录单"],
            "icon": "ScanText", "featured": True},
    "quality-inspection": {"id": "scene-quality", "name": "智能质检", "slug": "quality-inspection",
                           "description": "视觉、语音或文本质量检查和异常识别。", "synonyms": ["视觉质检", "AI质检"],
                           "icon": "ScanSearch", "featured": True},
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
              "icon": "Bot", "featured": True},
}

REPORT_TITLE = "《大模型技术深度赋能保险行业白皮书》（阳光保险 / 清华大学五道口金融学院 / 中国保险学会 / 百度 / 中科院, 2023）"
REPORT_PUBLISHER = "阳光保险集团等"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags,
       model_stack, org_size="未披露", region="未披露", client=""):
    slug = f"case-insurance-2025-{idx:02d}"
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
                     "type": "institution", "publishedAt": "2023-11", "collectedAt": TODAY,
                     "accessibility": "available", "supports": ["保险行业白皮书", "险企落地案例"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2023, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2023},
        "ctaText": "预约同款 AI 落地方案咨询",
    }
    doc["editorComment"]["text"] = (
        f"该案例收录于《大模型技术深度赋能保险行业白皮书》，反映了国内头部险企的大模型落地实践，"
        f"建议保险机构参考其场景选择与建设路径。"
    )
    return doc


cases = [
    mk(1, "中国人民保险（中国人保）", "soe", "finance", ["knowledge-base", "customer-service", "agent", "workflow"], ["客服", "营销", "办公"],
       "中国人保自研人保大模型（人保智友/文曲星），百余场景落地赋能",
       "中国人保与认知智能国家重点实验室及科大讯飞合作研发首个专属问答大模型，提升多轮口语化意图理解、情感与共情、敏感拒识及条款咨询问答能力，通过“人保智友”在代理人赋能与智能客服试点；并构建人保大模型生态（prompt工厂、博文智库、智选路由、信息安全助手），为文曲星平台、AI智能陪练等提供MaaS服务，已在集团百余个场景落地。",
       "险企知识分散、客服与代理人赋能依赖人工，通用大模型不满足保险专业要求。",
       "保险专业问答难、意图理解弱、知识获取慢、运营成本高等。",
       "自研+合作双轨，构建专属通用大模型底座+垂直场景模型，配套prompt工厂/智库/路由/安全组件提供MaaS。",
       ["合作研发专属问答大模型", "构建人保大模型生态", "落地人保智友/文曲星/AI陪练", "集团百余场景应用"],
       [{"label": "落地场景", "value": "集团百余个场景", "kind": "actual"},
        {"label": "能力", "value": "多轮意图/情感共情/敏感拒识/条款问答", "kind": "actual"}],
       "代理人赋能与客服降本提效",
       "金融合规，需内容安全与敏感拒识。",
       "保险集团的大模型平台建设",
       "人保专属问答大模型、科大讯飞", "建议优先",
       "中国人保 / 科大讯飞", "人保大模型百余场景落地",
       ["金融", "保险", "人保大模型", "智能客服"], ["人保大模型", "科大讯飞"], client="中国人保"),

    mk(2, "平安人寿 / 平安银行", "soe", "finance", ["customer-service", "sales", "forecast"], ["客服", "销售", "风控"],
       "平安推出代理人数字人产品，平安银行构建精准信用评级体系",
       "平安人寿推出基于大模型的数字人产品，协助代理人理解客户需求、收集信息并提供精准产品推荐，尤其助力新人代理人；平安银行利用AIGC深度分析客户信息与消费行为，建立精细的信用评级体系，为不同信用等级与偏好的客户量身定制差异化贷款产品。",
       "保险代理人新人展业难、客户需求理解弱；银行信贷缺乏个性化评级。",
       "代理人能力参差、产品推荐不精准；信贷服务同质化。",
       "平安人寿数字人辅助代理人沟通与推荐；平安银行AIGC构建信用评级与个性化产品体系。",
       ["平安人寿数字人产品", "客户信息收集与推荐", "平安银行AIGC信用分析", "个性化贷款产品"],
       [{"label": "价值", "value": "代理人展业与银行个性化信贷提升", "kind": "actual"}],
       "代理人效能与银行客户满意度提升",
       "需合规与隐私保护。",
       "寿险、银行的大模型客户与信贷应用",
       "大模型数字人、AIGC信用分析", "建议优先",
       "中国平安", "平安数字人+精准信用评级",
       ["金融", "保险", "数字人", "信用评级"], ["大模型"], client="中国平安"),

    mk(3, "平安健康（平安集团）", "private", "healthcare", ["knowledge-base", "agent"], ["经营管理"],
       "平安健康打造AskBob智能医生，服务140万医生、日均27万次辅助决策",
       "平安健康打造专为医生服务的“ChatGPT”——AskBob智能医生，基于4000万医学文献、20万药品说明书、2万临床指南等知识图谱与深度学习模型，为医生提供个体化精准诊疗推荐与辅助决策。截至2023年2月服务140多万名医生、覆盖4.6万家医疗机构、日均提供诊疗辅助决策27万次。",
       "优质医疗资源有限，医生诊疗决策缺乏即时知识支持。",
       "医生获取循证知识慢、基层诊疗能力弱。",
       "构建医学知识图谱+深度学习模型，提供诊疗推荐与辅助决策。",
       ["沉淀4000万文献/20万药品/2万指南", "构建AskBob智能医生", "面向医生提供辅助决策", "覆盖基层医疗机构"],
       [{"label": "服务医生", "value": "超140万名", "kind": "actual"},
        {"label": "覆盖机构", "value": "4.6万家医疗机构", "kind": "actual"},
        {"label": "日均辅助决策", "value": "27万次", "kind": "actual"}],
       "医生诊疗能力与基层医疗提升",
       "医疗决策需医生把关，内容需审核。",
       "医疗、保险机构的大健康AI",
       "医学知识图谱、深度学习", "条件具备后开展",
       "平安健康", "AskBob服务140万医生",
       ["医疗健康", "智能医生", "辅助决策", "知识图谱"], ["AskBob"], client="平安健康"),

    mk(4, "中国太保产险（联合百度）", "soe", "finance", ["ocr", "quality-inspection"], ["客服", "风控"],
       "中国太保产险联合百度打造“太·AI”车辆定损，部件识别准确率超98%",
       "中国太保产险联合百度打造“全智能、无人工”车辆定损工具“太·AI”，针对定损与理赔判定依据复杂、专业性高（尤其人身险劳动损失给付）的场景，部件识别准确率超过98%、损伤识别准确率超过90%，大幅提升定损效率与准确性。",
       "车险定损专业性强、人工定损慢、易争议。",
       "定损依据复杂、人工效率低、客户需求即时性高。",
       "联合百度构建视觉定损大模型，自动识别部件与损伤并判定。",
       ["联合百度构建太·AI", "视觉识别部件与损伤", "自动定损判定", "全智能无人工流程"],
       [{"label": "部件识别准确率", "value": "超过98%", "kind": "actual"},
        {"label": "损伤识别准确率", "value": "超过90%", "kind": "actual"}],
       "车险定损效率与准确性提升",
       "定损需防欺诈，需人工复核兜底。",
       "财险公司的智能定损",
       "视觉大模型、百度", "建议优先",
       "中国太保 / 百度", "太·AI定损准确率98%+",
       ["金融", "保险", "智能定损", "视觉识别"], ["视觉大模型", "百度"], client="中国太保产险"),

    mk(5, "泰康保险集团", "private", "finance", ["knowledge-base", "agent", "ocr"], ["客服", "经营管理"],
       "泰康构建医疗影像解析平台与AI原生应用，覆盖36家分公司",
       "泰康搭建行业内首个支持核保理赔全量数据采集的医疗影像解析平台，覆盖泰康人寿全国36家分公司、赋能“两核”作业人员千余人，提升理赔时效与体验；并探索AI原生应用，对接微软/百度/讯飞/智谱/阿里等大模型，按模型-平台-应用三层构建面向保险与医养的行业大模型与垂类模型，打造绩优代理人数字助理与老年生命链大模型。",
       "保险“两核”（核保/理赔）依赖人工、医养服务需智能化。",
       "医疗资料处理慢、两核效能低、医养服务缺乏智能。",
       "构建医疗影像解析平台实现全量数据采集；分层构建AI原生应用体系（模型/平台/应用）。",
       ["搭建医疗影像解析平台", "覆盖36家分公司赋能两核", "对接多厂商大模型", "打造代理人数字助理与生命链模型"],
       [{"label": "覆盖分公司", "value": "36家", "kind": "actual"},
        {"label": "赋能人员", "value": "两核作业人员千余人", "kind": "actual"},
        {"label": "价值", "value": "两核作业效能极大提升", "kind": "actual"}],
       "两核效率与医养智能化提升",
       "医疗数据敏感，需合规。",
       "保险、医养机构的AI原生应用",
       "多厂商大模型、医疗影像平台", "条件具备后开展",
       "泰康保险集团", "医疗影像解析平台覆盖36家分公司",
       ["金融", "保险", "医养", "AI原生应用"], ["多厂商大模型"], client="泰康保险集团"),

    mk(6, "众安保险（众安科技）", "private", "finance", ["content-generation", "workflow", "knowledge-base"], ["营销", "客服", "研发"],
       "众安保险自研AIGC中台“灵犀”，赋能营销与核心业务系统自动配置",
       "众安科技基于AIGC能力结合保险业务经验自主研发AIGC中台“灵犀”，将内部工具包装为大模型插件，升级内容运营、经营分析与智能坐席助手；其智能营销平台覆盖活动创建、人群圈选、内容触达与自动化运营，可自动生成文章与活动、自动配置运营策略实现千人千面；新一代财险核心业务系统接入生成式AI后，业务人员输入需求即可自动化配置产品上架与风控策略。",
       "保险科技产品实施中内容生成成本高、产品上手难、业务配置繁琐。",
       "内容运营成本高、系统配置依赖专业人员、营销触达低效。",
       "自研灵犀AIGC中台，插件化内部工具，升级营销/坐席/核心业务系统。",
       ["自研灵犀AIGC中台", "插件化内部工具", "升级智能营销平台", "核心业务系统自动配置"],
       [{"label": "价值", "value": "内容运营与系统易用性提升", "kind": "actual"},
        {"label": "营销", "value": "千人千面自动化触达", "kind": "actual"}],
       "保险科技产品效率与体验提升",
       "生成内容需合规审查。",
       "保险科技公司的AIGC中台建设",
       "灵犀AIGC中台、ChatGPT类能力", "条件具备后开展",
       "众安保险（众安科技）", "灵犀AIGC中台赋能保险科技",
       ["金融", "保险科技", "AIGC中台", "智能营销"], ["灵犀AIGC中台"], client="众安保险"),
]

out_path = "scripts/extracted/insurance-2025-cases.json"
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
