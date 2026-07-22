# -*- coding: utf-8 -*-
"""生成《矿山智能化暨矿山大模型最佳实践白皮书》（山东能源×华为, 2023）3个案例的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "energy-mining": {"id": "industry-energy-mining", "code": "B", "name": "采矿业", "displayName": "能源与矿山", "slug": "energy-mining",
                      "description": "煤矿、油气、电力与矿山的智能化、安全管控与生产经营 AI 实践。", "icon": "Fuel",
                      "featured": True, "standardVersion": "GB/T 4754-2017+1"},
}

SCN = {
    "knowledge-base": {"id": "scene-knowledge", "name": "企业知识库", "slug": "knowledge-base",
                       "description": "让制度、产品和业务资料可检索、可问答。", "synonyms": ["知识问答", "RAG", "内部知识库"],
                       "icon": "LibraryBig", "featured": True},
    "workflow": {"id": "scene-workflow", "name": "流程自动化", "slug": "workflow",
                 "description": "连接业务系统，减少重复录入和人工流转。", "synonyms": ["Workflow", "RPA", "自动化流程"],
                 "icon": "Workflow", "featured": True},
    "ops-inspection": {"id": "scene-ops", "name": "运维与设备巡检", "slug": "ops-inspection",
                       "description": "设备、网络与IT系统的智能巡检、故障诊断与告警。", "synonyms": ["设备巡检", "运维", "故障诊断"],
                       "icon": "Wrench", "featured": False},
    "quality-inspection": {"id": "scene-quality", "name": "智能质检", "slug": "quality-inspection",
                           "description": "视觉、语音或文本质量检查和异常识别。", "synonyms": ["视觉质检", "AI质检"],
                           "icon": "ScanSearch", "featured": True},
    "forecast": {"id": "scene-forecast", "name": "预测与分析", "slug": "forecast",
                 "description": "需求、销量、库存、设备和经营指标预测。", "synonyms": ["需求预测", "数据分析", "预测性维护"],
                 "icon": "ChartNoAxesCombined", "featured": False},
}

REPORT_TITLE = "《矿山智能化暨矿山大模型最佳实践白皮书》（山东能源集团 × 华为云, 2023）"
REPORT_PUBLISHER = "山东能源集团 / 华为云"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags,
       model_stack, org_size="未披露", region="未披露", client=""):
    slug = f"case-mine-{idx:02d}"
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
                     "type": "institution", "publishedAt": "2023-12", "collectedAt": TODAY,
                     "accessibility": "available", "supports": ["最佳实践白皮书", "行业落地"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2023, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2023},
        "ctaText": "预约同款 AI 落地方案咨询",
    }
    doc["editorComment"]["text"] = (
        f"该案例收录于山东能源集团与华为云联合发布的《矿山智能化暨矿山大模型最佳实践白皮书》，"
        f"由{implementer}落地{client_note}，是国内矿山大模型规模化落地的标杆实践，极具行业参考价值。"
    )
    return doc


cases = [
    mk(1, "山东能源集团", "soe", "energy-mining", ["ops-inspection", "quality-inspection", "workflow"], ["安全", "生产"],
       "山东能源基于盘古矿山大模型落地40+智能化场景，防冲卸压人工审核减少80%",
       "山东能源集团联合华为云，基于盘古大模型构建“1+4+N”矿山大模型体系，在兴隆庄煤矿、济二煤矿等8对国家级智能化示范矿井落地防冲卸压、人员误入检测、皮带异物/堆煤检测、设备异常监控等40+场景，实现“云边协同、边学边用”的自动处置闭环。防冲卸压场景中人工审核工作量减少约80%，实现100%工程审核与实时告警。",
       "煤炭行业传统单场景小模型泛化差、难复制，井下高危作业依赖人工监管，效率低、易漏检。",
       "模型可移植性差、工况变化精度下降、数据安全风险高、开发效率低、缺乏AI人才。",
       "采用“1+4+N”架构（一站式AI平台+视觉/预测/NLP/多模态四大能力+N个场景模型），华为云Stack云边协同满足“数据不出企”，在采煤/洗选/加工关键工序落地场景模型。",
       ["集团层面统建矿山大模型与一站式AI平台", "华为云Stack云边协同部署", "梳理40+智能化场景试点先行", "标准化工作流推进场景模型训练与迭代"],
       [{"label": "落地场景", "value": "40+智能化场景", "kind": "actual"},
        {"label": "人工审核工作量", "value": "防冲卸压减少约80%", "improvement": "-80%", "kind": "actual"},
        {"label": "审核覆盖", "value": "卸压工程100%审核、实时告警", "kind": "actual"},
        {"label": "示范矿井", "value": "8对国家级智能化示范矿井", "kind": "actual"}],
       "安全生产与降本增效双提升",
       "需集团顶层设计与持续运营体系。",
       "大型矿业集团的智能化建设",
       "华为云Stack、盘古大模型、云边协同", "建议优先",
       "华为云（盘古大模型）", "40+场景、人工审核-80%",
       ["能源与矿山", "智能矿山", "盘古大模型", "云边协同"], ["盘古矿山大模型", "华为云Stack"], client="山东能源集团"),

    mk(2, "山东能源集团（选煤厂）", "soe", "energy-mining", ["forecast", "quality-inspection"], ["生产"],
       "山东能源基于盘古预测大模型实现重介密控，精煤产率提升达国家验收标准",
       "山东能源在选煤厂引入盘古预测大模型，构建重介密控算法模型，实时分析灰分、煤量、介质密度等生产数据，预测并下发最优工艺参数，替代依赖人工经验的密度控制，保证产品质量并提高精煤产率，达到《智能化选煤厂验收办法》智能分选要求。",
       "重介分选密度控制长期依赖人工经验，缺乏可靠数据分析，易导致分选异常、精煤回收损失。",
       "参数调整依赖经验、调优效率低成本高、缺乏一致性、难以统一标准。",
       "以预测大模型构建重介密控模型（训练态+推理态），融合数据知识/专家知识/机理知识，实时预测最优参数并下发生产自控系统。",
       ["构建重介密控预测模型", "融合生产数据与专家知识", "实时预测并下发最优参数", "持续自学习迭代"],
       [{"label": "产品质量", "value": "达到国家智能化选煤厂智能分选要求", "kind": "actual"},
        {"label": "精煤产率", "value": "有效保证质量并提高精煤产率", "kind": "actual"},
        {"label": "技术地位", "value": "盘古预测大模型首次用于选煤生产", "kind": "actual"}],
       "选煤质量与经济效益提升",
       "需高质量生产数据与机理模型支撑。",
       "选煤厂、洗选企业的工艺优化",
       "盘古预测大模型、生产自控系统", "条件具备后开展",
       "华为云（盘古大模型）", "重介密控达国家智能分选标准",
       ["能源与矿山", "智能选煤", "预测大模型", "工艺优化"], ["盘古预测大模型"], client="山东能源集团"),

    mk(3, "山东能源集团（焦化厂）", "soe", "energy-mining", ["forecast", "workflow"], ["生产"],
       "山东能源基于矿山大模型实现智能焦化配煤，配比验证从1-2天缩短至1-2分钟",
       "山东能源在焦化厂构建人工智能配煤系统，基于预测大模型训练焦炭质量预测模型，结合运筹学与AI求解模型计算最优配煤比例并自动配比，将炼焦配比验证时间从1-2天缩短至1-2分钟，平均每吨配合煤成本节约数元，并辅助新配煤师快速上岗。",
       "焦化配煤成本占炼焦成本80%以上，传统依赖人工经验配煤质量波动、成本高、煤种选择受限。",
       "人工/小焦炉试验耗时长、质量难稳定、成本质量难兼顾。",
       "基于预测大模型构建焦炭质量预测与配煤比例优化模型，边缘部署调用中心API实时获取配比，端到端打通数据。",
       ["整合运营/焦炭/原料煤数据", "训练焦炭质量预测模型", "构建配煤求解模型", "边缘部署实时配比下发"],
       [{"label": "配比验证时间", "value": "从1-2天缩短至1-2分钟", "improvement": "-99%", "kind": "actual"},
        {"label": "配合煤成本", "value": "平均每吨节约数元", "kind": "actual"},
        {"label": "人才赋能", "value": "辅助新配煤师快速上岗", "kind": "actual"}],
       "焦化成本下降与配煤效率提升",
       "需准确煤质数据与机理知识。",
       "焦化、钢铁原料企业的智能配煤",
       "盘古预测大模型、运筹优化求解", "条件具备后开展",
       "华为云（盘古大模型）", "配煤验证1-2天→1-2分钟",
       ["能源与矿山", "焦化配煤", "预测大模型", "降本"], ["盘古预测大模型"], client="山东能源集团"),
]

out_path = "scripts/extracted/mine-2023-cases.json"
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
