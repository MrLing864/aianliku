# -*- coding: utf-8 -*-
"""生成《2024中国"大模型+智能客服"最佳实践案例TOP10》（沙丘社区）10个案例的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "healthcare": {"id": "industry-healthcare", "code": "Q84", "name": "卫生", "displayName": "医疗健康", "slug": "healthcare",
                   "description": "病历、随访、辅助诊疗和医院运营案例。", "icon": "HeartPulse", "featured": True,
                   "standardVersion": "GB/T 4754-2017+1", "parentCode": "Q"},
    "telecom": {"id": "industry-telecom", "code": "I63", "name": "电信、广播电视和卫星传输服务", "displayName": "通信", "slug": "telecom",
                "description": "运营商网络、政企营销与客服场景的 AI 实践。", "icon": "Antenna", "featured": True,
                "standardVersion": "GB/T 4754-2017+1", "parentCode": "I"},
    "government": {"id": "industry-government", "code": "S", "name": "公共管理、社会保障和社会组织", "displayName": "政务与公共服务",
                   "slug": "government", "description": "政务热线、政策问答、城市治理与公共服务的 AI 应用。", "icon": "Building2",
                   "featured": False, "standardVersion": "GB/T 4754-2017+1"},
    "software-internet": {"id": "industry-software", "code": "I65", "name": "软件和信息技术服务业", "displayName": "软件与互联网",
                          "slug": "software-internet", "description": "研发、运维、客服、销售与内容生产案例。", "icon": "Code2",
                          "featured": True, "standardVersion": "GB/T 4754-2017+1", "parentCode": "I"},
    "education": {"id": "industry-education", "code": "P", "name": "教育", "displayName": "教育", "slug": "education",
                  "description": "教学内容、教务、知识问答和学习支持案例。", "icon": "GraduationCap", "featured": True,
                  "standardVersion": "GB/T 4754-2017+1"},
    "energy-mining": {"id": "industry-energy-mining", "code": "B", "name": "采矿业", "displayName": "能源与矿山", "slug": "energy-mining",
                      "description": "煤矿、油气、电力与矿山的智能化、安全管控与生产经营 AI 实践。", "icon": "Fuel",
                      "featured": True, "standardVersion": "GB/T 4754-2017+1"},
}

SCN = {
    "customer-service": {"id": "scene-customer-service", "name": "智能客服", "slug": "customer-service",
                         "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服", "客服机器人", "在线客服", "智能问答"],
                         "icon": "MessagesSquare", "featured": True},
    "sales": {"id": "scene-sales", "name": "销售辅助", "slug": "sales",
              "description": "线索分析、销售跟进、沟通总结和方案生成。", "synonyms": ["销售助手", "商机分析", "销售Agent"],
              "icon": "TrendingUp", "featured": True},
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent", "智能陪练"],
              "icon": "Bot", "featured": True},
    "knowledge-base": {"id": "scene-knowledge", "name": "企业知识库", "slug": "knowledge-base",
                       "description": "让制度、产品和业务资料可检索、可问答。", "synonyms": ["知识问答", "RAG", "内部知识库"],
                       "icon": "LibraryBig", "featured": True},
    "workflow": {"id": "scene-workflow", "name": "流程自动化", "slug": "workflow",
                 "description": "连接业务系统，减少重复录入和人工流转。", "synonyms": ["Workflow", "RPA", "自动化流程"],
                 "icon": "Workflow", "featured": True},
}

REPORT_TITLE = '沙丘社区《2024中国“大模型+智能客服”最佳实践案例TOP10》'
REPORT_PUBLISHER = "沙丘社区"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags, model_stack, client=""):
    slug = f"case-kefu-2024-{idx:02d}"
    src_id = f"src-{slug}-0"
    client_note = f"（落地客户：{client}）" if client else ""
    doc = {
        "id": slug, "slug": slug, "version": 1, "title": title,
        "organization": {"id": f"org-{slug}", "name": org_name, "size": "未披露", "region": "未披露", "type": org_type},
        "industry": IND[industry_slug], "scenarios": scn(*scenario_slugs),
        "businessFunctions": business_functions, "summary": summary, "background": background,
        "problem": problem, "solution": solution, "implementationSteps": steps,
        "duration": "未披露", "cost": "未披露", "results": results, "roi": roi, "risks": risks,
        "editorComment": {
            "suitableFor": suitable_for, "prerequisites": prerequisites, "priority": priority,
            "text": f"该案例来自{REPORT_PUBLISHER}评选的“大模型+智能客服”最佳实践TOP10，由{implementer}落地{client_note}，"
                    f"展示了大模型在客服/知识问答场景中的直接价值，建议结合自身客服与知识库现状参考落地。",
        },
        "implementers": [{"name": implementer, "role": "技术提供方"}],
        "outcomeStatus": "success", "contentStatus": "published", "confidence": "high",
        "sources": [{"id": src_id, "title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "type": "institution",
                     "publishedAt": "2024-05", "collectedAt": TODAY, "accessibility": "available",
                     "supports": ["最佳实践案例", "入选理由"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2024, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2024},
        "ctaText": "预约同款智能客服落地咨询",
    }
    return doc


cases = [
    mk(1, "拜耳（中国）有限公司", "foreign", "healthcare", ["customer-service", "sales"], ["客服", "销售"],
       "拜耳（中国）虚拟医药代表平台，沃丰科技AI大模型赋能医药代表",
       "沃丰科技为拜耳（中国）虚拟医药代表平台提供以AI大模型为支撑的智能客服产品，完成企业微信渠道智能虚拟代表AI赋能，打造影像学院专家社群智能客服系统，助力拜耳实现“双打模式”增长率远高于线下代表单打及行业均值，全年准入近百家医院。",
       "医药代表线下覆盖成本高、学术推广效率低，医生社群运营与合规培训难以规模化。",
       "虚拟医药代表需高效完成知识整理、合规培训与医生社群服务，传统方式难以规模化。",
       "以AI大模型智能客服产品赋能企业微信渠道虚拟代表，打造专家社群智能客服系统，实现线上线下融合的私域运营与学术精细化运营。",
       ["部署沃丰科技AI大模型智能客服", "企业微信渠道智能虚拟代表赋能", "构建影像学院专家社群智能客服", "线上线下融合私域运营"],
       [{"label": "双打模式增长", "value": "增长率远高于线下代表单打及行业均值", "kind": "actual"},
        {"label": "医院准入", "value": "全年准入近百家医院并形成学科圈", "kind": "actual"},
        {"label": "运营质量", "value": "学术精细化运营医生认可度高", "kind": "actual"}],
       "销售与运营效率显著提升，量化ROI未披露",
       "医疗合规要求高，生成内容需合规审核。",
       "医药、医疗等需合规私域运营的行业",
       "AI大模型客服、企业微信私域、合规语料", "建议优先",
       "沃丰科技", "虚拟医药代表，全年准入近百家医院",
       ["医疗健康", "虚拟医药代表", "智能客服", "私域运营"], ["AI大模型", "智能客服"], client="拜耳（中国）"),

    mk(2, "中国电信股份有限公司湖北分公司", "soe", "telecom", ["agent", "customer-service"], ["客服"],
       "湖北电信“谛听”客服智能体，大小模型协同提升一解率",
       "湖北电信与中电信人工智能科技启动“谛听”客服智能体创新项目，在万号客服接听人工来话的长尾问题场景中，采用大小模型协同、多智能体混编技术，提升意图命中及关键实体精准率，提升客户诉求一解率并压降系统内操作时长，提高满意率、缓解坐席压力。",
       "万号客服长尾问题领域广、答案多样，传统NLU意图识别能力有限，坐席压力大。",
       "长尾问题处理效率低、意图识别不准，客户诉求一解率低，操作耗时长。",
       "采用大小模型协同+多智能体混编技术，改进意图识别流程，提升长尾问题处理效率与一解率，压降操作时长。",
       ["启动“谛听”客服智能体项目", "大小模型协同+多智能体混编", "长尾问题场景试点", "提升一解率与满意率"],
       [{"label": "意图与实体精准率", "value": "显著提升意图命中及关键实体精准率", "kind": "actual"},
        {"label": "一解率", "value": "提升客户诉求一解率", "kind": "actual"},
        {"label": "操作时长", "value": "有效压降系统内操作时长", "kind": "actual"}],
       "满意率提升、坐席压力缓解，量化ROI未披露",
       "多智能体协同需保障响应及时性。",
       "通信运营商万号/呼叫中心",
       "大小模型协同、多智能体框架", "建议优先",
       "中电信人工智能科技有限公司", "谛听客服智能体，大小模型协同提升一解率",
       ["通信", "智能客服", "Agent", "大小模型协同"], ["大小模型协同", "多智能体"], client="湖北电信"),

    mk(3, "黑龙江省人民政府（数字政府）", "soe", "government", ["customer-service", "knowledge-base"], ["经营管理"],
       "黑龙江数字政府项目，政务大模型让复杂问题准确率提升45%",
       "黑龙江数字政府项目提供“更便捷、更贴心、更智能”的一站式智能客服新体验，基于中国移动九天·海算政务大模型，一网通办智能客服咨询复杂问题准确率提升45%、答案有效性提升17%、拟人化程度提升24%，让数据多跑路、民众少跑腿。",
       "政务服务事项高频且复杂，市民办事体验有待提升，传统客服难以应对复杂咨询。",
       "政务复杂问题准确率低、答案有效性不足、交互不够拟人，市民办事便捷性差。",
       "创新性使用“政务大模型-信息场-应用”政务服务体系，基于九天·海算政务大模型保障可信与安全，提升一网通办智能客服咨询能力。",
       ["构建政务大模型-信息场-应用体系", "部署九天·海算政务大模型", "一网通办智能客服咨询落地", "保障政务信息安全性"],
       [{"label": "复杂问题准确率", "value": "提升45%", "improvement": "+45%", "kind": "actual"},
        {"label": "答案有效性", "value": "提升17%", "improvement": "+17%", "kind": "actual"},
        {"label": "拟人化程度", "value": "提升24%", "improvement": "+24%", "kind": "actual"}],
       "市民办事效率与满意度显著提升",
       "政务信息需严格安全保障与可信性。",
       "数字政府、一网通办等政务服务机构",
       "政务大模型、可信信息场、安全保障", "建议优先",
       "中国移动通信集团有限公司", "复杂问题准确率提升45%，答案有效性提升17%",
       ["政务与公共服务", "数字政府", "智能客服", "政务大模型"], ["九天·海算政务大模型"], client="黑龙江省政府"),

    mk(4, "中国电信股份有限公司河南分公司", "soe", "telecom", ["customer-service", "workflow"], ["客服"],
       "河南电信智能客服助理，实时辅助降低投诉率",
       "河南电信为满足省内10000号客服坐席服务支撑，引入智能客服助理，大模型识别客服与用户对话内容，为客服提供一系列智能辅助功能，快速解决用户问题，显著提升服务效率和质量，并通过实时沟通监控降低客户投诉率、增强品牌。",
       "10000号客服坐席服务支撑压力大，服务延误易导致客户流失与投诉。",
       "客服与用户对话实时辅助不足，服务延误导致客户流失、人力成本高。",
       "引入智能客服助理，大模型识别对话内容提供智能辅助，配合实时沟通监控与情绪监控，优化体验、降低投诉。",
       ["引入智能客服助理", "大模型实时识别用户意图", "配合情绪监控工具", "实时沟通监控降低投诉率"],
       [{"label": "服务效率质量", "value": "显著提升客户服务效率和质量", "kind": "actual"},
        {"label": "客户投诉率", "value": "通过实时监控降低客户投诉率", "kind": "actual"},
        {"label": "人力成本", "value": "减少人力成本，提高员工保留率", "kind": "actual"}],
       "降低流失与人力成本，量化ROI未披露",
       "需平衡实时监控与隐私。",
       "通信运营商客服坐席",
       "大模型对话识别、情绪监控", "建议优先",
       "科大国创", "智能客服助理降低投诉率减少人力成本",
       ["通信", "智能客服", "坐席辅助", "情绪监控"], ["大模型", "情绪监控"], client="河南电信"),

    mk(5, "联想（北京）信息技术有限公司", "private", "software-internet", ["agent", "knowledge-base"], ["经营管理", "客服"],
       "联想智能问答机器人“助小咖”，覆盖二十余渠道的企业级助手",
       "联想“助小咖”具备强大NLP能力，理解并准确回答用户问题，处理知识问答、技术支持、日程管理等多类请求，支持中英文多语言文本及语音交互，已在联想内部IT、HR、财务、行政、差旅、工厂物料、云平台、销售支持等二十多种渠道为内外部员工提供支持。",
       "企业内部IT、HR、财务等多渠道员工支持需求分散，传统问答效率低。",
       "多领域知识问答与文档查找依赖人力，员工效率低、体验差。",
       "基于生成式+分析式模型提供企业级交互机器人，支持知识问答、政策查询、多模态接入、自动化任务执行、多机器人管理，并可理解本地PDF/Word/PPT/Excel文档。",
       ["部署助小咖企业级交互机器人", "打通IT/HR/财务等二十余渠道", "多模态接入与文档理解", "支持场景助手提示工程调整"],
       [{"label": "渠道覆盖", "value": "20+渠道为内外部员工提供支持", "kind": "actual"},
        {"label": "员工效率", "value": "显著提升员工工作效率与体验", "kind": "actual"},
        {"label": "文档问答", "value": "快速从本地文档找到信息", "kind": "actual"}],
       "员工效率与体验提升，量化ROI未披露",
       "需保障企业内部数据安全与权限。",
       "大型企业多部门员工自助服务",
       "生成式+分析式模型、多模态接入", "建议优先",
       "联想", "助小咖，20+渠道企业级智能助手",
       ["软件与互联网", "企业助手", "Agent", "知识问答"], ["生成式大模型", "分析式模型"], client="联想"),

    mk(6, "深圳市福田区政务服务数据管理局", "soe", "government", ["customer-service", "knowledge-base"], ["经营管理"],
       "福田政务智慧助手“小福”，盘古政务大模型实现智能秒批",
       "福田区政务服务数据管理局基于盘古政务大模型上线福田政务智慧助手“小福”，改变传统“一网通办”模式，针对高频复杂事项提供实时问答互动、智能秒批、政策推送等智慧政务服务，AI精准抓取对话字段、理解居民意图，把口语转化为政府办事语言。",
       "传统一网通办模式手续繁琐、等待时间长，高频复杂事项办理体验差。",
       "居民口语化咨询难以被传统系统理解，办事效率低、体验差。",
       "基于盘古政务大模型上线“小福”，提供实时问答、智能秒批、政策推送，AI精准理解居民意图并转化为办事语言。",
       ["基于盘古政务大模型上线小福", "高频复杂事项实时问答", "智能秒批与政策推送", "口语化咨询意图理解"],
       [{"label": "办理效率", "value": "提高政务办理效率，减少手续等待", "kind": "actual"},
        {"label": "服务体验", "value": "提升居民服务体验与满意度", "kind": "actual"},
        {"label": "模式升级", "value": "改变传统一网通办模式", "kind": "actual"}],
       "政务办理效率与满意度提升，量化ROI未披露",
       "政务数据需安全保障。",
       "各级政务服务大厅与一网通办平台",
       "盘古政务大模型、意图理解", "建议优先",
       "华为云计算技术有限公司", "小福，智能秒批+政策推送",
       ["政务与公共服务", "智能政务", "盘古大模型", "秒批"], ["盘古政务大模型"], client="深圳市福田区"),

    mk(7, "维音（Vision）”", "private", "software-internet", ["agent"], ["客服"],
       "维音AIGC+客服数智化培训，智能陪练替代1V1带教",
       "维音基于大模型服务平台VisionGAL升级AI客服培训系统VisionTSIM，支持大模型智能生成陪练素材、上传多格式文件自动提取并生成陪练课程、基于行业模板库快捷搭建，已在维音全国运营中心规模化应用，无需人工1V1带教，提升新人/大促/新品培训实战效果。",
       "呼叫中心客服培训依赖人工1V1带教，受时空限制，成本高、难规模化。",
       "传统培训场景时空受限，金牌教练资源稀缺，新人/大促/新品培训效果难保障。",
       "基于VisionGAL大模型服务平台升级VisionTSIM，以NLP/情绪识别/大模型模拟服务情境，智能生成陪练素材与课程，基于20余行业话术语料精调。",
       ["部署VisionGAL大模型服务平台", "升级VisionTSIM智能陪练", "多格式文件自动生成课程", "全国运营中心规模化应用"],
       [{"label": "培训模式", "value": "无需人工1V1带教，规模化应用", "kind": "actual"},
        {"label": "培训效果", "value": "提升新人/大促/新品培训实战效果", "kind": "actual"},
        {"label": "覆盖行业", "value": "金融/零售/科技/奢侈品/汽车等20余行业", "kind": "actual"}],
       "培训成本下降、效果提升，量化ROI未披露",
       "需基于真实话术语料精调保证贴合场景。",
       "呼叫中心、客服外包与培训团队",
       "大模型陪练平台、行业话术语料", "建议优先",
       "维音", "AIGC智能陪练，无需1V1带教",
       ["软件与互联网", "智能培训", "Agent", "智能陪练"], ["维音大模型VisionGAL", "智能陪练"], client="维音全国运营中心"),

    mk(8, "新东方教育科技集团有限公司", "private", "education", ["customer-service", "knowledge-base"], ["客服"],
       "新东方AIGC智能客服，双库模式提升直接回答率",
       "新东方客服每天收到大量上课场景咨询（售前支付、课程内容、售后退费续费）。为释放人工压力、提升直接回答率，新东方与智齿科技合作，借助“AIGC+智能客服”融合能力，提升上课咨询场景直接回答率与学员满意度。",
       "教培机构客服咨询量大、场景集中，人工压力大、直接回答率待提升。",
       "大量上课场景咨询依赖人工，直接回答率低、学员满意度受影响。",
       "采用“双库模式”：用户咨询优先启用智齿知识库，无法作答时启动AIGC资料库保证准确度；上传原始材料自动提炼FAQ并扩展相似问，降低知识库冷启动与运维成本。",
       ["与智齿科技共建AIGC+智能客服", "双库模式（知识库+AIGC资料库）", "原始材料自动提炼FAQ扩展相似问", "上课咨询场景落地"],
       [{"label": "直接回答率", "value": "提升上课咨询场景直接回答率", "kind": "actual"},
        {"label": "学员满意度", "value": "提升学员满意度", "kind": "actual"},
        {"label": "知识库运维", "value": "降低冷启动与运维调优工作量", "kind": "actual"}],
       "释放人工压力、提升满意度，量化ROI未披露",
       "需双库模式保障答案准确度。",
       "教育教培、咨询量大的客服团队",
       "AIGC引擎、知识库、FAQ自动提炼", "建议优先",
       "智齿科技", "双库模式提升直接回答率",
       ["教育", "智能客服", "AIGC", "双库模式"], ["AIGC", "智齿知识库"], client="新东方"),

    mk(9, "中国电力工程顾问集团西南电力设计院", "soe", "energy-mining", ["knowledge-base", "workflow"], ["经营管理"],
       "西南电力设计院智能知识管理，360亿方云大模型打造AI文件助手",
       "360亿方云助力西南电力设计院实现知识管理与知识问答智能化转型，针对管理制度、知识问答及办公流程痛点，采用大模型技术实现企业知识智能化管理和高效利用，构建管理制度问答数字员工与专业知识问答系统，打造AI文件助手、AI云文档、AI知识问答等上层应用。",
       "电力设计院管理制度与专业知识分散，知识获取成本高、办公流程低效。",
       "非结构化数据价值难发挥，知识问答与办公流程缺乏智能化手段。",
       "采用大模型技术构建管理制度问答数字员工与专业知识问答系统，发挥非结构化数据价值，打造AI文件助手/云文档/知识问答/知识搜索等应用。",
       ["引入360亿方云大模型方案", "构建管理制度问答数字员工", "打造AI文件助手/知识问答等应用", "内部知识管理智能化落地"],
       [{"label": "管理效率", "value": "显著提升内部管理效率", "kind": "actual"},
        {"label": "知识获取成本", "value": "降低知识获取成本", "kind": "actual"},
        {"label": "员工素养", "value": "提升员工专业素养", "kind": "actual"}],
       "管理效率与服务质量提升，量化ROI未披露",
       "电力设计专业知识需领域适配。",
       "设计院、研究院等知识密集型机构",
       "大模型、企业知识库、非结构化数据治理", "建议优先",
       "360亿方云", "电力设计院知识管理智能化",
       ["能源与矿山", "知识管理", "AI文件助手", "知识问答"], ["大模型", "AI文件助手"], client="西南电力设计院"),

    mk(10, "之江实验室", "soe", "government", ["knowledge-base", "agent"], ["经营管理"],
       "之江实验室“小之知道”多路召回智能问答助手，自动生成问答对",
       "之江实验室基于AI大模型开发多路召回智能问答助手“小之知道”，满足知识问答和任务型问答混合场景，支持多模态问答输出，实现从文档自动生成问答对及相似问题能力，提升问答知识库维护效率，已用于办公/招聘/入职场景，并为“之江精灵”智能音箱、统一搜索赋能。",
       "实验室内部多场景（办公、招聘、入职）问答需求融合，现有召回精度低。",
       "多场景融合问答召回精度低，问答对录入效率低。",
       "提出多路召回多场景智能问答方法与系统，满足多路模型并发；大模型批量从文档自动提取问答对并生成相似问题，提高录入效率与召回率。",
       ["开发多路召回智能问答助手小之知道", "支持知识+任务型混合问答", "文档自动生成问答对与相似问题", "赋能智能音箱与统一搜索"],
       [{"label": "知识库维护", "value": "提升问答知识库维护效率", "kind": "actual"},
        {"label": "问答对录入", "value": "批量自动提取问答对提高效率", "kind": "actual"},
        {"label": "召回率", "value": "相似问题生成提高召回率", "kind": "actual"}],
       "问答效率与召回率提升，量化ROI未披露",
       "多路模型并发需保障运行效率。",
       "科研机构、企业内部多场景知识问答",
       "AI大模型、多路召回机制", "建议优先",
       "之江实验室", "小之知道，多路召回智能问答",
       ["政务与公共服务", "智能问答", "多路召回", "知识库"], ["AI大模型", "多路召回"], client="之江实验室"),
]

out_path = "scripts/extracted/kefu-2024-cases.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)
print(f"Generated {len(cases)} cases -> {out_path}")

with open(out_path, "r", encoding="utf-8") as f:
    data = json.load(f)
bad = 0
for c in data:
    if not isinstance(c["industry"], dict) or "slug" not in c["industry"]:
        bad += 1; print("BAD industry", c["slug"])
    for s in c["scenarios"]:
        if not isinstance(s, dict) or "slug" not in s:
            bad += 1; print("BAD scenario", c["slug"])
    for req in ["outcomeStatus", "confidence", "editorComment", "sources"]:
        if req not in c:
            bad += 1; print("MISSING", req, c["slug"])
print("Validation issues:", bad)
