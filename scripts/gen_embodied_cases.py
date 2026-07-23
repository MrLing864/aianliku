#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""依据《中国人工智能系列白皮书——具身智能（2026版）》抽取典型案例，
生成符合 src/lib/types.ts 中 CaseStudy schema 的完整 JSON，落到 scripts/extracted/embodied-cases.json。
行业/场景严格引用 src/lib/catalog.ts 的既有 slug（不自行编造）。
数字来源未披露则留空/标记 undisclosed，不编造（遵循 CASE-02 / AI-02）。
用法：python scripts/gen_embodied_cases.py
"""
import json
import os

# ---------- 引用 src/lib/catalog.ts 的既有行业/场景对象（逐字复制） ----------
IND = {
    "manufacturing": {
        "id": "industry-manufacturing", "code": "C", "name": "制造业", "displayName": "制造业",
        "slug": "manufacturing", "description": "生产、质检、设备维护、供应链与经营管理中的 AI 实践。",
        "icon": "Factory", "featured": True, "standardVersion": "GB/T 4754-2017+1",
    },
    "retail": {
        "id": "industry-retail", "code": "F52", "name": "零售业", "displayName": "零售与消费",
        "slug": "retail", "description": "选品、库存、门店运营、客服与会员营销案例。",
        "icon": "ShoppingBag", "featured": True, "standardVersion": "GB/T 4754-2017+1", "parentCode": "F",
    },
    "healthcare": {
        "id": "industry-healthcare", "code": "Q84", "name": "卫生", "displayName": "医疗健康",
        "slug": "healthcare", "description": "病历、随访、辅助诊疗和医院运营案例。",
        "icon": "HeartPulse", "featured": True, "standardVersion": "GB/T 4754-2017+1", "parentCode": "Q",
    },
    "other": {
        "id": "industry-other", "code": "Z99", "name": "其他", "displayName": "其他行业",
        "slug": "other", "description": "难以归入上述行业的综合 AI 应用案例。",
        "icon": "Layers", "featured": False, "standardVersion": "GB/T 4754-2017+1",
    },
}

SCN = {
    "quality": {
        "id": "scene-quality", "name": "智能质检", "slug": "quality-inspection",
        "description": "视觉、语音或文本质量检查和异常识别。", "synonyms": ["视觉质检", "AI质检"],
        "icon": "ScanSearch", "featured": True,
    },
    "workflow": {
        "id": "scene-workflow", "name": "流程自动化", "slug": "workflow",
        "description": "连接业务系统，减少重复录入和人工流转。", "synonyms": ["Workflow", "RPA", "自动化流程"],
        "icon": "Workflow", "featured": True,
    },
    "agent": {
        "id": "scene-agent", "name": "Agent", "slug": "agent",
        "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
        "icon": "Bot", "featured": True,
    },
    "customer": {
        "id": "scene-customer-service", "name": "智能客服", "slug": "customer-service",
        "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服", "客服机器人", "在线客服"],
        "icon": "MessagesSquare", "featured": True,
    },
    "production": {
        "id": "scene-production-scheduling", "name": "智能排产与工艺优化", "slug": "production-scheduling",
        "description": "生产计划、排程与工艺参数优化。", "synonyms": ["排产", "工艺优化", "生产调度"],
        "icon": "Gauge", "featured": False,
    },
    "ops": {
        "id": "scene-ops-inspection", "name": "智能运维与巡检", "slug": "ops-inspection",
        "description": "设备运维、远程巡检与异常预警。", "synonyms": ["运维", "巡检", "预测性维护"],
        "icon": "Wrench", "featured": False,
    },
}

# 白皮书作为统一可信来源
WP_SOURCE = {
    "id": "src-embodied-wp-2026",
    "title": "中国人工智能系列白皮书——具身智能（2026版）",
    "publisher": "中国人工智能学会",
    "type": "institution",
    "publishedAt": "2026-04-01",
    "collectedAt": "2026-07-23",
    "accessibility": "available",
    "supports": ["行业应用", "部署事实", "技术路径"],
}

TODAY = "2026-07-23"


def make_case(idx, title, org_name, org_type, industry, scenarios, business_functions,
              summary, background, problem, solution, steps, duration, results, risks,
              editor, implementers, outcome_status, confidence, impl_year,
              pain_points, highlight, tech_path, model_stack, tags):
    slug = f"case-2026-{idx:04d}"
    seo_keywords = tags[:5]
    return {
        "id": slug,
        "version": 1,
        "slug": slug,
        "title": title,
        "organization": {
            "id": f"org-embodied-{idx:03d}",
            "name": org_name,
            "size": "未披露",
            "anonymous": False,
            "type": org_type,
        },
        "industry": IND[industry],
        "scenarios": [SCN[s] for s in scenarios],
        "businessFunctions": business_functions,
        "summary": summary,
        "background": background,
        "problem": problem,
        "solution": solution,
        "implementationSteps": steps,
        "duration": duration,
        "cost": "",
        "results": results,
        "roi": "",
        "risks": risks,
        "editorComment": editor,
        "implementers": implementers,
        "outcomeStatus": outcome_status,
        "contentStatus": "draft",
        "confidence": confidence,
        "sources": [WP_SOURCE],
        "featured": False,
        "views": 0,
        "dedupVector": [],
        "publishedAt": TODAY,
        "updatedAt": TODAY,
        "demo": False,
        "implementationYear": impl_year,
        "implementationTimePrecision": "year",
        "painPointTags": pain_points,
        "painPointNarrative": "",
        "highlight": highlight,
        "investmentRange": {"currency": "CNY", "disclosed": False, "narrative": ""},
        "projectDuration": {"disclosed": False, "narrative": ""},
        "testimonial": None,
        "techPath": tech_path,
        "modelStack": model_stack,
        "sourceReport": {
            "title": "中国人工智能系列白皮书——具身智能（2026版）",
            "publisher": "中国人工智能学会",
            "year": 2026,
        },
        "ctaText": "",
        "consultationStats": None,
        "relatedCaseIds": [],
        "tags": tags,
        "seo": {
            "metaTitle": title,
            "metaDescription": summary[:90],
            "keywords": seo_keywords,
        },
    }


cases = []

# 1) 智元机器人 远征 A2-W（工业规模化部署）
cases.append(make_case(
    1, "智元机器人远征 A2-W 工业具身智能规模化部署", "智元机器人（AgiBot）", "private",
    "manufacturing", ["quality", "workflow", "agent"], ["生产", "质检"],
    "智元机器人将轮式人形机器人「远征 A2-W」投入工业场景规模化部署，执行物料转运、质检辅助与柔性装配，标志具身智能从演示走向产线。",
    "制造业面临用工短缺与多品种小批量柔性生产压力，传统固定式机械臂难以适配非结构化任务，具身智能人形机器人成为新落地方向。",
    "产线物料流转与质检环节依赖人工，柔性差、招工难；固定机械臂难以应对换线频繁、品类多样的场景。",
    "远征 A2-W 轮式人形机器人具备多模态感知与 VLA 大模型决策能力，可在工业现场自主完成物料转运、工序衔接与质检辅助，支持快速适配新任务。",
    ["发布远征 A2 系列人形机器人平台", "在多家制造企业落地远征 A2-W 轮式机器人", "实现近百台规模部署于工业场景", "持续迭代 VLA 模型提升任务泛化"],
    "2024年至今持续迭代",
    [{"label": "规模化部署规模", "value": "近百台", "kind": "actual", "sourceId": "src-embodied-wp-2026"}],
    "工业现场对非结构化任务的可靠性、安全认证与规模化运维仍需验证；人形机器人单位成本高，投资回收周期待评估。",
    {"suitableFor": "多品种小批量、物料流转频繁的离散制造场景", "prerequisites": "需具备机器人调度与产线接口能力",
     "priority": "建议优先", "text": "体现具身智能从演示到产线的关键跨越，可作为制造企业评估人形机器人落地的参考样板。"},
    [{"name": "智元机器人（AgiBot）", "role": "技术提供方"}],
    "success", "high", 2025,
    ["用工短缺", "柔性生产", "质检"],
    "近百台规模部署，具身智能人形机器人率先规模化进入工业产线",
    ["具身智能", "人形机器人", "VLA大模型"], ["远征 A2-W VLA 模型"],
    ["具身智能", "人形机器人", "工业部署"],
))

# 2) 银河通用 Galbot G1 无人便利店 / 无人药房
cases.append(make_case(
    2, "银河通用 Galbot G1 具身智能无人便利店与无人药房", "银河通用（Galbot）", "private",
    "retail", ["customer", "agent", "workflow"], ["客服", "销售"],
    "银河通用以 Galbot G1 打造全球首个「银河太空舱」具身智能无人便利店与 24 小时无人药房，机器人自主完成补货、收银与商品制作。",
    "零售与药店面临夜间运营人力成本高、标准化服务难保障的问题，具身智能为「无人化门店」提供新路径。",
    "传统便利店/药房夜间需值守、人工成本高，且难以稳定提供 24 小时标准化服务。",
    "Galbot G1 具身大模型机器人理解自然语言指令，在无人空间内自主导航、抓取与操作，完成补货、收银、制作冰淇淋/咖啡等任务，支撑「银河太空舱」形态落地。",
    ["发布 Galbot G1 具身大模型机器人", "落地全球首个「银河太空舱」具身智能无人便利店", "拓展 24 小时无人药房场景", "验证多模态操作在零售闭环中的可用性"],
    "2025年试点落地",
    [{"label": "落地形态", "value": "全球首个具身智能无人便利店", "kind": "actual", "sourceId": "src-embodied-wp-2026"}],
    "无人零售对安全、合规与异常处置要求高；具身操作的长尾场景可靠性仍需持续打磨。",
    {"suitableFor": "夜间便利店、药店、园区新零售等标准化高频场景", "prerequisites": "需具备无人空间与远程监控能力",
     "priority": "建议优先", "text": "具身智能在零售闭环中较完整的落地示范，适合关注无人化门店的企业参考。"},
    [{"name": "银河通用（Galbot）", "role": "技术提供方"}],
    "success", "high", 2025,
    ["人力成本", "夜间运营", "无人零售"],
    "全球首个具身智能无人便利店，机器人自主完成补货、收银与商品制作",
    ["具身智能", "无人零售", "具身大模型"], ["Galbot G1 具身大模型"],
    ["具身智能", "无人零售", "机器人"],
))

# 3) 微亿智造 创Tron 仿生视觉装配
cases.append(make_case(
    3, "微亿智造「创Tron」仿生视觉装配机器人", "微亿智造", "private",
    "manufacturing", ["quality", "workflow"], ["生产", "质检"],
    "微亿智造推出「创Tron」仿生视觉装配机器人，融合多光谱视觉与力控，实现少样本/零样本柔性装配与在线质检。",
    "3C、汽车零部件等行业装配工序繁多、换型频繁，传统专机难以兼顾柔性与精度。",
    "装配环节依赖熟练工，换型调试周期长；视觉质检误检漏检影响良率。",
    "创Tron 采用仿生视觉（多光谱+三维）与力控闭环，结合大模型理解装配工艺，支持快速适配新工件，并在线完成质量检查。",
    ["研发仿生视觉感知与力控融合架构", "面向 3C/汽车零部件推出创Tron 装配机器人", "落地柔性装配与在线质检产线", "迭代少样本适配能力"],
    "2024年起持续落地",
    [{"label": "能力特征", "value": "仿生视觉+力控柔性装配", "kind": "actual", "sourceId": "src-embodied-wp-2026"}],
    "复杂工件与强反光表面的感知稳定性仍是挑战；与既有 MES/产线系统的集成需定制。",
    {"suitableFor": "多品种小批量、换型频繁的精密装配与质检", "prerequisites": "需具备工艺数字化与产线接口",
     "priority": "建议优先", "text": "把具身视觉与力控用于精密装配，是制造业具身智能的务实落地方向。"},
    [{"name": "微亿智造", "role": "技术提供方"}],
    "success", "high", 2024,
    ["柔性装配", "在线质检", "换型"],
    "仿生视觉+力控融合，实现少样本柔性装配与在线质检",
    ["具身视觉", "力控", "柔性装配"], ["创Tron 仿生视觉大模型"],
    ["具身智能", "工业视觉", "柔性装配"],
))

# 4) Physical Intelligence Pi-Zero 工业机械臂
cases.append(make_case(
    4, "Physical Intelligence Pi-Zero 零样本机械臂操控", "Physical Intelligence", "foreign",
    "manufacturing", ["agent", "workflow"], ["生产"],
    "Physical Intelligence 发布 Pi-Zero 具身基础模型，使机械臂以零样本/少样本方式学习多种操作任务，降低工业自动化编程门槛。",
    "工业机器人落地长期受限于逐任务编程与示教，难以快速适应新任务。",
    "传统机械臂每换一个任务都需重新编程示教，工程成本高、周期长。",
    "Pi-Zero 以大规模多机器人操作数据训练具身基础模型，结合流式视觉-语言-动作架构，让机械臂直接理解指令并零样本执行多类操作。",
    ["构建跨本体操作数据集训练 Pi-Zero", "发布流式视觉-语言-动作(VLA)模型", "演示零样本多任务机械臂操控", "探索与工业系统集成"],
    "2024年发布",
    [{"label": "能力特征", "value": "零样本多任务操控", "kind": "undisclosed", "sourceId": "src-embodied-wp-2026"}],
    "零样本在长尾工业任务上的成功率与安全性仍需验证；数据合规与跨本体泛化存在边界。",
    {"suitableFor": "任务多样、换型频繁的轻量操作与科研验证", "prerequisites": "需具备机械臂硬件与数据采集条件",
     "priority": "条件具备后开展", "text": "代表具身基础模型方向，企业可关注其与自有产线结合的可行性与数据门槛。"},
    [{"name": "Physical Intelligence", "role": "技术提供方"}],
    "undisclosed", "medium", 2024,
    ["编程门槛", "换型成本"],
    "具身基础模型 Pi-Zero 实现机械臂零样本多任务操控",
    ["具身基础模型", "VLA", "零样本"], ["Pi-Zero"],
    ["具身智能", "基础模型", "机械臂"],
))

# 5) 阿里云 千问 + 工业机器人
cases.append(make_case(
    5, "阿里云千问大模型驱动工业机器人", "阿里云", "private",
    "manufacturing", ["agent", "production"], ["生产", "研发"],
    "阿里云将通义千问大模型接入工业机器人，用自然语言指令驱动机器人完成抓取、搬运与简单装配，降低产线自动化使用门槛。",
    "中小企业缺乏机器人编程与集成能力，难以把大模型能力落到实体产线。",
    "工业机器人使用门槛高，需专业工程师编程；大模型与物理执行之间存在鸿沟。",
    "以通义千问作为「大脑」进行任务理解、规划与代码生成，结合机器人控制「小脑」执行，形成自然语言到动作的控制链路。",
    ["通义千问接入工业机器人控制链路", "自然语言指令驱动抓取/搬运/装配演示", "沉淀工业场景 Agent 能力", "探索云+端协同部署"],
    "2024年起探索",
    [{"label": "能力特征", "value": "自然语言到动作的控制链路", "kind": "undisclosed", "sourceId": "src-embodied-wp-2026"}],
    "现场噪声、安全边界与实时性要求高；大模型生成动作代码的可靠性需严格校验。",
    {"suitableFor": "希望以低代码方式改造产线的制造企业", "prerequisites": "需具备机器人硬件与网络条件",
     "priority": "条件具备后开展", "text": "大模型+机器人是降低自动化门槛的重要方向，建议先在可控工序试点。"},
    [{"name": "阿里云", "role": "技术提供方"}],
    "undisclosed", "medium", 2024,
    ["自动化门槛", "编程成本"],
    "通义千问驱动工业机器人，自然语言指令直达动作",
    ["大模型", "机器人控制", "Agent"], ["通义千问"],
    ["具身智能", "大模型", "工业机器人"],
))

# 6) 自变量机器人 WALL-A × 58到家 智能保洁
cases.append(make_case(
    6, "自变量机器人 WALL-A 联合 58 到家落地智能保洁", "自变量机器人（X Square Robot）", "private",
    "other", ["workflow", "agent"], ["经营管理"],
    "自变量机器人将轮式机器人 WALL-A 与 58 到家合作，在深圳推出智能保洁服务模式，探索具身智能进入家庭服务。",
    "家政保洁用工短缺、服务标准化难，具身智能有望补齐人力短板。",
    "家庭/商用保洁依赖人工，招工难、质量不均，难以规模化标准化。",
    "WALL-A 轮式机器人具备操作与泛化能力，结合 58 到家的服务网络，在深圳试点智能保洁服务模式，承接标准化清洁任务。",
    ["发布 WALL-A 轮式操作机器人", "与 58 到家达成合作", "在深圳试点智能保洁服务模式", "迭代家庭/商用清洁技能"],
    "2025年试点",
    [{"label": "合作模式", "value": "联合 58 到家在深圳试点智能保洁", "kind": "actual", "sourceId": "src-embodied-wp-2026"}],
    "家庭非结构化环境对安全与避障要求极高；服务网络的运营与责任划分尚需摸索。",
    {"suitableFor": "园区、写字楼等半结构化环境的保洁服务", "prerequisites": "需具备服务运营与远程接管能力",
     "priority": "建议优先", "text": "具身智能+生活服务平台是家政自动化的早期探索，可关注其规模化可行性。"},
    [{"name": "自变量机器人（X Square Robot）", "role": "技术提供方"}, {"name": "58 到家", "role": "其他"}],
    "success", "high", 2025,
    ["用工短缺", "服务标准化"],
    "WALL-A 联合 58 到家，在深圳试点智能保洁服务模式",
    ["具身智能", "家庭服务", "机器人"], ["WALL-A"],
    ["具身智能", "生活服务", "机器人"],
))

# 7) 西安中科光电 智能焊接机器人
cases.append(make_case(
    7, "西安中科光电智能焊接机器人", "西安中科光电", "private",
    "manufacturing", ["quality", "workflow"], ["生产", "质检"],
    "西安中科光电推出视觉引导的智能焊接机器人，通过三维视觉定位与工艺参数优化，提升焊接质量与一致性。",
    "焊接是制造基础工序，熟练焊工短缺、质量波动大，自动化需求强烈。",
    "传统焊接依赖老师傅经验，招工难、良率波动；小批量多品种难以快速编程。",
    "以三维视觉识别焊缝与姿态，自动规划焊接路径并实时调整工艺参数，实现自适应智能焊接与在线质量检查。",
    ["研发三维视觉引导焊接系统", "落地智能焊接机器人产品", "在装备制造产线应用", "迭代自适应工艺参数"],
    "持续落地",
    [{"label": "能力特征", "value": "视觉引导自适应焊接", "kind": "actual", "sourceId": "src-embodied-wp-2026"}],
    "复杂工件与异形焊缝的识别稳定性需提升；与既有产线的节拍匹配需调优。",
    {"suitableFor": "装备制造、钢结构等批量焊接场景", "prerequisites": "需具备焊接工艺与产线接口",
     "priority": "建议优先", "text": "视觉+工艺优化的智能焊接是制造自动化的成熟切入点，投资回收相对清晰。"},
    [{"name": "西安中科光电", "role": "技术提供方"}],
    "success", "high", 2024,
    ["焊工短缺", "焊接质量"],
    "视觉引导自适应焊接，提升焊接质量与一致性",
    ["机器视觉", "智能焊接", "工艺优化"], ["三维视觉焊接模型"],
    ["具身智能", "智能焊接", "机器视觉"],
))

# 8) Figure AI Helix 零售抓取
cases.append(make_case(
    8, "Figure AI Helix 零样本零售货架抓取", "Figure AI", "foreign",
    "retail", ["customer", "agent"], ["客服", "销售"],
    "Figure AI 发布 Helix 视觉-语言-动作(VLA)模型，让 Figure 02 人形机器人零样本理解自然语言、在零售场景抓取与分拣商品。",
    "零售补货、理货依赖人工，具身智能有望承接高频重复操作。",
    "货架补货、拣选需大量人工，且难以 24 小时稳定执行。",
    "Helix 以统一 VLA 模型端到端输出动作，Figure 02 可按自然语言指令在超市环境零样本抓取、分拣与归位商品。",
    ["发布 Helix 统一 VLA 模型", "在 Figure 02 上实现零样本抓取", "演示超市货架分拣", "探索与物流/零售集成"],
    "2025年演示",
    [{"label": "能力特征", "value": "零样本货架抓取与分拣", "kind": "undisclosed", "sourceId": "src-embodied-wp-2026"}],
    "开放零售环境的长尾物体与拥挤货架对鲁棒性要求高；成本与节拍尚难规模化。",
    {"suitableFor": "仓内分拣、门店理货等结构化操作", "prerequisites": "需具备机器人硬件与场景数据",
     "priority": "条件具备后开展", "text": "Helix 展示人形机器人在零售操作的潜力，企业可关注其从演示到规模化落地进展。"},
    [{"name": "Figure AI", "role": "技术提供方"}],
    "undisclosed", "medium", 2025,
    ["理货人力", "补货效率"],
    "Helix VLA 模型驱动 Figure 02 零样本零售抓取分拣",
    ["具身智能", "VLA", "人形机器人"], ["Helix", "Figure 02"],
    ["具身智能", "人形机器人", "零售"],
))

# 9) 达芬奇手术机器人（直观外科）
cases.append(make_case(
    9, "达芬奇手术机器人临床应用", "直观外科（Intuitive Surgical）", "foreign",
    "healthcare", ["agent"], ["研发"],
    "达芬奇手术机器人以主从遥操作与三维高清视野辅助外科医生完成微创手术，是医疗具身智能最具代表性的成熟应用。",
    "微创外科对操作精度与视野要求极高，传统腹腔镜受限于器械自由度。",
    "医生手部震颤、器械自由度不足影响精细操作；学习曲线长。",
    "达芬奇系统通过主从机械臂、腕部关节与三维放大视野，滤除震颤并扩展操作自由度，由医生主导完成精准微创操作。",
    ["推出达芬奇手术机器人系统", "在全球医院规模部署", "持续迭代机械臂与成像", "拓展多科室微创手术"],
    "长期临床广泛应用",
    [{"label": "应用特征", "value": "全球范围临床应用", "kind": "actual", "sourceId": "src-embodied-wp-2026"}],
    "设备与维护成本高，依赖术者培训；属医生主导的遥操作而非自主决策。",
    {"suitableFor": "需高精度微创操作的医疗机构", "prerequisites": "需具备外科培训与设备条件",
     "priority": "条件具备后开展", "text": "医疗具身智能的标杆，但属高端设备并非通用 AI Agent，企业参考其「人机协作」范式更务实。"},
    [{"name": "直观外科（Intuitive Surgical）", "role": "技术提供方"}],
    "success", "high", 2023,
    ["手术精度", "微创"],
    "达芬奇手术机器人：医疗具身智能最成熟的临床应用",
    ["医疗机器人", "主从遥操作", "微创手术"], ["达芬奇手术系统"],
    ["具身智能", "医疗机器人", "微创手术"],
))

# 10) 乌克兰 STI 扫雷无人机（特种作业）
cases.append(make_case(
    10, "STI 自主扫雷无人机野外排雷应用", "STI（乌克兰）", "foreign",
    "other", ["ops"], ["经营管理"],
    "乌克兰使用的 STI 自主扫雷无人机在野外作业中效率达人工排雷约 4 倍，是具身智能在特种危险作业中的典型应用。",
    "战后人道排雷任务重、危险性高，传统人工排雷效率低、风险大。",
    "人工排雷速度慢、伤亡风险高，难以快速恢复土地可用。",
    "STI 扫雷无人机具备自主导航与探测能力，在野外环境下自主识别并处置地雷，大幅提升排雷效率、降低人员暴露。",
    ["部署 STI 自主扫雷无人机", "在野外环境执行排雷任务", "验证效率相较人工显著提升", "迭代探测与处置能力"],
    "2023年起实战应用",
    [{"label": "排雷效率（相对人工）", "value": "4", "unit": "倍", "kind": "actual", "sourceId": "src-embodied-wp-2026"}],
    "战场环境复杂、未爆物类型多样，误报与漏报风险仍存；属特种作业非商业场景。",
    {"suitableFor": "高危、重复、需远程作业的特种场景", "prerequisites": "需具备自主导航与探测能力",
     "priority": "条件具备后开展", "text": "体现具身智能在危险作业替代人力的价值，但其特种属性与商业落地差异较大，仅供参考。"},
    [{"name": "STI（乌克兰）", "role": "技术提供方"}],
    "success", "high", 2023,
    ["高危作业", "排雷效率"],
    "自主扫雷无人机效率达人工约 4 倍，具身智能替代高危人力",
    ["具身智能", "自主作业", "特种机器人"], ["STI 扫雷无人机"],
    ["具身智能", "特种作业", "自主机器人"],
))

out_dir = os.path.join(os.path.dirname(__file__), "extracted")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "embodied-cases.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)

print(f"已生成 {len(cases)} 条案例 -> {out_path}")
for c in cases:
    print(f"  {c['id']}  [{c['industry']['slug']}]  {c['title']}")
