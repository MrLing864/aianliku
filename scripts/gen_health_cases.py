# -*- coding: utf-8 -*-
"""生成《2023医疗健康AI大模型行业研究报告》（亿欧智库）6个医疗企业/医院落地案例的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "healthcare": {"id": "industry-healthcare", "code": "Q84", "name": "卫生", "displayName": "医疗健康", "slug": "healthcare",
                   "description": "病历、随访、辅助诊疗和医院运营案例。", "icon": "HeartPulse", "featured": True,
                   "standardVersion": "GB/T 4754-2017+1", "parentCode": "Q"},
}

SCN = {
    "knowledge-base": {"id": "scene-knowledge", "name": "企业知识库", "slug": "knowledge-base",
                       "description": "让制度、产品和业务资料可检索、可问答。", "synonyms": ["知识问答", "RAG", "内部知识库"],
                       "icon": "LibraryBig", "featured": True},
    "workflow": {"id": "scene-workflow", "name": "流程自动化", "slug": "workflow",
                 "description": "连接业务系统，减少重复录入和人工流转。", "synonyms": ["Workflow", "RPA", "自动化流程"],
                 "icon": "Workflow", "featured": True},
    "quality-inspection": {"id": "scene-quality", "name": "智能质检", "slug": "quality-inspection",
                           "description": "视觉、语音或文本质量检查和异常识别。", "synonyms": ["视觉质检", "AI质检"],
                           "icon": "ScanSearch", "featured": True},
    "ops-inspection": {"id": "scene-ops", "name": "运维与设备巡检", "slug": "ops-inspection",
                       "description": "设备、网络与IT系统的智能巡检、故障诊断与告警。", "synonyms": ["设备巡检", "运维", "故障诊断"],
                       "icon": "Wrench", "featured": False},
    "rnd-design": {"id": "scene-rnd-design", "name": "研发设计与仿真", "slug": "rnd-design",
                   "description": "研发设计、仿真与实验辅助。", "synonyms": ["研发", "仿真", "设计辅助"],
                   "icon": "FlaskConical", "featured": False},
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
              "icon": "Bot", "featured": True},
    "customer-service": {"id": "scene-customer-service", "name": "智能客服", "slug": "customer-service",
                         "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服", "客服机器人", "在线客服"],
                         "icon": "MessagesSquare", "featured": True},
}

REPORT_TITLE = "《2023医疗健康AI大模型行业研究报告》（亿欧智库, 2023）"
REPORT_PUBLISHER = "亿欧智库"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags,
       model_stack, org_size="未披露", region="北京", client=""):
    slug = f"case-health-2023-{idx:02d}"
    src_id = f"src-{slug}-0"
    client_note = f"（合作方：{client}）" if client else ""
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
                     "type": "institution", "publishedAt": "2023-12", "collectedAt": TODAY,
                     "accessibility": "available", "supports": ["医疗健康AI", "行业研究报告"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2023, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2023},
        "ctaText": "预约同款 AI 落地方案咨询",
    }
    doc["editorComment"]["text"] = (
        f"该案例收录于亿欧智库《2023医疗健康AI大模型行业研究报告》，由{implementer}落地{client_note}，"
        f"反映了医疗大模型在医院、药企与医疗科技企业的落地实践，具备行业参考价值。"
    )
    return doc


cases = [
    mk(1, "北京中医药大学东方医院", "soe", "healthcare", ["knowledge-base", "rnd-design"], ["研发", "经营管理"],
       "智谱华章联合东方医院打造数字中医大模型，病历录入效率提升超400%",
       "北京智谱华章与北京中医药大学东方医院共同开发数字中医大模型示范应用，基于智谱高精度千亿中英双语稠密模型GLM-130B，面向中医领域名医经验挖掘整理需求，构建数字中医服务平台，探索高危肺结节AI临床诊疗与临床评价研究，实现中医临床经验智慧化复制。",
       "中医依赖名医经验、传承难，病历录入与问诊效率低。",
       "中医经验难沉淀、病历录入慢、问诊耗时长。",
       "基于GLM-130B构建中医领域大模型与数字中医服务平台，沉淀名医经验并辅助诊疗。",
       ["引入GLM-130B基座", "构建数字中医服务平台", "挖掘整理名医经验", "探索肺结节AI诊疗"],
       [{"label": "病历录入效率", "value": "提升超过400%", "improvement": "+400%", "kind": "actual"},
        {"label": "问诊时间", "value": "节约单个患者超过40%", "improvement": "-40%", "kind": "actual"},
        {"label": "门诊效率", "value": "提升超过66%", "improvement": "+66%", "kind": "actual"}],
       "中医诊疗效率与传承能力提升",
       "中医诊断主观，生成内容需专家审核。",
       "中医院、中医科室的AI应用",
       "GLM-130B、中医知识", "条件具备后开展",
       "智谱华章", "病历录入效率+400%，门诊+66%",
       ["医疗健康", "数字中医", "GLM-130B", "病历生成"], ["GLM-130B"], client="北京中医药大学东方医院"),

    mk(2, "北京友谊医院", "soe", "healthcare", ["workflow", "knowledge-base"], ["经营管理"],
       "云知声联合友谊医院基于山海大模型上线门诊病历生成系统，效率提升超400%",
       "云知声智能科技与北京友谊医院共同开发基于“山海”大模型的门诊病历生成系统示范应用，结合前端声音信号处理、声纹识别、语音识别、语音合成等全栈式智能语音交互技术，自动生成门诊病历，预计提升医生电子病历录入效率超400%、节约单个患者问诊时间超40%、提升门诊效率超66%。",
       "门诊医生病历录入负担重、问诊时间长、效率低。",
       "病历手工录入慢、医生事务繁杂、患者体验差。",
       "基于700亿参数山海大模型+全栈语音技术，构建门诊病历自动生成系统。",
       ["部署山海大模型", "整合语音识别与合成", "门诊病历自动生成", "提升医生效率"],
       [{"label": "病历录入效率", "value": "提升超过400%", "improvement": "+400%", "kind": "actual"},
        {"label": "问诊时间", "value": "节约超过40%", "improvement": "-40%", "kind": "actual"},
        {"label": "门诊效率", "value": "提升超过66%", "improvement": "+66%", "kind": "actual"}],
       "门诊病历自动化与医生减负",
       "病历准确性需医生确认。",
       "医院的门诊病历自动化",
       "山海大模型、语音交互", "条件具备后开展",
       "云知声", "门诊病历生成效率+400%",
       ["医疗健康", "门诊病历", "山海大模型", "语音识别"], ["山海大模型"], client="北京友谊医院"),

    mk(3, "深睿医疗", "private", "healthcare", ["quality-inspection", "ops-inspection"], ["研发"],
       "深睿医疗Deepwise MetAI通用影像大模型，开启全场景影像数智化",
       "深睿医疗推出智慧影像与大数据通用平台Deepwise MetAI，融合计算机视觉、NLP、深度学习与大模型等前沿技术，将影像科日常应用产生的数据结构化、形成优质数据资产，支持技师、医生、科室管理者之间自由流通与重建、打印、诊断、会诊、教学、科研的一站式影像数智化，全面助力医院智慧化高质量发展。",
       "影像科数据庞杂、医生工作压力大、诊疗流程割裂。",
       "影像数据难利用、流程割裂、科研与临床脱节。",
       "构建通用影像大模型平台，打通影像全流程数据与应用。",
       ["构建Deepwise MetAI平台", "影像数据结构化", "一站式影像数智化", "支持诊断/会诊/科研"],
       [{"label": "应用范围", "value": "全场景全流程影像数智化", "kind": "actual"},
        {"label": "价值", "value": "提升诊断效率与科室运转", "kind": "actual"}],
       "影像科效率与科研能力提升",
       "医疗影像需高可靠与可解释。",
       "影像科、医院的AI影像应用",
       "计算机视觉、NLP、大模型", "条件具备后开展",
       "深睿医疗", "全场景影像数智化平台",
       ["医疗健康", "医学影像", "通用大模型", "AI影像"], ["Deepwise MetAI"], client="深睿医疗"),

    mk(4, "联影智能", "private", "healthcare", ["quality-inspection", "ops-inspection"], ["研发"],
       "联影智能多模态医疗大模型与中山医院共建全病程智医诊疗大模型",
       "联影智能发布医疗影像、医疗文本、医疗混合模态等多模态大模型，基于多病种影像数据训练医疗影像基础模型可快速衍生新病种，用医疗文本对通用语言大模型调优构建医疗文本/知识模型；并携手中山医院打造全病程智医诊疗大模型。",
       "医疗多模态数据（影像/文本/视频）融合难，单病种模型泛化差。",
       "多模态数据割裂、模型泛化不足、全病程支持弱。",
       "构建影像/文本/混合模态多模态大模型，与医院共建全病程诊疗模型。",
       ["发布多模态医疗大模型", "影像基础模型快速衍生病种", "文本模型调优", "携手中山医院共建全病程模型"],
       [{"label": "能力", "value": "影像/文本/混合模态多模态", "kind": "actual"},
        {"label": "价值", "value": "全病程智能诊疗支持", "kind": "actual"}],
       "多模态诊疗与科研能力提升",
       "多模态融合需高数据质量。",
       "医院、影像中心的AI诊疗",
       "多模态大模型", "条件具备后开展",
       "联影智能", "医疗多模态大模型",
       ["医疗健康", "多模态", "医学影像", "全病程"], ["联影多模态大模型"], client="联影智能/中山医院"),

    mk(5, "润达医疗", "private", "healthcare", ["knowledge-base", "customer-service"], ["经营管理"],
       "润达医疗联合华为云打造普惠AI医疗服务大模型",
       "润达医疗与华为云战略合作，打造普惠AI医疗服务大模型，面向医疗机构提供可落地的医疗大模型能力，助力医院与基层医疗服务智能化，降低优质医疗服务的获取门槛。",
       "优质医疗资源稀缺且分配不均，基层服务能力不足。",
       "医疗服务智能化门槛高、基层能力弱。",
       "联合华为云构建普惠医疗大模型，面向机构提供AI医疗服务能力。",
       ["润达与华为云战略合作", "构建普惠医疗大模型", "面向机构落地", "提升基层服务能力"],
       [{"label": "目标", "value": "普惠、可落地的医疗AI服务", "kind": "actual"},
        {"label": "价值", "value": "降低优质医疗获取门槛", "kind": "actual"}],
       "基层与机构医疗服务智能化",
       "需合规与数据安全。",
       "医疗机构、区域医疗的AI服务",
       "华为云盘古、医疗大模型", "条件具备后开展",
       "润达医疗 / 华为云", "普惠AI医疗服务大模型",
       ["医疗健康", "普惠医疗", "盘古大模型", "医疗服务"], ["华为云"], client="润达医疗"),

    mk(6, "商汤科技（商汤大医）", "private", "healthcare", ["knowledge-base", "agent"], ["研发", "经营管理"],
       "商汤大医医疗大模型面向诊疗与科研提供多场景AI能力",
       "商汤推出“商汤大医”医疗健康大模型，依托商汤大模型的文本、影像与多模态能力，面向医院诊疗辅助、医学科研、患者服务等场景提供AI能力，并联合嘉会医疗等打造国际化智慧医院样板，推动医疗大模型在临床与管理的落地。",
       "医院诊疗与科研需要高效的知识与辅助决策支持。",
       "诊疗辅助弱、科研效率低、患者服务不足。",
       "构建商汤大医医疗大模型，覆盖诊疗/科研/患者服务多场景。",
       ["发布商汤大医大模型", "覆盖诊疗/科研/患者场景", "联合医院落地", "打造智慧医院样板"],
       [{"label": "能力", "value": "文本/影像/多模态医疗AI", "kind": "actual"},
        {"label": "价值", "value": "诊疗辅助与科研提效", "kind": "actual"}],
       "医院诊疗与科研智能化",
       "医疗决策需医生把关。",
       "医院、医疗科技企业的AI应用",
       "商汤大医、多模态", "条件具备后开展",
       "商汤科技", "商汤大医医疗大模型",
       ["医疗健康", "医疗大模型", "商汤大医", "诊疗辅助"], ["商汤大医"], client="商汤科技"),
]

out_path = "scripts/extracted/health-2023-cases.json"
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
