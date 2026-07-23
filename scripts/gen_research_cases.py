# -*- coding: utf-8 -*-
"""从券商/机构研报中提取高价值企业 AI 落地案例，生成完整 CaseStudy JSON。

研报原文（已转 docx 并提取）位于 report/，文本在 report_ocr/。
本脚本把对网站价值高、且能对应到现有行业分类的案例，落成与现有 cases_json 一致的
完整结构（含完整 Industry/Scenario 对象），供 insert-cases.mjs 入库（按 title 去重）。
"""
import json
import os
import re
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_cases.json")

# ---------- 完整 catalog 对象（与 src/lib/catalog.ts 保持一致） ----------
INDUSTRIES = {
    "logistics": {
        "id": "logistics", "code": "G59", "name": "物流与仓储", "displayName": "物流与仓储",
        "slug": "logistics",
        "description": "快递、仓储、配送、供应链管理等物流体系，是 AI 调度、路径优化、无人化作业的核心应用场景。",
        "icon": "truck", "featured": True, "standardVersion": "v2026.07",
    },
    "manufacturing": {
        "id": "manufacturing", "code": "C", "name": "制造业", "displayName": "制造业",
        "slug": "manufacturing",
        "description": "覆盖原材料加工到成品制造的工业体系，是 AI 质检、智能排产、设备预测性维护、数字孪生的高价值落地场景。",
        "icon": "factory", "featured": True, "standardVersion": "v2026.07",
    },
    "construction": {
        "id": "construction", "code": "E47", "name": "建筑建材", "displayName": "建筑建材",
        "slug": "construction",
        "description": "涵盖房屋建筑、土木工程、装饰装修与建材流通，是 AI 在 BIM、施工安全、造价估算与供应链协同中的典型落地行业。",
        "icon": "building-2", "featured": False, "standardVersion": "v2026.07",
    },
}
SCENARIOS = {
    "agent": {"id": "agent", "name": "智能体", "slug": "agent",
              "description": "以 LLM 为大脑、能自主规划与调用工具完成多步任务的 AI 系统，常见于客服、运营、研发等岗位的“数字员工”。",
              "synonyms": ["AI Agent", "自主智能体", "Agentic AI", "智能体应用"], "icon": "bot", "featured": True},
    "ai-infra": {"id": "ai-infra", "name": "AI 基础设施", "slug": "ai-infra",
                 "description": "支撑 AI 应用运行的算力、模型、数据、向量库与编排平台等底层能力。",
                 "synonyms": ["AI 底座", "AI Infra", "算力", "模型服务"], "icon": "server", "featured": False},
    "workflow": {"id": "workflow", "name": "工作流自动化", "slug": "workflow",
                 "description": "用 AI 串联审批、派单、对账、报告等重复性业务流程，实现端到端自动化。",
                 "synonyms": ["流程自动化", "RPA", "业务流程", "自动化工作流"], "icon": "workflow", "featured": True},
    "quality-inspection": {"id": "quality-inspection", "name": "AI 质检", "slug": "quality-inspection",
                           "description": "用计算机视觉与传感数据对产品外观、尺寸、缺陷进行自动检测与判定，替代人工目检。",
                           "synonyms": ["机器视觉", "缺陷检测", "工业视觉", "智能质检"], "icon": "scan-eye", "featured": True},
    "content-generation": {"id": "content-generation", "name": "内容生成", "slug": "content-generation",
                           "description": "用 AIGC 生成文案、图文、视频、代码等内容，广泛用于营销、设计与研发。",
                           "synonyms": ["AIGC", "文生图", "文生视频", "智能写作"], "icon": "sparkles", "featured": True},
}
BUSINESS_FUNCTIONS = {"战略与运营", "财务与融资", "市场与销售", "客户成功", "供应链/物流",
                      "研发与设计", "生产制造", "人力资源", "法务与合规", "信息技术"}
VALID_OUTCOME = {"success", "partial", "failure", "undisclosed"}
VALID_CONF = {"high", "medium", "pending"}


def slugify(title):
    s = re.sub(r"[^\w\u4e00-\u9fff]+", "-", title).strip("-").lower()
    return s[:80]


