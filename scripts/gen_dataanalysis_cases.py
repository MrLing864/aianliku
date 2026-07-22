# -*- coding: utf-8 -*-
"""生成《2024中国"大模型+数据分析"最佳实践案例TOP10》（沙丘社区）10个案例的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "retail": {"id": "industry-retail", "code": "F", "name": "零售业", "displayName": "零售消费", "slug": "retail",
               "description": "门店、电商、会员与营销场景的 AI 实践。", "icon": "ShoppingBag", "featured": True,
               "standardVersion": "GB/T 4754-2017+1"},
    "manufacturing": {"id": "industry-manufacturing", "code": "C", "name": "制造业", "displayName": "制造业", "slug": "manufacturing",
                      "description": "生产、质检、设备维护、供应链与经营管理中的 AI 实践。", "icon": "Factory",
                      "featured": True, "standardVersion": "GB/T 4754-2017+1"},
    "software-internet": {"id": "industry-software", "code": "I65", "name": "软件和信息技术服务业", "displayName": "软件与互联网",
                          "slug": "software-internet", "description": "研发、运维、客服、销售与内容生产案例。", "icon": "Code2",
                          "featured": True, "standardVersion": "GB/T 4754-2017+1", "parentCode": "I"},
    "telecom": {"id": "industry-telecom", "code": "I63", "name": "电信、广播电视和卫星传输服务", "displayName": "通信", "slug": "telecom",
                "description": "运营商网络、政企营销与客服场景的 AI 实践。", "icon": "Antenna", "featured": True,
                "standardVersion": "GB/T 4754-2017+1", "parentCode": "I"},
    "government": {"id": "industry-government", "code": "S", "name": "公共管理、社会保障和社会组织", "displayName": "政务与公共服务",
                   "slug": "government", "description": "政务热线、政策问答、城市治理与公共服务的 AI 应用。", "icon": "Building2",
                   "featured": False, "standardVersion": "GB/T 4754-2017+1"},
    "energy-mining": {"id": "industry-energy-mining", "code": "B", "name": "采矿业", "displayName": "能源与矿山", "slug": "energy-mining",
                      "description": "煤矿、油气、电力与矿山的智能化、安全管控与生产经营 AI 实践。", "icon": "Fuel",
                      "featured": True, "standardVersion": "GB/T 4754-2017+1"},
    "finance": {"id": "industry-finance", "code": "J", "name": "金融业", "displayName": "金融", "slug": "finance",
                "description": "风控、合规、运营与知识服务案例。", "icon": "Landmark", "featured": True,
                "standardVersion": "GB/T 4754-2017+1"},
}

SCN = {
    "knowledge-base": {"id": "scene-knowledge", "name": "企业知识库", "slug": "knowledge-base",
                       "description": "让制度、产品和业务资料可检索、可问答。", "synonyms": ["知识问答", "RAG", "内部知识库", "ChatBI", "NL2SQL"],
                       "icon": "LibraryBig", "featured": True},
    "sales": {"id": "scene-sales", "name": "销售辅助", "slug": "sales",
              "description": "线索分析、销售跟进、沟通总结和方案生成。", "synonyms": ["销售助手", "商机分析", "销售Agent"],
              "icon": "TrendingUp", "featured": True},
    "forecast": {"id": "scene-forecast", "name": "预测与分析", "slug": "forecast",
                 "description": "需求、销量、库存、设备和经营指标预测。", "synonyms": ["需求预测", "数据分析", "预测性维护"],
                 "icon": "ChartNoAxesCombined", "featured": False},
    "quality-inspection": {"id": "scene-quality", "name": "智能质检", "slug": "quality-inspection",
                           "description": "视觉、语音或文本质量检查和异常识别。", "synonyms": ["视觉质检", "AI质检", "视觉检测"],
                           "icon": "ScanSearch", "featured": True},
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent"],
              "icon": "Bot", "featured": True},
    "ai-infra": {"id": "scene-ai-infra", "name": "算力基础设施与AI平台", "slug": "ai-infra",
                 "description": "算力调度、AI 平台与基础设施。", "synonyms": ["算力", "AI平台", "基础设施", "数据平台"],
                 "icon": "Cpu", "featured": False},
}

REPORT_TITLE = '沙丘社区《2024中国“大模型+数据分析”最佳实践案例TOP10》'
REPORT_PUBLISHER = "沙丘社区"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, org_region, industry_slug, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags, model_stack, client=""):
    slug = f"case-dataanalysis-2024-{idx:02d}"
    src_id = f"src-{slug}-0"
    client_note = f"（落地客户：{client}）" if client else ""
    doc = {
        "id": slug, "slug": slug, "version": 1, "title": title,
        "organization": {"id": f"org-{slug}", "name": org_name, "size": "未披露", "region": org_region, "type": org_type},
        "industry": IND[industry_slug], "scenarios": scn(*scenario_slugs),
        "businessFunctions": business_functions, "summary": summary, "background": background,
        "problem": problem, "solution": solution, "implementationSteps": steps,
        "duration": "未披露", "cost": "未披露", "results": results, "roi": roi, "risks": risks,
        "editorComment": {
            "suitableFor": suitable_for, "prerequisites": prerequisites, "priority": priority,
            "text": f"该案例来自{REPORT_PUBLISHER}评选的“大模型+数据分析”最佳实践TOP10，由{implementer}落地{client_note}，"
                    f"展示了对话式数据分析（ChatBI/NL2SQL）在企业数据驱动决策中的价值，建议结合自身数据基础设施参考落地。",
        },
        "implementers": [{"name": implementer, "role": "技术提供方"}],
        "outcomeStatus": "success", "contentStatus": "published", "confidence": "high",
        "sources": [{"id": src_id, "title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "type": "institution",
                     "publishedAt": "2024-06", "collectedAt": TODAY, "accessibility": "available",
                     "supports": ["最佳实践案例", "入选理由"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2024, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2024},
        "ctaText": "预约同款数据分析 AI 落地咨询",
    }
    return doc


cases = [
    mk(1, "波司登股份有限公司", "private", "上海", "retail", ["sales", "forecast"], ["销售"],
       "波司登“AIOT+大模型”赋能线下门店销售，优化转化与库存",
       "波司登通过在门店服装上安装芯片并结合大模型技术，实现对线下门店顾客行为的精准分析，以“AIOT+大模型”方案提高门店转化率、优化库存管理与商品补货策略，使决策更数据驱动，显著提升业绩与品牌价值。",
       "线下零售长期面临转化率漏斗数据缺失、用户行为难以量化、库存与补货决策缺乏数据支撑等难题。",
       "门店服装上安装芯片后行为数据仍难以自动分析与利用；库存管理凭经验，滞销与缺货并存。",
       "在门店服装安装芯片采集行为数据，结合大模型进行顾客行为精准分析；以AIOT+大模型实现转化率提升、库存优化与补货策略的数据驱动。",
       ["门店服装部署RFID芯片采集顾客行为数据", "搭建大模型行为分析能力", "打通库存与补货系统实现数据驱动决策", "持续训练优化提升行为识别准确率"],
       [{"label": "门店转化率", "value": "通过精准行为分析优化陈列与导购，转化率提升", "kind": "actual"},
        {"label": "库存管理", "value": "减少滞销风险，提高畅销商品供应效率", "kind": "actual"},
        {"label": "品牌价值", "value": "数据驱动决策显著提升业绩与品牌价值", "kind": "actual"}],
       "量化ROI未披露，业绩与品牌价值双提升",
       "门店芯片部署与数据采集合规与成本需评估。",
       "服装、零售等线下连锁门店",
       "门店IoT传感/芯片、行为数据平台", "建议优先",
       "波司登股份有限公司", "AIOT+大模型优化线下门店转化与库存",
       ["零售消费", "智能门店", "AIOT", "数据分析"], ["AIOT", "大模型"], client="波司登线下门店"),

    mk(2, "重庆长安汽车股份有限公司", "soe", "重庆", "manufacturing", ["knowledge-base", "forecast"], ["经营管理"],
       "长安汽车联合北极九章打造智能问数AI助手，需求响应效率翻倍",
       "长安汽车依托北极九章DataGPT打造集团内部对话式问数工具，应用于产品策划、市场营销、客户管理等多场景，满足海量高频分析与数据报告需求；看数人与取数人合二为一，需求响应效率翻倍，分析灵活度指数级提升。",
       "集团内部各业务团队有海量、高频的数据分析与报告需求，传统取数流程长、门槛高。",
       "业务人员取数依赖分析师，响应慢；缺乏统一语义层，数据口径不一致。",
       "基于北极九章DataGPT构建对话式问数工具，结合大模型与小模型实现语义理解到数据解释、行动建议全流程闭环；以专利数据分析语言模型保障NL2SQL准确稳定，规避幻觉。",
       ["引入北极九章DataGPT对话式问数平台", "构建统一语义层与指标管理", "在研、产、供、销等场景试点", "沉淀业务知识保障NL2SQL准确稳定"],
       [{"label": "需求响应效率", "value": "看数/取数合二为一，效率翻倍", "improvement": "翻倍", "kind": "actual"},
        {"label": "分析灵活度", "value": "指数级提升，业务用户自助用数", "kind": "actual"}],
       "效率翻倍，量化ROI未披露",
       "NL2SQL需统一语义层保障口径一致，避免幻觉。",
       "大型制造集团、多业务线企业",
       "统一数据语义层、指标管理体系", "建议优先",
       "北极九章（DataGPT）", "需求响应效率翻倍，分析灵活度指数级提升",
       ["制造业", "智能问数", "NL2SQL", "ChatBI"], ["DataGPT", "NL2SQL", "小模型"], client="长安汽车集团"),

    mk(3, "北京京东世纪贸易有限公司（京东零售）", "private", "北京", "software-internet", ["knowledge-base"], ["经营管理"],
       "京东零售打造ChatBI，以自然语言对话简化复杂BI工作",
       "京东零售内部打造基于GPT大语言模型的ChatBI（AI数据分析师），通过意图识别、实体提取、知识库交互与数据分析应用扩展，提供快速直观的数据查询分析服务，降低技术门槛、提高分析效率，让一线业务人员像与真人合作一样解决数据问题。",
       "京东零售业务复杂、指标众多，业务人员使用传统BI需学习复杂操作或编写代码。",
       "复杂BI操作门槛高，分析师时间被重复性取数占据，一线业务难以自助用数。",
       "构建ChatBI，基于GPT大模型做意图识别与实体提取，结合知识库交互与数据分析应用扩展；将分析师思路与业务知识沉淀到知识库，为一线提供专业支持并自动化分析。",
       ["基于GPT大模型构建ChatBI对话引擎", "建设业务知识库沉淀分析思路", "对接内部BI与数据集", "在多条业务线推广自助分析"],
       [{"label": "技术门槛", "value": "自然语言对话即可取数，无需写代码", "kind": "actual"},
        {"label": "分析效率", "value": "快速定位问题并辅助决策", "kind": "actual"},
        {"label": "分析师价值", "value": "释放分析师时间专注高层次分析", "kind": "actual"}],
       "释放分析师产能，量化ROI未披露",
       "需知识库保障回答准确性与口径一致。",
       "电商、互联网等数据密集企业",
       "GPT大模型、业务知识库、BI对接", "建议优先",
       "京东零售", "自然语言对话式BI，分析师时间释放",
       ["软件与互联网", "ChatBI", "知识库", "数据分析"], ["GPT大语言模型", "知识库"], client="京东零售"),

    mk(4, "中国移动通信集团江苏有限公司", "soe", "江苏", "telecom", ["knowledge-base", "sales"], ["销售", "经营管理"],
       "江苏移动智瞳政企营销平台引入大模型搜索与数据分析，提升精准度",
       "江苏移动在智瞳政企精准营销平台引入大模型搜索与数据分析能力，结合公司网格、政企等数据，提升搜索效率与结果精准度，满足政企视图、营销案例、业务推荐、分析报告等搜索需求，增强对市场趋势与用户需求的把握，提升营销效果与竞争力。",
       "省市区县运营管理人员使用政企营销平台时，搜索功能受限，难以高效获取所需信息与洞察。",
       "传统搜索语义理解弱、结果不准；多模态搜索、个性化推荐与深度挖掘分析难以实现。",
       "引入大模型搜索与数据分析，通过结构化数据表征、NLP与Text2SQL、数据挖掘与特征提取、模板定制与智能报告生成，解决多模态搜索、语义理解、个性化推荐等实际问题。",
       ["接入网格与政企等内部数据", "部署大模型搜索与语义理解", "构建个性化推荐与智能报告生成", "在政企营销场景落地应用"],
       [{"label": "搜索效率与精准度", "value": "显著提升，满足政企多场景搜索需求", "kind": "actual"},
        {"label": "营销效果", "value": "把握市场趋势与用户需求，提升竞争力", "kind": "actual"}],
       "工作效率与营销效果提升，量化ROI未披露",
       "需保障内部数据合规与权限管控。",
       "通信运营商政企营销与运营团队",
       "内部网格/政企数据、NLP与Text2SQL能力", "建议优先",
       "江苏移动", "政企营销平台搜索与推荐精准度提升",
       ["通信", "智能搜索", "精准营销", "Text2SQL"], ["大模型", "Text2SQL", "NLP"], client="江苏移动政企营销平台"),

    mk(5, "武汉市中山公园管理处", "soe", "武汉", "government", ["quality-inspection"], ["经营管理"],
       "武汉市中山公园基于YOLOv8落水检测系统，实时预警保障水域安全",
       "武汉市中山公园联合毕昇云利用基于YOLOv8的落水检测模型，精准识别人、游泳者、戏水者、船只等目标，出现危险行为即刻报警并通过就近广播播放告警音频；异常行为分析系统降低误报率，提供高效精准的水域安全监控。",
       "公园水域面积大、巡查人力有限，溺水等危险行为难以及时发现与处置。",
       "传统监控依赖人工巡检，响应慢、漏报率高，难以实时预警危险行为。",
       "部署基于YOLOv8的视觉落水检测模型，识别危险行为后实时报警并联动就近广播制止；结合异常行为分析系统降低误报率。",
       ["部署水域摄像头与YOLOv8检测模型", "构建危险行为识别与告警联动", "接入就近广播自动播放告警", "异常行为分析降低误报率"],
       [{"label": "溺水风险", "value": "实时监测预警有效降低事故风险", "kind": "actual"},
        {"label": "应急响应", "value": "缩短响应时间，提升应急处理能力", "kind": "actual"},
        {"label": "管理水平", "value": "提升公园水域安全管理与游客满意度", "kind": "actual"}],
       "社会价值显著，量化ROI未披露",
       "需平衡监控隐私与公共安全，模型需持续迭代降低误报。",
       "公园、景区、公共水域等管理单位",
       "视频监控设备、视觉检测模型", "建议优先",
       "毕昇云", "AI视觉落水检测，实时预警保障水域安全",
       ["政务与公共服务", "视觉检测", "公共安全", "AIOT"], ["YOLOv8", "视觉大模型", "异常行为分析"], client="武汉市中山公园"),

    mk(6, "杭州网易云音乐科技有限公司", "private", "杭州", "software-internet", ["knowledge-base"], ["经营管理"],
       "网易云音乐联合网易数帆打造ChatBI，开创自助分析新篇章",
       "网易云音乐与网易数帆联合发起ChatBI项目，打造融合AIGC的对话式BI产品，通过自然语言交互简化数据查询分析流程，使非技术运营人员也能自助获取数据，显著提升查询效率、降低对技术人员依赖，已在曲库、社区、长音频、创新业务等落地。",
       "业务线多、运营人员非技术背景，传统BI使用门槛高，取数依赖技术团队。",
       "数据查询分析流程复杂，运营人员难以自助用数，技术团队成为瓶颈。",
       "构建融合AIGC的对话式BI（ChatBI），以自然语言交互简化查询；通过检索增强、个性化知识配置与模型自学习解决数据查询准确性问题。",
       ["网易数帆联合打造ChatBI对话式BI", "多轮对话与多端互通接入", "配置个性化知识库保障准确性", "在曲库/社区/长音频等业务线推广"],
       [{"label": "查询效率", "value": "非技术运营人员自助用数，效率显著提升", "kind": "actual"},
        {"label": "技术依赖", "value": "降低对专业技术人员的依赖", "kind": "actual"}],
       "运营自助用数，量化ROI未披露",
       "需检索增强与知识配置保障回答准确。",
       "内容平台、互联网产品运营团队",
       "AIGC对话式BI、检索增强、知识库", "建议优先",
       "网易数帆", "对话式BI，运营自助用数",
       ["软件与互联网", "ChatBI", "AIGC", "自助分析"], ["AIGC", "ChatBI", "检索增强"], client="网易云音乐"),

    mk(7, "中国第一汽车集团有限公司", "soe", "吉林", "manufacturing", ["forecast", "ai-infra"], ["经营管理"],
       "中国一汽基于通义千问打造GPT-BI，覆盖9大领域实现“问答即洞察”",
       "中国一汽基于阿里云通义千问打造大模型应用GPT-BI，以提问方式获取数据结果及图表，覆盖研、产、供、销等9大领域指标查询分析，包含数据指标实时查询、管理层决策辅助、业务人员高效分析三大场景，实现“问答即洞察”的决策革命。",
       "传统BI采用“固定问答”，报表设计、数据建模交付周期长，难以灵活支撑动态决策。",
       "固定报表无法满足灵活多变的业务问题；决策依赖滞后数据，缺乏实时穿透。",
       "基于通义千问构建GPT-BI，识别问题意图、解析决策变量、生成SQL匹配实时数据并自动生成最佳决策方案；覆盖9大领域指标实时查询。",
       ["基于通义千问构建GPT-BI", "打通研产销等9大领域指标", "构建实时数据查询与决策辅助", "在管理层与业务人员场景推广"],
       [{"label": "交付周期", "value": "缩短BI报表设计与数据建模交付周期", "kind": "actual"},
        {"label": "指标覆盖", "value": "9大领域指标实时查询与穿透", "kind": "actual"},
        {"label": "决策模式", "value": "问答即洞察，实时数据驱动决策", "kind": "actual"}],
       "决策数字化能力显著提升，量化ROI未披露",
       "需数据治理与统一口径保障生成SQL准确。",
       "大型制造集团、需实时经营分析的企业",
       "通义千问、统一数据治理、实时数据管道", "建议优先",
       "阿里云", "覆盖9大领域，问答即洞察",
       ["制造业", "GPT-BI", "NL2SQL", "通义千问"], ["通义千问", "NL2SQL"], client="中国一汽"),

    mk(8, "中煤科工集团上海有限公司", "soe", "上海", "energy-mining", ["forecast", "ai-infra"], ["经营管理"],
       "中煤科工煤科卫士ChinamjGPT，融合大模型与物联网保障煤矿安全高效",
       "煤科卫士大模型ChinamjGPT融合煤炭开采技术工艺、运维、设备运行与供应链数据，结合物联网大数据采集、知识图谱、数据推理与大语言模型，将实时/静态/模型数据融合，开发AI产业场景方案，提高服务支持效率，提升开采安全水平、降低生产成本、提高生产效率。",
       "煤矿开采面临设备运维、故障处理与预测困难，技术保障与产业服务依赖经验。",
       "煤矿知识与业务数据分散，设备运维与故障预测缺乏智能化手段。",
       "构建煤科卫士大模型，融合工艺/运维/设备/供应链数据，结合物联网采集、知识图谱、数据推理与LLM，贯通数据与业务模型，实现技术/业务/场景突破。",
       ["汇聚煤矿工艺/运维/设备/供应链数据", "构建知识图谱与数据推理能力", "融合物联网实时数据与大模型", "在设备运维与预测场景落地"],
       [{"label": "安全水平", "value": "提高煤炭开采安全水平", "kind": "actual"},
        {"label": "生产成本", "value": "降低生产成本", "kind": "actual"},
        {"label": "生产效率", "value": "提高生产效率，保障连续生产", "kind": "actual"}],
       "安全与效率双提升，量化ROI未披露",
       "煤矿场景安全等级高，模型需高可靠。",
       "煤矿、能源等传统行业",
       "煤矿领域数据、知识图谱、物联网平台", "条件具备后开展",
       "中煤科工集团上海有限公司", "煤矿技术保障大模型，安全与效率双提升",
       ["能源与矿山", "煤矿", "知识图谱", "物联网"], ["大语言模型", "知识图谱", "物联网"], client="中煤科工集团"),

    mk(9, "自然堂集团（伽蓝集团）", "private", "上海", "retail", ["knowledge-base"], ["经营管理"],
       "自然堂集团联合观远数据打造问数GPT，统一口径缩短数据响应",
       "自然堂集团与观远数据合作开展问数GPT项目，将LLM与BI结合打造生成式数据分析产品，降低业务用数门槛、提升用数与分析效率，解决数据孤岛、统一数据口径，大幅缩短数据需求响应时间，助力数据驱动决策。",
       "美妆零售企业数据分散在多个系统，口径不一，业务响应慢。",
       "数据孤岛严重、口径不统一，数据需求响应时间长，决策敏捷性不足。",
       "将LLM与BI结合打造问数GPT生成式数据分析产品，以问答式分析统一口径、缩短响应；解放数据分析师转为企业知识训练师。",
       ["引入观远数据问数GPT平台", "整合多系统数据统一口径", "构建问答式数据分析体验", "赋能业务人员敏捷决策"],
       [{"label": "数据孤岛", "value": "统一数据口径，解决孤岛问题", "kind": "actual"},
        {"label": "响应时间", "value": "大幅缩短数据需求响应时间", "kind": "actual"},
        {"label": "决策敏捷", "value": "提升组织决策敏捷性", "kind": "actual"}],
       "决策敏捷性提升，量化ROI未披露",
       "需先做好数据治理与口径统一。",
       "零售消费、美妆等数据分散企业",
       "LLM+BI、数据治理与口径统一", "建议优先",
       "观远数据", "问数GPT，统一口径缩短响应",
       ["零售消费", "问数GPT", "LLM", "BI"], ["LLM", "BI"], client="自然堂集团"),

    mk(10, "中银消费金融有限公司", "soe", "上海", "finance", ["agent", "knowledge-base"], ["经营管理"],
       "中银消费金融TextToBIAgent，以指标知识库破解复杂数据查询",
       "中银消费金融基于澜码AskXBOT打造TextToBIAgent，提供数据查询、分析与可视化图表核心功能，降低查询门槛，让更多员工通过对话参与数据驱动决策；以【指标知识库】方案解决数据量大、字段多、结构复杂导致模型理解推理能力下降的问题。",
       "消费金融机构数据量大、字段多、结构复杂，业务人员取数门槛高。",
       "数据量与字段过多导致模型理解推理能力下降，输出效果与体验差。",
       "基于澜码企业级AIAgent平台AskXBOT构建TextToBIAgent，提供查询/分析/可视化；以指标知识库方案保障模型对复杂数据结构的理解。",
       ["引入澜码AskXBOT企业级Agent平台", "构建指标知识库保障语义理解", "提供对话式查询分析与可视化", "在业务团队推广自助用数"],
       [{"label": "取数效率", "value": "显著提升业务人员数据获取与分析效率", "kind": "actual"},
        {"label": "决策质量", "value": "优化决策质量，降低查询门槛", "kind": "actual"}],
       "业务效率与决策质量提升，量化ROI未披露",
       "复杂数据结构需指标知识库保障准确。",
       "金融、消费金融等数据复杂机构",
       "企业级Agent平台、指标知识库", "建议优先",
       "上海澜码信息技术有限公司", "TextToBIAgent，指标知识库破解复杂数据",
       ["金融", "TextToBI", "Agent", "指标知识库"], ["企业级AIAgent(AskXBOT)", "指标知识库"], client="中银消费金融"),
]

out_path = "scripts/extracted/dataanalysis-2024-cases.json"
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
