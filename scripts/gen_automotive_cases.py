# -*- coding: utf-8 -*-
"""生成《佐思汽研：汽车AI大模型TOP10分析报告》（2024）10个汽车AI大模型案例的完整 CaseStudy JSON。"""
import json
from datetime import datetime, timezone

TODAY = datetime.now(timezone.utc).isoformat()

IND = {
    "automotive": {"id": "industry-automotive", "code": "C36", "name": "汽车制造业", "displayName": "汽车", "slug": "automotive",
                   "description": "智能座舱、自动驾驶、研发与营销场景的 AI 实践。", "icon": "Car", "featured": True,
                   "standardVersion": "GB/T 4754-2017+1", "parentCode": "C"},
}

SCN = {
    "customer-service": {"id": "scene-customer-service", "name": "智能客服", "slug": "customer-service",
                         "description": "面向客户或员工的智能问答与工单辅助。", "synonyms": ["AI客服", "客服机器人", "在线客服"],
                         "icon": "MessagesSquare", "featured": True},
    "sales": {"id": "scene-sales", "name": "销售辅助", "slug": "sales",
              "description": "线索分析、销售跟进、沟通总结和方案生成。", "synonyms": ["销售助手", "商机分析", "汽车数字营销"],
              "icon": "TrendingUp", "featured": True},
    "agent": {"id": "scene-agent", "name": "Agent", "slug": "agent",
              "description": "能够规划、调用工具并执行多步任务的 AI 助手。", "synonyms": ["智能体", "AI Agent", "自动驾驶", "智能座舱"],
              "icon": "Bot", "featured": True},
    "ai-infra": {"id": "scene-ai-infra", "name": "算力基础设施与AI平台", "slug": "ai-infra",
                 "description": "算力调度、AI 平台与基础设施。", "synonyms": ["算力", "AI平台", "端侧部署"],
                 "icon": "Cpu", "featured": False},
}

REPORT_TITLE = "佐思汽研《汽车AI大模型TOP10分析报告》（2024）"
REPORT_PUBLISHER = "佐思汽研"


def scn(*slugs):
    return [SCN[s] for s in slugs]


def mk(idx, org_name, org_type, org_region, scenario_slugs, business_functions,
       title, summary, background, problem, solution, steps, results, roi, risks,
       suitable_for, prerequisites, priority, implementer, highlight, tags, model_stack):
    slug = f"case-auto-2024-{idx:02d}"
    src_id = f"src-{slug}-0"
    doc = {
        "id": slug, "slug": slug, "version": 1, "title": title,
        "organization": {"id": f"org-{slug}", "name": org_name, "size": "未披露", "region": org_region, "type": org_type},
        "industry": IND["automotive"], "scenarios": scn(*scenario_slugs),
        "businessFunctions": business_functions, "summary": summary, "background": background,
        "problem": problem, "solution": solution, "implementationSteps": steps,
        "duration": "未披露", "cost": "未披露", "results": results, "roi": roi, "risks": risks,
        "editorComment": {
            "suitableFor": suitable_for, "prerequisites": prerequisites, "priority": priority,
            "text": f"该案例来自{REPORT_PUBLISHER}评选的“汽车AI大模型TOP10”，由{implementer}研发并在汽车行业落地，"
                    f"展示了大模型在智能座舱、自动驾驶与车载语音等场景的技术能力，建议车企结合自研或采购方案参考。",
        },
        "implementers": [{"name": implementer, "role": "技术提供方"}],
        "outcomeStatus": "success", "contentStatus": "published", "confidence": "high",
        "sources": [{"id": src_id, "title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "type": "institution",
                     "publishedAt": "2024-07", "collectedAt": TODAY, "accessibility": "available",
                     "supports": ["TOP10分析报告", "技术 benchmark"]}],
        "featured": False, "views": 0, "publishedAt": TODAY, "updatedAt": TODAY,
        "implementationYear": 2024, "implementationTimePrecision": "year",
        "painPointTags": tags[:3], "highlight": highlight, "tags": tags, "modelStack": model_stack,
        "sourceReport": {"title": REPORT_TITLE, "publisher": REPORT_PUBLISHER, "year": 2024},
        "ctaText": "预约同款汽车AI大模型方案咨询",
    }
    return doc


