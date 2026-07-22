# -*- coding: utf-8 -*-
"""生成《大模型应用落地白皮书：企业AI转型行动指南》（火山引擎/IDC, 2025）14个企业落地案例的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "finance": {"id": "industry-finance", "code": "J", "name": "金融业", "displayName": "金融", "slug": "finance",
                "description": "风控、合规、运营与知识服务案例。", "icon": "Landmark", "featured": True,
                "standardVersion": "GB/T 4754-2017+1"},
    "retail": {"id": "industry-retail", "code": "F", "name": "零售业", "displayName": "零售消费", "slug": "retail",
               "description": "电商、品牌、餐饮与连锁的营销、客服与运营 AI 实践。", "icon": "ShoppingBag",
               "featured": True, "standardVersion": "GB/T 4754-2017+1"},
    "automotive": {"id": "industry-automotive", "code": "C36", "name": "汽车制造业", "displayName": "汽车", "slug": "automotive",
                   "description": "整车与零部件企业的研发、营销、生产与智能座舱 AI 实践。", "icon": "Car",
                   "featured": True, "standardVersion": "GB/T 4754-2017+1", "parentCode": "C"},
    "education": {"id": "industry-education", "code": "P", "name": "教育", "displayName": "教育", "slug": "education",
                  "description": "教学内容、教务、知识问答和学习支持案例。", "icon": "GraduationCap", "featured": True,
                  "standardVersion": "GB/T 4754-2017+1"},
    "software-internet": {"id": "industry-software", "code": "I65", "name": "软件和信息技术服务业", "displayName": "软件与互联网",
                          "slug": "software-internet", "description": "研发、运维、客服、销售与内容生产案例。", "icon": "Code2",
                          "featured": True, "standardVersion": "GB/T 4754-2017+1", "parentCode": "I"},
    "manufacturing": {"id": "industry-manufacturing", "code": "C", "name": "制造业", "displayName": "制造业", "slug": "manufacturing",
                      "description": "生产、质检、设备维护、供应链与经营管理中的 AI 实践。", "icon": "Factory",
                      "featured": True, "standardVersion": "GB/T 4754-2017+1"},
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
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
              "icon": "Bot", "featured": True},
}

REPORT_TITLE = "火山引擎《大模型应用落地白皮书：企业AI转型行动指南》（IDC, 2025）"
REPORT_PUBLISHER = "火山引擎 / IDC"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags,
       model_stack, org_size="未披露", region="未披露", client=""):
    slug = f"case-landing-2025-{idx:02d}"
    src_id = f"src-{slug}-0"
    client_note = f"（落地客户：{client}）" if client else ""
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
                     "type": "institution", "publishedAt": "2025", "collectedAt": TODAY,
                     "accessibility": "available", "supports": ["企业落地案例", "最佳实践"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2024, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2025},
        "ctaText": "预约同款 AI 落地方案咨询",
    }
    doc["editorComment"]["text"] = (
        f"该案例收录于火山引擎与IDC联合发布的《大模型应用落地白皮书》，由{implementer}落地{client_note}，"
        f"具备清晰的收益与落地路径，建议结合自身业务参考落地。"
    )
    return doc


cases = [
    mk(1, "赛力斯集团", "private", "automotive", ["forecast", "agent"], ["经营管理", "客服"],
       "赛力斯携手豆包大模型打造用户之声（VOC）管理平台，用户反馈闭环智能化",
       "赛力斯联合火山引擎，基于豆包大模型构建用户之声（VOC）管理平台，对公域/私域用户反馈做情绪正负向判定、600+汽车行业标签提取、观点总结（3000字精简至200-300字），实现用户反馈分析由人工承接转为模型承接。",
       "新能源汽车用户对产品体验反馈海量且分散，传统人工分析慢、易漏判，难以支撑业务部门快速决策。",
       "反馈收集-分析-响应链路长，人工处理效率低、情绪与观点识别主观，难以形成可行动的洞察。",
       "基于豆包大模型的理解/分类/总结能力，共建VOC平台：情绪正负向判定、内容标签提取、观点结构化总结、实时数据采集与下钻分析。",
       ["厘清用户反馈处理环节", "接入豆包大模型做情绪/标签/观点分析", "搭建实时数据采集与下钻分析", "面向业务部门输出洞察"],
       [{"label": "情绪判定", "value": "正向/中立/负向自动标签，避免人工漏判", "kind": "actual"},
        {"label": "观点总结", "value": "3000字反馈精简至200-300字结构化观点", "kind": "actual"},
        {"label": "反馈闭环", "value": "用户反馈闭环效率与满意度提升", "kind": "actual"}],
       "用户满意度与业务部门决策效率提升",
       "需持续迭代标签体系与行业知识。",
       "汽车、消费电子等重视用户之声的企业",
       "用户反馈数据、标签体系、豆包大模型", "建议优先",
       "火山引擎（豆包大模型）", "3000字反馈秒级精炼为结构化观点",
       ["汽车", "用户之声", "VOC", "豆包大模型"], ["豆包大模型"], client="赛力斯"),

    mk(2, "上汽乘用车", "soe", "automotive", ["forecast", "agent"], ["经营管理", "客服"],
       "上汽乘用车基于豆包大模型构建用户之声分析平台，快速聆听市场反馈",
       "上汽乘用车引入豆包大模型，整合垂直媒体、论坛、微博、企业APP等渠道的用户反馈，快速筛选、分类、分析海量评论，识别关键诉求与情感倾向，支撑产品改进、服务优化与市场策略调整。",
       "汽车企业需处理来自多平台海量用户反馈，传统方式难以及时捕捉关键声音、快速响应市场。",
       "海量反馈处理慢、关键诉求识别难、市场响应滞后。",
       "基于豆包大模型自然语言理解能力，对用户评论做筛选/分类/情感分析，并将分析结果反哺产品与策略。",
       ["整合多渠道用户反馈数据", "豆包大模型做分类与情感分析", "深挖长文主题与诉求", "驱动产品改进与市场策略"],
       [{"label": "处理效率", "value": "公域/私域反馈快速处理且逐条精确理解", "kind": "actual"},
        {"label": "落地成效", "value": "服务反馈、热点跟踪、质量改进显著", "kind": "actual"}],
       "用户体验与市场响应速度提升",
       "需结合业务系统形成闭环动作。",
       "汽车、快消等重视口碑监测的企业",
       "多渠道反馈数据、豆包大模型", "建议优先",
       "火山引擎（豆包大模型）", "用户之声快速理解驱动质量改进",
       ["汽车", "用户之声", "舆情分析", "豆包大模型"], ["豆包大模型"], client="上汽乘用车"),

    mk(3, "海尔消费金融", "private", "finance", ["customer-service", "workflow"], ["客服", "风控"],
       "海尔消金携手豆包大模型为信贷资产管理提质增效，坐席准确率超95%",
       "海尔消金基于字节豆包大模型构建金融大模型，覆盖风控、客服、贷后管理、意愿度识别等90%+智能化场景；坐席助手摘录准确率超95%，每天为坐席节约1-3小时，初期效果提升15-20%。",
       "消费金融贷前/贷中/贷后环节多，坐席日均摘录200余次、耗时2+小时，描述不准、口语化严重。",
       "坐席手工摘录耗时长、信息不准，客服与贷后管理效率低。",
       "整理贷款知识/客户信息/员工手册连接豆包大模型；通过扣子搭建业务智能体；成立金融大模型联合创新实验室。",
       ["整理贷款知识与员工手册并连接大模型", "用扣子搭建不同业务智能体", "落地风控/客服/贷后场景", "成立金融大模型联合实验室"],
       [{"label": "坐席摘录准确率", "value": "超过95%", "kind": "actual"},
        {"label": "坐席工时", "value": "每天节约1-3小时", "kind": "actual"},
        {"label": "初期效果提升", "value": "15-20%", "kind": "actual"}],
       "客服与贷后管理效率显著提升",
       "金融数据敏感，需私有化与合规。",
       "消费金融、银行信用卡中心",
       "贷款知识库、扣子平台、豆包大模型", "建议优先",
       "火山引擎（豆包大模型）", "坐席准确率95%，日省1-3小时",
       ["金融", "消费金融", "智能客服", "贷后管理"], ["豆包大模型", "扣子"], client="海尔消费金融"),

    mk(4, "中国飞鹤", "private", "retail", ["customer-service", "agent"], ["客服", "经营管理"],
       "中国飞鹤基于HiAgent平台实现全面AI转型，消费者咨询100%响应、准确率95%",
       "中国飞鹤联合火山引擎搭建AI能力中台，围绕HiAgent平台将AI融入消费者服务、线下活动检核、导购培训、数据分析与智慧农牧等场景，某智能问答项目实现100%问答响应率、超95%准确率。",
       "乳品龙头销售员工水平参差，业务效率与用户交互提升潜力大，需统一AI助手优化体验。",
       "一线服务水平不一、咨询响应慢、培训与运营缺乏智能化手段。",
       "重塑云/业务中台/数据中台，建设AI能力中台，围绕HiAgent落地消费者运营、渠道销售、企业管理三大类场景。",
       ["搭建先进云与数据中台", "建设AI能力中台与HiAgent", "落地消费者/渠道/管理场景", "原厂轻咨询确保生产级标准"],
       [{"label": "问答响应率", "value": "100%", "kind": "actual"},
        {"label": "问答准确率", "value": "超过95%", "kind": "actual"},
        {"label": "应用广度", "value": "覆盖消费者服务/培训/数据分析/智慧农牧", "kind": "actual"}],
       "整体运营效率与竞争力提升",
       "需跨部门协同与数据治理。",
       "零售消费、品牌企业的全面AI转型",
       "云架构、HiAgent平台、豆包大模型", "建议优先",
       "火山引擎（HiAgent）", "消费者咨询100%响应、95%准确",
       ["零售消费", "AI转型", "HiAgent", "智能问答"], ["HiAgent", "豆包大模型"], client="中国飞鹤"),

    mk(5, "中手游", "private", "software-internet", ["agent", "content-generation"], ["研发"],
       "中手游携手火山引擎为《仙剑世界》打造AINPC生态，RAG赋能游戏陪伴",
       "中手游基于火山引擎豆包·角色扮演模型与RAG方案，为《仙剑世界》打造玩家专属剑灵“圆满”及丰富AINPC，提供任务引导、功能唤起、智能传送等，基于玩家行为数据个性化辅助，提升游戏陪伴感。",
       "游戏需要更智能的NPC互动与长线陪伴，传统脚本NPC缺乏记忆与成长。",
       "NPC互动单一、缺乏长期记忆与情境感知。",
       "提供豆包·角色扮演模型；基于向量化模型与VikingDB（P90延时18.2ms）搭建一站式RAG；火山方舟保障高RPM/TPM。",
       ["评估基座模型与RAG组件", "豆包角色扮演模型打造AINPC", "VikingDB搭建游戏RAG知识库", "火山方舟保障高并发稳定"],
       [{"label": "RAG检索延时", "value": "VikingDB P90 18.2ms", "kind": "actual"},
        {"label": "服务稳定", "value": "高RPM/TPM按需扩容，保障超大流量", "kind": "actual"}],
       "游戏互动性与用户留存提升",
       "需平衡生成内容与剧情一致性。",
       "游戏、互动娱乐的AINPC与内容生成",
       "游戏知识库、豆包角色扮演模型、火山方舟", "条件具备后开展",
       "火山引擎（豆包大模型）", "仙剑世界AINPC生态（RAG+角色扮演）",
       ["软件与互联网", "游戏", "AINPC", "RAG"], ["豆包·角色扮演模型", "VikingDB", "火山方舟"], client="中手游"),

    mk(6, "浙江大学", "soe", "education", ["agent", "knowledge-base"], ["教务", "科研"],
       "浙江大学基于HiAgent平台7天建成“浙大先生”大模型应用体系",
       "浙江大学信息技术中心联合火山引擎，基于HiAgent平台7天建成“浙大先生”门户及AI科学家等系列智能体，覆盖教学、科研、教务、校园服务与本地生活，服务超6万名师生，提供课堂问答、教务咨询、百事通助手等。",
       "高校教学/科研/管理/服务系统亟待融入大模型能力，且需支撑全校师生实践AI学习。",
       "场景多、多方协作、时间紧、效果要求高。",
       "HiAgent提供多模型接入、多维数据整合、协同工作空间、灵活发布集成、自动化调测优化，构建系列校园智能体。",
       ["围绕教学/科研/教务需求建设方案", "多模型接入与数据整合", "协同工作空间开发", "7天建成浙大先生体系"],
       [{"label": "建设周期", "value": "仅7天建成完整体系", "kind": "actual"},
        {"label": "服务规模", "value": "超6万名在校师生", "kind": "actual"},
        {"label": "应用场景", "value": "课堂问答/教务咨询/百事通/本地生活", "kind": "actual"}],
       "教学教务科研全面智能化",
       "需对接众多校内系统，权限与数据安全要求高。",
       "高校、科研机构的校园智能化",
       "校园统一身份、HiAgent平台、向量库", "条件具备后开展",
       "火山引擎（HiAgent）", "7天建成校园大模型应用体系",
       ["教育", "高校", "HiAgent", "智能体"], ["HiAgent"], client="浙江大学"),

    mk(7, "苏泊尔", "private", "manufacturing", ["content-generation", "agent"], ["研发", "营销"],
       "苏泊尔联合豆包大模型与扣子打造居家食养健康物联生态",
       "苏泊尔基于扣子专业版打造云馐食谱创作、云馐AI寻味、云馐居家食养健康等智能体，以“Agent as API”方式直连苏泊尔APP与IoT产品，为电饭煲/烤箱/空气炸锅等生成个性化健康食谱，智能炒菜机提供三餐配餐。",
       "厨房电器内容生产效率待提升，消费者需要个性化食谱与智能烹饪体验。",
       "品类内容生产慢、APP体验弱、智能炒菜机生态服务不足。",
       "基于扣子专业版以Agent as API连接产品；豆包大模型+文生图生成个性化食谱；语音交互API提升炒菜机服务。",
       ["基于扣子打造食谱/寻味/食养智能体", "Agent as API直连APP与IoT", "豆包+文生图生成食谱", "语音交互提升炒菜机服务"],
       [{"label": "月均服务", "value": "云馐食谱创作月均服务超15万APP会员", "kind": "actual"},
        {"label": "日均服务", "value": "云馐AI寻味日均服务一日三餐2万多次", "kind": "actual"}],
       "研发提效与用户体验优化",
       "需保证食谱安全与设备联动稳定。",
       "家电、硬件企业的AIoT内容生态",
       "扣子平台、豆包大模型、IoT连接", "条件具备后开展",
       "火山引擎（扣子/豆包）", "月服务15万会员的居家食养AI生态",
       ["制造业", "智能家居", "Agent as API", "食谱生成"], ["豆包大模型", "扣子"], client="苏泊尔"),

    mk(8, "海底捞", "private", "retail", ["customer-service", "workflow"], ["经营管理"],
       "海底捞基于豆包大模型实现智能化客户评价分析，驱动经营优化",
       "海底捞联合火山引擎，基于豆包大模型搭建用户评价分析模型，对餐后评价、投诉工单、第三方平台点评做情绪与观点高效抽取，形成服务/菜品/卫生等维度洞察与“好中差”整体结论，可视化呈现于数据中台。",
       "餐饮门店海量用户评价人工分类分析成本高、效率低，难以及时沉淀经营洞察。",
       "评价分类分析成本高、效率低，经营策略调整滞后。",
       "建设数据中台整合多源评价，过滤无效内容推送大模型；豆包大模型做情绪/观点抽取与多维度总结。",
       ["建设数据中台整合多源评价", "数据治理后推送大模型", "豆包做情绪与观点抽取", "可视化呈现洞察报告"],
       [{"label": "分析效率", "value": "高效精准完成评价分析", "kind": "actual"},
        {"label": "经营指导", "value": "为门店绩效与经营迭代提供指导", "kind": "actual"}],
       "门店绩效与经营持续优化",
       "需结合服务体验，避免唯效率导向。",
       "餐饮、连锁服务企业的评价分析",
       "评价数据中台、豆包大模型", "建议优先",
       "火山引擎（豆包大模型）", "智能化客户评价分析驱动经营",
       ["零售消费", "餐饮", "评价分析", "情感分析"], ["豆包大模型"], client="海底捞"),

    mk(9, "招商银行", "soe", "finance", ["agent", "workflow"], ["客服", "经营管理"],
       "招商银行基于扣子平台落地智能体，构建全面AI能力",
       "招商银行借助火山引擎扣子平台举办全行大模型应用创新大赛，并打造“掌上生活优惠”“财富看点”等智能体，以自然流畅交互提供生活优惠查询与市场行情分析，提升用户满意度与粘性，普及内部智能体能力。",
       "银行希望从高性能基础设施向智能体多元场景拓展，提供更智能、个性化的客户服务。",
       "智能体构建门槛高、场景分散、内部推广难。",
       "以扣子平台提供低门槛智能体构建、企业级插件与多模型适配；办创新大赛激发场景；落地生活/财富智能体。",
       ["引入扣子低代码平台", "举办全行大模型创新大赛", "打造生活/财富智能体", "普及内部智能体能力"],
       [{"label": "交互体验", "value": "更自然、智能、个性化的服务", "kind": "actual"},
        {"label": "内部普及", "value": "智能体技术全行普及", "kind": "actual"}],
       "用户满意度与内部AI能力双提升",
       "金融合规，需内容审核与留痕。",
       "银行、金融机构的智能体平台建设",
       "扣子平台、企业级插件", "建议优先",
       "火山引擎（扣子）", "扣子平台驱动银行智能体创新",
       ["金融", "银行", "智能体", "扣子"], ["扣子"], client="招商银行"),

    mk(10, "领克汽车", "private", "automotive", ["sales", "agent"], ["销售"],
       "领克汽车将豆包大模型打造成销售顾问的得力助手（SalesCopilot）",
       "领克汽车联合火山引擎，基于豆包大模型构建融合SalesCopilot的销售助理，提供本品/竞品深度知识、实时市场趋势，并配套实时对练评级系统与用车知识工具，提升销售顾问专业度与沟通技巧。",
       "汽车销售需强化内训、提升销售技巧并配备智能化工具，以匹配现代消费者购买行为。",
       "销售知识体系弱、对练不足、现代化销售工具缺失。",
       "豆包大模型销售助理提供产品/竞品知识；SalesCopilot对练系统模拟场景；用车知识工具快速查产品信息。",
       ["构建豆包销售助理", "SalesCopilot实时对练评级", "用车知识工具", "低成本快速落地"],
       [{"label": "销售赋能", "value": "精准满足需求、个性化高效服务", "kind": "actual"},
        {"label": "落地成本", "value": "灵活算力支持，极低端侧推理成本", "kind": "actual"}],
       "销售业绩与顾问能力双提升",
       "需结合真实销售流程持续打磨。",
       "汽车、零售等依赖销售顾问的行业",
       "豆包大模型、SalesCopilot", "建议优先",
       "火山引擎（豆包大模型）", "销售Copilot提升顾问能力",
       ["汽车", "销售辅助", "SalesCopilot", "对练"], ["豆包大模型", "SalesCopilot"], client="领克汽车"),

    mk(11, "想法流", "private", "software-internet", ["content-generation", "agent"], ["研发"],
       "想法流基于豆包大模型多模态能力保障更强用户互动",
       "想法流接入火山引擎豆包大模型，以多模态能力打造严格遵循人设、具备常识对话的AI角色，主动开启话题；在千万级TPM保障下线上请求成功率99.95%，token间时延40-50ms。",
       "社交/陪伴平台需提升用户互动性与留存，并保证多场景稳定服务。",
       "角色对话质量与稳定性要求高、需低延时高并发。",
       "以PE提示词调优协助AI角色制作；豆包语音合成/图片人脸合成等多模态支持；MoE架构与充足资源保障延时与RPM/TPM。",
       ["PE提示词调优AI角色", "豆包多模态能力支持", "MoE架构保障资源", "千万级TPM稳定服务"],
       [{"label": "互动次数", "value": "日均互动1.5-2.5倍于其他模型", "kind": "actual"},
        {"label": "互动轮次", "value": "人均1.5-3.5倍", "kind": "actual"},
        {"label": "请求成功率", "value": "99.95%", "kind": "actual"}],
       "用户粘性与互动显著提升",
       "需持续把控人设一致性。",
       "社交、陪伴、内容社区平台",
       "豆包大模型、多模态能力", "条件具备后开展",
       "火山引擎（豆包大模型）", "用户互动提升1.5-2.5倍",
       ["软件与互联网", "AI角色", "多模态", "陪伴"], ["豆包大模型"], client="想法流"),

    mk(12, "深维智信", "private", "software-internet", ["sales", "agent"], ["销售", "客服"],
       "深维智信借助豆包大模型实现营销洞察与培训效率双提升",
       "深维智信基于火山引擎豆包大模型，对销售会话做准实时语义分析，识别客户异议/卡点/矛盾/复盘，提炼高频问题与画像辅助精准营销；并提供实战对练培训。语义质检召回率较常规工具提升55%+，新人培训时间缩短50%，平均成单时长减少22%，人效提升31%。",
       "企业销售过程难透视、培训成本高，需从客户声音出发科学制定策略。",
       "销售过程不透明、培训周期长、成单效率低。",
       "豆包大模型分析销售会话数据，做智能质检与画像提取；对话模拟提升培训对练；提炼需求制定销售策略。",
       ["接入豆包分析销售会话", "语义智能质检与画像", "对话模拟对练培训", "提炼需求制定策略"],
       [{"label": "质检召回率", "value": "较常规工具提升55%以上", "improvement": "+55%", "kind": "actual"},
        {"label": "新人培训时间", "value": "缩短50%", "improvement": "-50%", "kind": "actual"},
        {"label": "平均成单时长", "value": "减少22%", "improvement": "-22%", "kind": "actual"},
        {"label": "平均人效", "value": "提升31%", "improvement": "+31%", "kind": "actual"}],
       "营销转化与培训效率双提升",
       "销售数据隐私需合规。",
       "ToB销售、客服团队的能力提升",
       "豆包大模型、销售会话数据", "建议优先",
       "火山引擎（豆包大模型）", "人效+31%、培训-50%、成单-22%",
       ["软件与互联网", "销售辅助", "智能质检", "培训"], ["豆包大模型"], client="深维智信"),

    mk(13, "和府捞面", "private", "retail", ["customer-service", "workflow"], ["经营管理"],
       "和府捞面基于豆包大模型提效用户评论分析，综合准确率超95%",
       "和府捞面业务人员借助扣子专业版与豆包大模型，对顾客点评做情感分析与智能分类，从环境/服务/菜品等维度提取标签，综合准确率超95%，以JSON输出便于后续处理，替代人工高效完成点评分析。",
       "餐饮品牌需从用户评论洞察菜品与服务问题，调整经营策略。",
       "评论分析依赖人工、效率低、难以结构化。",
       "扣子低代码编排+豆包文本分析做情感倾向识别与多维分类，输出JSON结构化结果。",
       ["业务人员用扣子搭建智能体", "豆包做情感与分类分析", "多维标签提取", "JSON输出供后续处理"],
       [{"label": "分析准确率", "value": "综合超过95%", "kind": "actual"},
        {"label": "替代人工", "value": "高效完成顾客点评分析", "kind": "actual"}],
       "经营策略调整有据可依",
       "需结合业务动作形成闭环。",
       "餐饮、零售品牌的点评分析",
       "扣子专业版、豆包大模型", "建议优先",
       "火山引擎（豆包大模型/扣子）", "评论分析准确率超95%",
       ["零售消费", "餐饮", "评论分析", "情感分析"], ["豆包大模型", "扣子"], client="和府捞面"),

    mk(14, "中和农信", "private", "finance", ["content-generation", "workflow"], ["经营管理"],
       "中和农信借助扣子完成抖音生态内容质检，2人3天上线",
       "中和农信借助扣子专业版，在没有耗费研发人力的情况下，以单Agent（LLM模式）搭建视频内容质检智能体并发布为API，每天自动获取员工自媒体视频做效果分析，将人工抽检变为AI全检。",
       "农村金融服务机构需对员工自媒体抖音内容做合规质检，但研发人力有限。",
       "内容质检靠人工抽检、覆盖有限、研发资源不足。",
       "扣子单Agent+视频理解插件+豆包大模型批量自动化处理；发布为API每日自动获取与分析。",
       ["用扣子搭建质检智能体", "视频理解插件+豆包处理", "发布为API每日自动获取", "2人3天开发上线"],
       [{"label": "开发投入", "value": "2人3天上线，几乎零研发资源", "kind": "actual"},
        {"label": "质检方式", "value": "由人工抽检变为AI全检", "kind": "actual"}],
       "合规质检全覆盖且零研发负担",
       "需保证视频内容理解准确。",
       "金融、涉农机构的自媒体内容质检",
       "扣子专业版、视频理解插件", "条件具备后开展",
       "火山引擎（扣子）", "2人3天实现AI全检",
       ["金融", "内容质检", "Agent", "扣子"], ["扣子", "豆包大模型"], client="中和农信"),
]

out_path = "scripts/extracted/landing-2025-cases.json"
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