def dedup_vector(text):
    # 确定性 40 维向量（与现有脚本同算法），用于相似度去重参考
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
    record = {
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
    return record


CASES = [
    # ============ 1. 圆通速递 AI 全栈落地 ============
    {
        "id": "case-yto-ai-stack-2026",
        "slug": "case-yto-ai-stack-2026",
        "title": "圆通速递AI全栈落地：100+智能体渗透全业务，年省十亿级成本",
        "organization": {"id": "org-yto", "name": "圆通速递股份有限公司", "size": "extraLarge", "region": "上海", "type": "private"},
        "industry": "logistics",
        "scenarios": ["agent", "ai-infra", "workflow", "quality-inspection"],
        "businessFunctions": ["供应链/物流", "战略与运营"],
        "summary": "圆通速递于2026年7月9日发布AI应用成果，以数字孪生、机器视觉、智能体、AI助手、数字员工、AI编程六大方向全栈落地AI；智能体超100个深度嵌入全业务环节，2026年至今累计Token吞吐量超2.6万亿，创造十亿元量级成本节约，实现从总部到一线小哥的全域渗透。",
        "background": "圆通速递（600233）创立于2000年，总部位于上海，是国内加盟制快递龙头之一，截至2024年底拥有约55万名员工，并拥有“圆通速递”（600233）与“圆通国际快递”（06123.HK）两家上市公司。在AI浪潮下，快递物流行业面临持续的降本增效与全链路智能化压力。",
        "problem": "快递物流链路长、环节多（揽收、中转、运输、派送、客服、管理），是典型的劳动密集型行业，人力与运营成本压力巨大；传统信息化系统难以应对海量非结构化数据与实时调度决策，亟需以AI重构全业务流。",
        "solution": "圆通发布“AI应用”六大方向：①数字孪生——构建全网数字映射用于仿真与调度；②机器视觉——用于分拣、安检、破损识别；③智能体（Agent）——落地超100个，嵌入揽收、中转、路由、客服等核心环节；④AI助手——面向管理与一线员工的智能问答；⑤数字员工——替代重复性后台作业；⑥AI编程——提升内部研发效率。形成“总部管理中枢—中转枢纽—加盟网点—一线小哥”全域全层级渗透。",
        "implementationSteps": [
            "2026年7月9日举办AI应用发布会，官方披露六大方向落地成果",
            "构建统一AI底座（算力+模型+数据），支撑智能体与AI编程",
            "机器视觉与数字孪生先行落地中转、分拣与安全环节",
            "智能体规模化嵌入揽收、路由、客服等核心业务，超100个上线",
            "AI助手与数字员工覆盖总部与一线，系统性提升人效",
        ],
        "duration": "持续迭代中（2026年集中发布）",
        "cost": "具体投入未披露；官方称已创造十亿元量级成本节约",
        "results": [
            {"label": "落地智能体数量", "value": "100+", "kind": "actual"},
            {"label": "累计Token吞吐量（2026年至今）", "value": "2.6万亿", "kind": "actual"},
            {"label": "成本节约规模", "value": "十亿元量级", "kind": "actual"},
            {"label": "AI渗透层级", "value": "总部→中转→网点→小哥 全域", "kind": "actual"},
        ],
        "roi": "官方披露2026年至今累计Token吞吐量超2.6万亿，创造十亿元量级成本节约，AI已渗透总部管理中枢、中转枢纽、加盟网点与一线快递小哥全层级，规模化降本增效显著。",
        "risks": "大模型幻觉与关键决策可靠性需持续治理；加盟制体系下各网点AI能力落地不均衡；收寄件人信息的数据安全与隐私合规要求高；算力与Token成本随规模快速攀升。",
        "editorComment": {
            "suitableFor": "大型快递物流、仓储配送企业，以及多层级加盟/直营网络的运营方",
            "prerequisites": "具备较完整的信息化底座与统一数据中台；有稳定算力与模型供给；总部有推动全链路数字化的组织力",
            "priority": "建议优先",
            "text": "圆通案例展示了AI在超大规模物流网络的系统化落地路径——以智能体+AI底座为核心，从机器视觉等单点切入再到全业务渗透，值得物流与供应链企业重点参考。",
        },
        "implementers": [{"name": "圆通速递AI团队（自建）", "role": "其他", "website": "https://www.yto.net.cn"}],
        "outcomeStatus": "success",
        "confidence": "high",
        "sources": [
            {"id": "src-yto-hy", "title": "交通运输行业周报：圆通发布AI应用，油运再受地缘扰动", "publisher": "华源证券",
             "type": "institution", "url": "", "publishedAt": "2026-07-13", "collectedAt": "2026-07-23",
             "accessibility": "available", "supports": ["solution", "results", "roi"]},
            {"id": "src-yto-official", "title": "圆通速递AI应用发布会", "publisher": "圆通速递",
             "type": "company", "url": "https://www.yto.net.cn", "publishedAt": "2026-07-09",
             "collectedAt": "2026-07-23", "accessibility": "available", "supports": ["summary", "results"]},
        ],
        "featured": True,
        "publishedAt": "2026-07-13",
        "implementationYear": 2026,
        "implementationTimePrecision": "month",
        "techPath": ["大模型", "智能体", "机器视觉", "数字孪生"],
        "modelStack": ["自研+第三方大模型底座（未披露具体模型）"],
        "sourceReport": {"title": "交通运输行业周报", "publisher": "华源证券", "year": 2026},
        "tags": ["物流", "智能体", "机器视觉", "数字员工", "降本增效"],
        "seo": {"metaTitle": "圆通速递AI全栈落地案例：100+智能体、十亿级降本",
                "metaDescription": "圆通速递2026年AI应用成果：智能体超100个、Token吞吐量超2.6万亿、成本节约十亿元量级，覆盖物流全业务。",
                "keywords": ["圆通速递", "物流AI", "智能体", "机器视觉", "降本增效"]},
    },

    # ============ 2. 觅睿科技 AI 安防 + 云服务 ============
    {
        "id": "case-mirui-ai-security-2026",
        "slug": "case-mirui-ai-security-2026",
        "title": "觅睿科技：AI视觉算法+云边端协同，赋能民用智能安防",
        "organization": {"id": "org-mirui", "name": "杭州觅睿科技股份有限公司", "size": "medium", "region": "浙江杭州", "type": "sme"},
        "industry": "manufacturing",
        "scenarios": ["quality-inspection", "ai-infra"],
        "businessFunctions": ["研发与设计", "信息技术"],
        "summary": "觅睿科技聚焦民用智能安防与视频AIoT，将自研AI算法部署于云/边/端，实现人形、车形、包裹、婴儿啼哭、宠物、老人跌倒等智能检测；其AI增值服务（云存储+AI）2025年收入达1.37亿元、同比+100.9%，成为高毛利增长曲线。",
        "background": "杭州觅睿科技股份有限公司成立于2017年2月，总部位于杭州滨江，2026年3月9日登陆北交所（920036）；约568名员工、研发人员占比超50%，拥有203项专利与图像/语音识别核心技术，主营硬件+软件+云服务+AI一体的智能网络摄像机及物联网视频产品。",
        "problem": "民用安防场景碎片化、环境复杂，传统监控“看得见”却“看不懂”；用户对入侵、跌倒、包裹等异常主动预警与远程看护需求强烈，同时设备端算力受限，需兼顾低功耗与低时延。",
        "solution": "自研图像/语音AI算法，采用云-边-端协同部署：设备端低功耗实时检测，边缘端本地推理，云端提供AI分析与云存储；构建“AI看护”“包裹检测”“跌倒检测”等能力，并打包为AI增值订阅服务（云存储+AI）。",
        "implementationSteps": [
            "2017年成立后持续自研图像/语音识别核心算法",
            "构建云-边-端协同架构，算法分别部署于设备端/边缘/云",
            "推出AI增值服务（云存储+AI），2025年收入1.37亿元",
            "持有203项专利、研发人员占比超50%，持续迭代模型",
            "2026年3月北交所上市，加速AIoT产品化落地",
        ],
        "duration": "持续研发（2017年至今），AI增值服务2025年规模化",
        "cost": "未披露",
        "results": [
            {"label": "AI增值服务收入（2025）", "value": "1.37亿元", "improvement": "+100.9% YoY", "kind": "actual"},
            {"label": "专利总数", "value": "203项", "kind": "actual"},
            {"label": "研发人员占比", "value": "超50%", "kind": "actual"},
            {"label": "员工规模", "value": "约568人", "kind": "actual"},
        ],
        "roi": "AI增值服务（云存储+AI）2025年收入1.37亿元、同比+100.9%，成为高毛利增长曲线；云边端协同在保障低功耗与实时性的同时提升产品溢价与用户黏性。",
        "risks": "智能硬件赛道竞争激烈（华为、小米、萤石等）；云端AI服务受数据与隐私监管约束；低端设备算力限制复杂模型部署；海外市场对合规与本地化要求高。",
        "editorComment": {
            "suitableFor": "智能硬件/安防设备制造商、物联网视频企业",
            "prerequisites": "具备算法自研能力与云边端工程化能力；有稳定硬件出货量与用户基数以沉淀订阅",
            "priority": "条件具备后开展",
            "text": "觅睿以“硬件+AI+云订阅”形成差异化，AI增值服务高增长验证了“设备即入口、AI即服务”的商业模式，适合有硬件基础的AIoT企业参考。",
        },
        "implementers": [{"name": "觅睿科技（自建AI团队）", "role": "其他"}],
        "outcomeStatus": "success",
        "confidence": "high",
        "sources": [
            {"id": "src-mirui-dw", "title": "觅睿科技（920036）：安防硬软一体化，AI应用潜力大", "publisher": "东吴证券",
             "type": "institution", "url": "", "publishedAt": "2026-07-17", "collectedAt": "2026-07-23",
             "accessibility": "available", "supports": ["background", "results", "solution"]},
            {"id": "src-mirui-ipo", "title": "觅睿科技招股书及北交所上市资料", "publisher": "觅睿科技",
             "type": "company", "url": "", "publishedAt": "2026-03-09", "collectedAt": "2026-07-23",
             "accessibility": "available", "supports": ["background", "results"]},
        ],
        "featured": False,
        "publishedAt": "2026-07-17",
        "implementationYear": 2025,
        "implementationTimePrecision": "year",
        "techPath": ["计算机视觉", "云边端协同", "语音识别"],
        "modelStack": ["自研图像/语音识别模型（未披露基座）"],
        "sourceReport": {"title": "觅睿科技（920036）：安防硬软一体化，AI应用潜力大", "publisher": "东吴证券", "year": 2026},
        "tags": ["智能安防", "AIoT", "机器视觉", "云边端", "增值服务"],
        "seo": {"metaTitle": "觅睿科技AI安防案例：云边端协同+AI增值服务翻倍",
                "metaDescription": "觅睿科技将AI视觉算法部署于云边端，AI增值服务2025年收入1.37亿元、同比+100.9%，赋能民用智能安防。",
                "keywords": ["觅睿科技", "智能安防", "AIoT", "机器视觉", "云边端"]},
    },

    # ============ 3. Houzz Pro AI 赋能建筑与设计 ============
    {
        "id": "case-houzz-pro-construction-2026",
        "slug": "case-houzz-pro-construction-2026",
        "title": "Houzz Pro：AI 重塑建筑与设计工作流，承包商周省3小时",
        "organization": {"id": "org-houzz", "name": "Houzz", "size": "large", "region": "美国", "type": "foreign"},
        "industry": "construction",
        "scenarios": ["workflow", "content-generation"],
        "businessFunctions": ["战略与运营", "市场与销售"],
        "summary": "Houzz 2026年发布《英国建筑与设计领域AI应用状况报告》：89%设计与建筑专业人士用AI处理行政任务，平均每周节省约3小时；承包商年均财务收益约£33,000，设计公司约£13,000。其SaaS产品Houzz Pro以AI驱动项目管理与营销。",
        "background": "Houzz由Adi Tatarko与Alon Cohen于2009年创立，总部位于美国加州帕洛阿尔托，是聚焦家居装修与室内设计的在线平台，用户超4000万；其SaaS产品Houzz Pro为建筑与设计专业人士提供项目管理与营销软件，并内置AI能力。",
        "problem": "建筑与设计行业专业人士大量时间消耗在报价、日程、文档、营销等行政事务上，而非核心设计工作；中小承包商缺乏专业工具，获客与项目管理效率低。",
        "solution": "Houzz Pro以AI能力嵌入工作流：自动生成项目方案/报价、智能日程与文档、营销内容生成、客户沟通辅助；并通过年度调研持续量化AI对行业人效与收益的提振。",
        "implementationSteps": [
            "2009年创立Houzz平台，沉淀设计师/承包商社区",
            "推出Houzz Pro SaaS，整合项目管理与营销",
            "叠加AI能力（方案/报价/内容生成、客户沟通）",
            "2026年发布《英国建筑与设计领域AI应用状况报告》量化成效",
        ],
        "duration": "持续（Houzz Pro AI能力近年叠加）",
        "cost": "SaaS订阅制（未披露具体金额）",
        "results": [
            {"label": "用AI处理行政任务的专业人士占比", "value": "89%", "kind": "actual"},
            {"label": "平均每周节省时间", "value": "约3小时", "kind": "actual"},
            {"label": "承包商年均财务收益", "value": "约£33,000", "kind": "actual"},
            {"label": "设计公司年均财务收益", "value": "约£13,000", "kind": "actual"},
        ],
        "roi": "调研显示AI为承包商带来年均约£33,000、设计公司约£13,000的财务收益，平均每周节省约3小时行政时间，显著释放核心设计产能。",
        "risks": "AI生成内容/报价的准确性需人工复核；客户数据隐私与信息保护要求高；中小从业者AI使用门槛与培训成本；平台依赖带来的议价与锁定风险。",
        "editorComment": {
            "suitableFor": "建筑设计事务所、装修承包商、家居建材服务商",
            "prerequisites": "有一定数字化基础；客户沟通与项目管理流程可线上化",
            "priority": "条件具备后开展",
            "text": "Houzz Pro代表“AI+垂直SaaS”在建筑设计行业的落地：以行政与营销场景切入、用调研数据量化价值，适合面向专业服务者的SaaS与平台型企业参考。",
        },
        "implementers": [{"name": "Houzz（自建产品）", "role": "其他", "website": "https://www.houzz.com"}],
        "outcomeStatus": "success",
        "confidence": "high",
        "sources": [
            {"id": "src-houzz-report", "title": "2026年英国建筑与设计领域AI应用状况报告", "publisher": "Houzz",
             "type": "company", "url": "https://www.houzz.com", "publishedAt": "2026-07-16", "collectedAt": "2026-07-23",
             "accessibility": "available", "supports": ["summary", "results", "roi"]},
        ],
        "featured": False,
        "publishedAt": "2026-07-16",
        "implementationYear": 2026,
        "implementationTimePrecision": "month",
        "techPath": ["大模型", "内容生成", "工作流自动化"],
        "modelStack": ["未披露具体模型"],
        "sourceReport": {"title": "2026年英国建筑与设计领域AI应用状况报告", "publisher": "Houzz", "year": 2026},
        "tags": ["建筑", "设计", "SaaS", "工作流", "营销内容"],
        "seo": {"metaTitle": "Houzz Pro AI建筑案例：承包商周省3小时、年收益£33k",
                "metaDescription": "Houzz Pro以AI重塑建筑与设计工作流，89%专业人士用AI处理行政，承包商年均收益约£33,000。",
                "keywords": ["Houzz Pro", "建筑AI", "设计SaaS", "工作流自动化"]},
    },
]


def main():
    out = []
    for c in CASES:
        rec = build(c)
        out.append(rec)
        print(f"  [OK] {rec['title']}  (slug={rec['slug']}, industry={rec['industry']['id']}, scenarios={[s['id'] for s in rec['scenarios']]})")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n已生成 {len(out)} 条案例 -> {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