cases = [
    mk(1, "北京百度网讯科技有限公司", "private", "北京", ["customer-service", "agent"], ["研发", "客服"],
       "百度文心大模型赋能汽车行业，吉利-百度·文心知识增强落地客服与自动驾驶",
       "百度文心大模型与吉利联合研发“知识增强的汽车行业大模型”，在智能客服知识库扩充、车载语音短答案生成、汽车领域知识库构建、维修手册内容分类、自动驾驶感知等任务上微调验证；多项任务人工测评可用率较基线显著提升。",
       "汽车领域专业语料分散、售后客服与自动驾驶长尾场景难覆盖，通用大模型在汽车垂直任务上效果不足。",
       "汽车垂直任务（客服知识库、语音答案、维修分类、自动驾驶感知）可用率低，长尾物体识别难。",
       "基于文心ERNIE3.0，在2300万条吉利无标注数据上预训练，结合有标签启动训练+伪标签自训练的半监督方案，并在客服、语音、维修、自动驾驶多任务微调验证。",
       ["联合吉利构建知识增强汽车行业大模型", "2300万条专业无标注数据预训练", "半监督自训练+有标签启动", "客服/语音/维修/自动驾驶多任务验证"],
       [{"label": "汽车售后智能客服知识库扩充可用率", "value": "62.92%（基线38.30%）", "improvement": "+24.62pp", "kind": "actual"},
        {"label": "车语音系统短答案生成可用率", "value": "83.95%（基线72.34%）", "improvement": "+11.61pp", "kind": "actual"},
        {"label": "维修手册内容分类可用率", "value": "87.29%", "kind": "actual"},
        {"label": "自动驾驶感知可用率", "value": "55.56%（基线38.30%）", "improvement": "+17.26pp", "kind": "actual"}],
       "垂直任务效果显著提升，量化ROI未披露",
       "汽车数据合规与标注成本高。",
       "主机厂、 Tier1 的汽车大模型落地",
       "汽车领域无标注语料、半监督训练框架", "建议优先",
       "百度", "文心大模型汽车多任务可用率显著提升",
       ["汽车", "文心大模型", "知识增强", "自动驾驶"], ["文心ERNIE3.0", "知识蒸馏"]),

    mk(2, "华为云计算技术有限公司", "private", "深圳", ["agent", "ai-infra"], ["研发"],
       "华为盘古大模型5.0自动驾驶开发平台，业务创新提效2倍",
       "华为云基于盘古大模型与ModelArts构建自动驾驶开发平台，提供数据生成、自动标注、模型训练、云端与虚实结合仿真等能力，预集成超25万场景库，将场景搭建从数天降至分钟级，业务创新提效2倍；并推出CloudMatrix架构与昇腾AI云服务。",
       "自动驾驶研发依赖海量数据与长周期仿真，纯实车测试场景搭建慢、算力需求高。",
       "场景搭建耗时长（数天）、训练算力中断风险高、数据/AI资源管理边界割裂。",
       "基于盘古大模型+ModelArts构建三层加速（数据/算法/算力）自动驾驶平台，预集成25万+场景库与测评指标，断点续训保障千卡训练不中断。",
       ["发布盘古大模型5.0（全系列/多模态/强思维）", "构建自动驾驶开发平台", "预集成25万+场景库", "昇腾AI云服务断点续训"],
       [{"label": "业务创新提效", "value": "提效2倍", "improvement": "2x", "kind": "actual"},
        {"label": "场景搭建", "value": "从数天降至分钟级", "kind": "actual"},
        {"label": "算力集群", "value": "单集群2000PFlops，断点恢复<10分钟", "kind": "actual"}],
       "研发效率显著提升，量化ROI未披露",
       "大模型训练成本高昂（千亿参数需超2000块昇腾910训练2月+）。",
       "车企、商用车自动驾驶研发团队",
       "盘古大模型、ModelArts、昇腾AI云", "条件具备后开展",
       "华为云", "盘古自动驾驶平台业务创新提效2倍",
       ["汽车", "盘古大模型", "自动驾驶", "仿真"], ["盘古大模型5.0", "ModelArts", "昇腾"]),

    mk(3, "科大讯飞股份有限公司", "private", "合肥", ["agent"], ["研发"],
       "科大讯飞星火大模型赋能汽车智能座舱，前装搭载超5700万辆",
       "科大讯飞星火大模型升级汽车智能座舱方案，支持全双工、多语种多方言免切换、多情感多模态超拟人交互，并能多模态感知驾驶人身体状态（疲劳、血压等）；语音交互已前装搭载5700万+辆汽车，汽车语音市占率NO.1，合作红旗、奇瑞、广汽、一汽等。",
       "车载语音交互需应对高噪、多方言、多语种与复杂座舱场景，传统方案体验受限。",
       "高噪场景识别差、多方言多语种切换难、座舱交互不够拟人。",
       "以星火大模型升级智能座舱，全双工多方言多语种交互、多模态状态感知、内外信源贯穿完成任务；语音识别在高噪与混叠场景达SOTA。",
       ["发布星火大模型4.0", "升级汽车智能座舱全双工交互", "多模态感知驾驶人状态", "与多家车企战略合作落地"],
       [{"label": "前装搭载", "value": "5700万+辆汽车", "kind": "actual"},
        {"label": "语音识别准确率", "value": "两人混叠91%、三人85%+；-5dB高噪90%+", "kind": "actual"},
        {"label": "汽车语音市占率", "value": "NO.1", "kind": "actual"},
        {"label": "出海语种", "value": "23+语种覆盖", "kind": "actual"}],
       "市占率领先，量化ROI未披露",
       "多语种方言覆盖需持续扩充。",
       "主机厂智能座舱与车载语音",
       "星火大模型、全链路语音技术", "建议优先",
       "科大讯飞", "前装搭载超5700万辆，汽车语音市占率NO.1",
       ["汽车", "星火大模型", "智能座舱", "车载语音"], ["讯飞星火4.0", "全链路语音"]),

    mk(4, "商汤集团股份有限公司", "private", "上海", ["agent", "ai-infra"], ["研发"],
       "商汤绝影车载多模态大模型，合作30+车企覆盖90+车型",
       "商汤绝影基于日日新大模型打造车载原生多模态大模型，在200TOPS+平台实现8B模型车端部署，首包延迟<300ms、推理40 tokens/s；已与本田、比亚迪、长城、红旗、奇瑞等30+车企合作，覆盖90+车型，并探索舱驾融合。",
       "智能汽车需要舱驾融合与端侧多模态能力，但车端算力有限、部署难。",
       "车端算力受限、多模态模型部署难、舱驾界限难打破。",
       "构建高性能异构计算平台HyperPPL，支持主流车载芯片与400+硬件算子，实现8B多模态模型车端部署与舱驾融合探索。",
       ["发布日日新5.0（MoE 6000亿）", "打造商汤绝影车载多模态大模型", "HyperPPL异构计算平台车端部署", "与30+车企合作落地"],
       [{"label": "合作车企", "value": "30+车企，覆盖90+车型", "kind": "actual"},
        {"label": "车端首包延迟", "value": "8B模型<300ms", "kind": "actual"},
        {"label": "推理速度", "value": "40 tokens/s", "kind": "actual"}],
       "车型覆盖广，量化ROI未披露",
       "车端算力与功耗约束严格。",
       "主机厂智能驾驶与智能座舱",
       "日日新大模型、异构计算平台", "建议优先",
       "商汤科技（绝影）", "合作30+车企覆盖90+车型",
       ["汽车", "商汤绝影", "多模态", "舱驾融合"], ["日日新SenseChat V5", "HyperPPL"]),

    mk(5, "腾讯科技（深圳）有限公司", "private", "深圳", ["sales", "agent"], ["营销", "研发"],
       "腾讯混元大模型赋能汽车数字营销与座舱，安全诱导拒答率提升20%",
       "腾讯混元大模型作为行业大模型服务底座，支持汽车数字营销（主流工具）与座舱垂域大模型（计划推出）；基于座舱垂域模型结合车辆感知与语音，提供场景化分析与智能决策，对安全诱导类问题拒答率提升20%，提升回答可信度。",
       "汽车营销与座舱交互需要可信、可控的内容生成与对话。",
       "营销内容生成、座舱对话易遇安全诱导与错误回答。",
       "以混元为底座支持API调用或专属精调；座舱垂域大模型结合感知/语音/行为分析提供场景化决策，强化学习提升拒答率。",
       ["混元支持内部600+应用验证", "布局汽车数字营销", "研发座舱垂域大模型", "强化学习提升安全拒答"],
       [{"label": "汽车数字营销", "value": "已成为汽车数字营销主流工具", "kind": "actual"},
        {"label": "安全诱导拒答率", "value": "提升20%", "improvement": "+20%", "kind": "actual"},
        {"label": "内部应用", "value": "支持腾讯内部600+应用", "kind": "actual"}],
       "营销与座舱价值显著，量化ROI未披露",
       "座舱垂域大模型仍处计划推出阶段。",
       "车企数字营销与智能座舱",
       "混元大模型、行业精调", "建议优先",
       "腾讯", "汽车数字营销主流工具，拒答率提升20%",
       ["汽车", "腾讯混元", "数字营销", "智能座舱"], ["腾讯混元大模型"]),

    mk(6, "特斯拉（Tesla）", "foreign", "美国", ["agent"], ["研发"],
       "特斯拉FSD V12端到端神经网络，控制代码减少10倍",
       "特斯拉FSD V12将城市街道驾驶堆栈升级为端到端神经网络，99%的决策由神经网络给出（视觉输入、控制输出），C++控制代码从2万多行减少到约2千行，是有史以来首个端到端AI自动驾驶系统。",
       "传统自动驾驶采用分模块（感知/决策/控制）设计，各模块算法独立、迭代慢。",
       "分模块设计复杂、规则代码多、难以端到端优化。",
       "以端到端神经网络替代规则代码，视觉输入直接输出控制；基于巨量视频数据与万块H100训练，逐步迭代BEV+Transformer、Occupancy Networks到端到端。",
       ["引入BEV+Transformer统一多摄像头视角", "提出Occupancy Networks空间占用", "演示并推送FSD V12端到端", "巨量视频数据训练端到端网络"],
       [{"label": "控制代码量", "value": "C++减少10倍（2万→约2千行）", "improvement": "-90%", "kind": "actual"},
        {"label": "决策方式", "value": "99%决策交由神经网络", "kind": "actual"},
        {"label": "架构", "value": "首个端到端AI自动驾驶系统", "kind": "actual"}],
       "端到端范式领先，量化ROI未披露",
       "端到端可解释性与安全验证挑战大。",
       "追求高阶自动驾驶的主机厂",
       "海量视频数据、超大规模算力", "条件具备后开展",
       "特斯拉", "FSD V12端到端，控制代码减少10倍",
       ["汽车", "特斯拉", "端到端", "FSD"], ["端到端神经网络", "BEV+Transformer"]),

    mk(7, "广州小鹏汽车科技有限公司", "private", "广州", ["agent"], ["研发"],
       "小鹏XGPT灵犀大模型，XNet/XPlanner/XBrain三模型驱动AI智驾",
       "小鹏AI天玑系统包含AI智驾与AI座舱，智驾端到端大模型由深度视觉感知XNet、规划大模型XPlanner、语言模型XBrain组成：XNet感知范围扩大2倍（约1.8个足球场）、识别50+目标；XBrain理解复杂场景与指令；XPlanner使驾驶更平稳，并融合智谱AI基座大模型。",
       "智能驾驶需要更强的感知、规划与语义理解能力，传统方案上限受限。",
       "感知范围窄、规划不够拟人、复杂场景理解不足。",
       "构建XNet+XPlanner+XBrain端到端智驾大模型，融合智谱AI基座与多模态模型，并引入大模型至车辆设计与代码开发提升研发效率。",
       ["发布AI天玑系统（AI智驾+AI座舱）", "构建XNet/XPlanner/XBrain三模型", "融合智谱AI基座大模型", "大模型引入研发设计提效"],
       [{"label": "感知范围", "value": "扩大2倍（约1.8个足球场）", "improvement": "2x", "kind": "actual"},
        {"label": "目标识别", "value": "识别50+种目标物", "kind": "actual"},
        {"label": "AI角色", "value": "AI小P/AI保镖/AI司机三角色覆盖全场景", "kind": "actual"}],
       "智驾体验提升，量化ROI未披露",
       "端到端模型训练与验证成本高。",
       "追求AI智驾体验的主机厂",
       "端到端智驾大模型、基座大模型", "建议优先",
       "小鹏汽车", "XGPT三模型驱动，感知范围扩大2倍",
       ["汽车", "小鹏", "端到端智驾", "智能座舱"], ["XGPT", "XNet", "XPlanner", "XBrain"]),

    mk(8, "毫末智行科技有限公司", "private", "北京", ["agent", "ai-infra"], ["研发"],
       "毫末智行DriveGPT雪湖·海若，训练成本降低100倍",
       "毫末智行发布自动驾驶生成式大模型DriveGPT（雪湖·海若），筛选超100亿帧互联网图片与480万段4DClips数据，引入多模态大模型实现“识别万物”；联合火山引擎打造智算中心MANA OASIS（67亿亿次/秒），百P数据筛选提速10倍，训练成本降低100倍。",
       "自动驾驶长尾场景多、数据规模大，训练成本高、效率低。",
       "数据筛选慢、训练成本高、通用感知与认知能力不足。",
       "构建视觉感知大模型建模4D空间，引入多模态大模型对齐语义空间；用蒸馏/Feature Map对齐提升车端小模型；联合火山引擎建智算中心降本提速。",
       ["发布DriveGPT 1.0/2.0雪湖·海若", "筛选100亿帧图片+480万段4DClips", "引入多模态大模型识别万物", "联合火山引擎建MANA OASIS智算中心"],
       [{"label": "训练数据", "value": "100亿帧图片+480万段4DClips", "kind": "actual"},
        {"label": "训练成本", "value": "降低100倍", "improvement": "-100x", "kind": "actual"},
        {"label": "智算性能", "value": "67亿亿次/秒，百P数据筛选提速10倍", "kind": "actual"}],
       "训练效率显著提升，量化ROI未披露",
       "端到端训练依赖超大规模算力。",
       "自动驾驶方案商与主机厂",
       "多模态大模型、智算中心", "条件具备后开展",
       "毫末智行", "DriveGPT训练成本降低100倍",
       ["汽车", "毫末", "DriveGPT", "自动驾驶"], ["DriveGPT", "MANA OASIS"]),

    mk(9, "苏州思必驰科技股份有限公司", "private", "苏州", ["agent"], ["研发"],
       "思必驰DFM-2中枢大模型上车，覆盖54个汽车品牌",
       "思必驰自研对话式语言大模型DFM-2，构建“1+N”中枢大模型架构（1个中枢+ N个专业模型），打通前端语言处理、用车场景与后端模型生态，从语音助手迈向语言智能+工具智能；已合作奔驰、长城、吉利、理想等，覆盖54个汽车品牌、160款国产车型、1000万+上车量。",
       "车载语音需从“指令式”升级为“智能化+工具化”的交互。",
       "语音指令式交互能力有限，难以完成复杂任务与跨域服务。",
       "发布DFM-2对话大模型，构建中枢大模型调度多个Agent（导航/车控/出行/本地生活），融合全链路语音与“1+N”模式上车。",
       ["发布DFM-2对话大模型", "构建1+N中枢大模型架构", "多Agent（导航/车控/出行）调度", "与多家车企签约量产上车"],
       [{"label": "汽车品牌覆盖", "value": "54个品牌，160款国产车型", "kind": "actual"},
        {"label": "上车量", "value": "1000万+", "kind": "actual"},
        {"label": "行业地位", "value": "国内语音供应商搭载量TOP3", "kind": "actual"}],
       "商业化能力强，量化ROI未披露",
       "需持续扩充专业模型与生态。",
       "主机厂与Tier1车载语音",
       "DFM-2、全链路语音、Agent调度", "建议优先",
       "思必驰", "覆盖54个汽车品牌，上车量1000万+",
       ["汽车", "思必驰", "车载语音", "Agent"], ["DFM-2", "中枢大模型"]),

    mk(10, "北京面壁智能科技有限责任公司", "private", "北京", ["agent", "ai-infra"], ["研发"],
       "面壁智能MiniCPM端侧多模态模型，OCRBench超越GPT-4V",
       "面壁智能打造高效端侧多模态模型MiniCPM系列，2.4B参数即具备GPT-3同等性能、知识密度提升约86倍；MiniCPM-Llama3-V2.5在OCRBench等榜单超越GPT-4V/Gemini Pro达SOTA，图像编码加速150倍，手机端语言解码3-4 token/s，适合车端等端侧部署。",
       "车载与边缘场景算力、功耗受限，需小参数高性能模型。",
       "端侧算力有限，大模型难以直接部署，多模态效率低。",
       "以端侧高效多模态模型MiniCPM系列，结合稀疏架构、NPU/CPU加速与编译优化，实现小参数高性能的车端等多端部署。",
       ["发布MiniCPM-2.4B高效端侧模型", "迭代MiniCPM-Llama3-V2.5多模态", "稀疏架构+端侧系统加速", "手机/车端多端部署"],
       [{"label": "OCRBench", "value": "超越GPT-4V/Gemini Pro达SOTA", "kind": "actual"},
        {"label": "图像编码加速", "value": "150倍加速", "improvement": "150x", "kind": "actual"},
        {"label": "端侧解码速度", "value": "手机端3-4 token/s", "kind": "actual"}],
       "端侧部署价值高，量化ROI未披露",
       "端侧模型能力上限低于云端大模型。",
       "车载、手机等端侧AI场景",
       "端侧多模态模型、稀疏架构", "建议优先",
       "面壁智能", "MiniCPM端侧多模态OCRBench SOTA",
       ["汽车", "面壁智能", "端侧模型", "多模态"], ["MiniCPM", "端侧多模态"]),
]

out_path = "scripts/extracted/automotive-2024-cases.json"
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
