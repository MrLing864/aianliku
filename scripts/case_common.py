# -*- coding: utf-8 -*-
"""案例生成公共模块：完整 catalog 对象 + build() 校验器。

供各 gen_xxx_cases.py 复用，避免每个脚本重复定义 15 个行业 × 14 个场景对象。
对象 shape 与 gen_research_cases.py / catalog.ts 保持一致（已跑通入库）。
"""
import datetime
import re

INDUSTRIES = {
    "manufacturing": {"id": "manufacturing", "code": "C", "name": "制造业", "displayName": "制造业",
                      "slug": "manufacturing", "description": "生产、质检、设备维护、供应链与经营管理中的 AI 实践。",
                      "icon": "factory", "featured": True, "standardVersion": "v2026.07"},
    "retail": {"id": "retail", "code": "F52", "name": "零售业", "displayName": "零售与消费",
               "slug": "retail", "description": "选品、库存、门店运营、客服与会员营销案例。",
               "icon": "shopping-bag", "featured": True, "standardVersion": "v2026.07"},
    "foreign-trade": {"id": "foreign-trade", "code": "F51", "name": "批发业", "displayName": "外贸与批发",
                      "slug": "foreign-trade", "description": "询盘、报价、单证、翻译和跨境客户服务案例。",
                      "icon": "globe-2", "featured": True, "standardVersion": "v2026.07"},
    "logistics": {"id": "logistics", "code": "G", "name": "交通运输、仓储和邮政业", "displayName": "物流与仓储",
                  "slug": "logistics", "description": "订单、仓储、路径、调度和运力管理案例。",
                  "icon": "truck", "featured": True, "standardVersion": "v2026.07"},
    "finance": {"id": "finance", "code": "J", "name": "金融业", "displayName": "金融",
                "slug": "finance", "description": "风控、合规、运营与知识服务案例。",
                "icon": "landmark", "featured": True, "standardVersion": "v2026.07"},
    "healthcare": {"id": "healthcare", "code": "Q84", "name": "卫生", "displayName": "医疗健康",
                   "slug": "healthcare", "description": "病历、随访、辅助诊疗和医院运营案例。",
                   "icon": "heart-pulse", "featured": True, "standardVersion": "v2026.07"},
    "education": {"id": "education", "code": "P", "name": "教育", "displayName": "教育",
                  "slug": "education", "description": "教学内容、教务、知识问答和学习支持案例。",
                  "icon": "graduation-cap", "featured": True, "standardVersion": "v2026.07"},
    "software-internet": {"id": "software-internet", "code": "I65", "name": "软件和信息技术服务业", "displayName": "软件与互联网",
                          "slug": "software-internet", "description": "研发、运维、客服、销售与内容生产案例。",
                          "icon": "code", "featured": True, "standardVersion": "v2026.07"},
    "energy-mining": {"id": "energy-mining", "code": "B", "name": "采矿业", "displayName": "能源与矿山",
                      "slug": "energy-mining", "description": "煤矿、油气、电力与矿山的智能化、安全管控与生产经营 AI 实践。",
                      "icon": "fuel", "featured": True, "standardVersion": "v2026.07"},
    "automotive": {"id": "automotive", "code": "C36", "name": "汽车制造业", "displayName": "汽车",
                   "slug": "automotive", "description": "整车与零部件研发、制造、营销、客服与智能座舱案例。",
                   "icon": "car", "featured": True, "standardVersion": "v2026.07"},
    "telecom": {"id": "telecom", "code": "I63", "name": "电信、广播电视和卫星传输服务", "displayName": "通信",
                "slug": "telecom", "description": "网络运维、客服、营销与算力调度的 AI 实践。",
                "icon": "radio-tower", "featured": False, "standardVersion": "v2026.07"},
    "government": {"id": "government", "code": "S", "name": "公共管理、社会保障和社会组织", "displayName": "政务与公共服务",
                   "slug": "government", "description": "政务热线、政策问答、城市治理与公共服务的 AI 应用。",
                   "icon": "building-2", "featured": False, "standardVersion": "v2026.07"},
    "aerospace": {"id": "aerospace", "code": "C37", "name": "航空航天", "displayName": "航空航天",
                  "slug": "aerospace", "description": "卫星、航天器、航电与空天信息服务的 AI 实践。",
                  "icon": "rocket", "featured": False, "standardVersion": "v2026.07"},
    "construction": {"id": "construction", "code": "E", "name": "建筑业", "displayName": "建筑建材",
                     "slug": "construction", "description": "设计、施工、建材与工程管理的 AI 实践。",
                     "icon": "building-2", "featured": False, "standardVersion": "v2026.07"},
    "agriculture": {"id": "agriculture", "code": "A", "name": "农业", "displayName": "农业",
                    "slug": "agriculture", "description": "种植、养殖、农机与农业服务的 AI 实践。",
                    "icon": "sprout", "featured": False, "standardVersion": "v2026.07"},
    "other": {"id": "other", "code": "Z99", "name": "其他", "displayName": "其他行业",
              "slug": "other", "description": "难以归入上述行业的综合 AI 应用案例。",
              "icon": "layers", "featured": False, "standardVersion": "v2026.07"},
}
SCENARIOS = {
    "ocr": {"id": "ocr", "name": "OCR / 文档识别", "slug": "ocr",
            "description": "从票据、合同、单据和图片提取结构化信息。", "synonyms": ["文字识别", "文档识别", "录单"],
            "icon": "scan-text", "featured": True},
    "customer-service": {"id": "customer-service", "name": "智能客服", "slug": "customer-service",
                         "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服", "客服机器人", "在线客服"],
                         "icon": "messages-square", "featured": True},
    "knowledge-base": {"id": "knowledge-base", "name": "企业知识库", "slug": "knowledge-base",
                       "description": "让制度、产品和业务资料可检索、可问答。", "synonyms": ["知识问答", "RAG", "内部知识库"],
                       "icon": "library-big", "featured": True},
    "sales": {"id": "sales", "name": "销售辅助", "slug": "sales",
              "description": "线索分析、销售跟进、沟通总结和方案生成。", "synonyms": ["销售助手", "商机分析", "销售Agent"],
              "icon": "trending-up", "featured": True},
    "quotation": {"id": "quotation", "name": "智能报价", "slug": "quotation",
                  "description": "根据产品、物料和规则辅助快速、准确报价。", "synonyms": ["报价Agent", "自动报价", "报价"],
                  "icon": "receipt-text", "featured": True},
    "workflow": {"id": "workflow", "name": "流程自动化", "slug": "workflow",
                 "description": "连接业务系统，减少重复录入和人工流转。", "synonyms": ["Workflow", "RPA", "自动化流程"],
                 "icon": "workflow", "featured": True},
    "quality-inspection": {"id": "quality-inspection", "name": "智能质检", "slug": "quality-inspection",
                           "description": "视觉、语音或文本质量检查和异常识别。", "synonyms": ["视觉质检", "AI质检"],
                           "icon": "scan-search", "featured": True},
    "forecast": {"id": "forecast", "name": "预测与分析", "slug": "forecast",
                 "description": "需求、销量、库存、设备和经营指标预测。", "synonyms": ["需求预测", "数据分析", "预测性维护"],
                 "icon": "chart-no-axes-combined", "featured": False},
    "content-generation": {"id": "content-generation", "name": "内容生成", "slug": "content-generation",
                           "description": "营销、商品、培训和多语言内容生产。", "synonyms": ["AIGC", "营销文案", "内容创作"],
                           "icon": "sparkles", "featured": False},
    "agent": {"id": "agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
              "icon": "bot", "featured": True},
    "production-scheduling": {"id": "production-scheduling", "name": "智能排产与工艺优化", "slug": "production-scheduling",
                              "description": "生产计划、排程与工艺参数优化。", "synonyms": ["排产", "工艺优化", "生产调度"],
                              "icon": "gauge", "featured": False},
    "ops-inspection": {"id": "ops-inspection", "name": "智能运维与巡检", "slug": "ops-inspection",
                       "description": "设备运维、远程巡检与异常预警。", "synonyms": ["运维", "巡检", "预测性维护"],
                       "icon": "wrench", "featured": False},
    "rnd-design": {"id": "rnd-design", "name": "研发设计与仿真", "slug": "rnd-design",
                   "description": "研发设计、仿真与实验辅助。", "synonyms": ["研发", "仿真", "设计辅助"],
                   "icon": "flask-conical", "featured": False},
    "ai-infra": {"id": "ai-infra", "name": "算力基础设施与AI平台", "slug": "ai-infra",
                 "description": "算力调度、AI 平台与基础设施。", "synonyms": ["算力", "AI平台", "基础设施"],
                 "icon": "cpu", "featured": False},
}
BUSINESS_FUNCTIONS = {"战略与运营", "财务与融资", "市场与销售", "客户成功", "供应链/物流",
                      "研发与设计", "生产制造", "人力资源", "法务与合规", "信息技术"}
VALID_OUTCOME = {"success", "partial", "failure", "undisclosed"}
VALID_CONF = {"high", "medium", "pending"}


def slugify(title):
    s = re.sub(r"[^\w\u4e00-\u9fff]+", "-", title).strip("-").lower()
    return s[:80]


def dedup_vector(text):
    vec = [0.0] * 40
    for ch in text:
        vec[ord(ch) % 40] += 1.0
    norm = sum(v * v for v in vec) ** 0.5 or 1.0
    return [round(v / norm, 4) for v in vec]


def build(case):
    ind = INDUSTRIES[case["industry"]]
    scns = [SCENARIOS[s] for s in case["scenarios"]]
    assert case["industry"] in INDUSTRIES, f"unknown industry {case['industry']}"
    for s in case["scenarios"]:
        assert s in SCENARIOS, f"unknown scenario {s}"
    for b in case["businessFunctions"]:
        assert b in BUSINESS_FUNCTIONS, f"unknown businessFunction {b}"
    assert case["outcomeStatus"] in VALID_OUTCOME
    assert case["confidence"] in VALID_CONF

    full = case["title"]
    slug = case.get("slug") or slugify(full)
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {
        "id": case.get("id") or f"case-{slug}",
        "version": 1,
        "slug": slug,
        "title": full,
        "organization": case["organization"],
        "industry": ind,
        "scenarios": scns,
        "businessFunctions": case["businessFunctions"],
        "summary": case["summary"],
        "background": case["background"],
        "problem": case["problem"],
        "solution": case["solution"],
        "implementationSteps": case["implementationSteps"],
        "duration": case["duration"],
        "cost": case["cost"],
        "results": case["results"],
        "roi": case["roi"],
        "risks": case["risks"],
        "editorComment": case["editorComment"],
        "implementers": case["implementers"],
        "outcomeStatus": case["outcomeStatus"],
        "contentStatus": "published",
        "confidence": case["confidence"],
        "sources": case["sources"],
        "featured": case["featured"],
        "views": 0,
        "dedupVector": dedup_vector(full),
        "publishedAt": case["publishedAt"],
        "updatedAt": now,
        "implementationYear": case.get("implementationYear"),
        "implementationTimePrecision": case.get("implementationTimePrecision", "month"),
        "techPath": case.get("techPath", []),
        "modelStack": case.get("modelStack", []),
        "sourceReport": case.get("sourceReport"),
        "tags": case.get("tags", []),
        "seo": case.get("seo", {}),
    }
