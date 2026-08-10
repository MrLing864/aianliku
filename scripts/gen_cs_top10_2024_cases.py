# -*- coding: utf-8 -*-
"""从《2024中国“大模型+智能客服”最佳实践案例TOP10》（沙丘社区）提取 10 个案例。

源文本：report_ocr/2024中国“大模型+智能客服”最佳实践案例TOP10.txt
入库：node scripts/insert-cases.mjs cases_json/gen_cs_top10_2024_cases.json
"""
import json
import os
from case_common import build, INDUSTRIES, SCENARIOS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_cs_top10_2024_cases.json")

SRC = {
    "id": "src-cs-top10-2024", "title": "2024中国“大模型+智能客服”最佳实践案例TOP10",
    "publisher": "沙丘社区", "type": "institution", "url": "https://www.shaqiu.cn",
    "publishedAt": "2024-05-31", "collectedAt": "2026-07-23", "accessibility": "available",
    "supports": ["summary", "solution", "results", "roi"],
}
SR = {"title": "2024中国“大模型+智能客服”最佳实践案例TOP10", "publisher": "沙丘社区", "year": 2024}
PUB = "2024-05-31"
YEAR = 2024

RISK = "大模型存在幻觉与数据安全风险，直接对客场景需严格偏见监测与人工兜底；RAG/Fine-Tuning 路径选择需结合业务动态更新与合规要求；自建方案易过时、成本高，中小企业宜优先采购成熟产品。"


def mk(slug, title, org, ind, scns, bf, summary, background, problem, solution, steps,
       results, roi, tech, models, tags, featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": ind, "scenarios": scns, "businessFunctions": bf, "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": "持续迭代（2024年落地）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": "与案例方同行业、有相似客服/知识服务痛点的企业",
            "prerequisites": "具备较完整的知识库与客服渠道；有明确的大模型落地场景；有推动 AI 落地的组织意愿",
            "priority": "建议优先",
            "text": f"{org['name']}的「{title}」入选沙丘社区《2024中国“大模型+智能客服”最佳实践案例TOP10》，在智能客服领域具备示范意义，建议优先参考。",
        },
        "implementers": [{"name": f"{org['name']}（联合技术供应商）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": "high",
        "sources": [dict(SRC)], "featured": featured,
        "publishedAt": PUB, "implementationYear": YEAR, "implementationTimePrecision": "month",
        "techPath": tech, "modelStack": models, "sourceReport": dict(SR), "tags": tags, "seo": {
            "metaTitle": f"{title} - 大模型+智能客服最佳实践",
            "metaDescription": summary[:80], "keywords": tags,
        },
    }


CASES = [
    mk("cs-top10-bayer-vrep", "拜耳（中国）虚拟医药代表平台建设项目",
       {"id": "org-bayer", "name": "拜耳（中国）", "size": "large", "region": "德国/中国", "type": "foreign"},
       "healthcare", ["customer-service", "sales"], ["市场与销售", "客户成功"],
       "沃丰科技为拜耳（中国）虚拟医药代表平台提供以 AI 大模型为支撑的智能客服产品，完成企业微信渠道智能虚拟代表 AI 赋能，打造影像学院专家社群智能客服系统，助力实现双打模式增长、医生认可度提升、全年准入近百家医院。",
       "拜耳（中国）医药代表需高频服务医生专家社群，传统线下代表单打模式增长有限，学术精细化运营与私域运营布局需求强。",
       "医药代表覆盖广度与学术运营效率受限，私域运营与合规培训依赖人工，增长乏力。",
       "以 AI 客服产品赋能企业微信渠道的智能虚拟代表，构建影像学院专家社群智能客服系统，通过大模型实现高效知识整理、知识培训与合规培训，赋能线上线下推广与私域运营。",
       ["搭建虚拟医药代表平台", "企业微信智能虚拟代表", "专家社群智能客服系统", "线上线下私域运营"],
       [{"label": "双打模式增长", "value": "远高于线下代表单打及行业均值", "kind": "actual"},
        {"label": "医院准入", "value": "全年近百家", "kind": "actual"}],
       "双打模式增长率远高于线下代表单打及行业均值，学术精细化运营医生认可度高，全年准入近百家医院并形成学科圈持续推进其他产品。",
       ["大模型", "智能客服"], ["沃丰科技 AI 客服大模型"],
       ["医疗", "虚拟代表", "智能客服"], featured=True),

    mk("cs-top10-hbtelecom-diting", "湖北电信“谛听”客服智能体创新项目",
       {"id": "org-hbtelecom", "name": "湖北电信", "size": "large", "region": "湖北", "type": "soe"},
       "telecom", ["agent", "customer-service"], ["客户成功", "信息技术"],
       "2024年初湖北电信联合中电信人工智能科技启动“谛听”客服智能体创新项目，在万号客服接听人工来话的长尾问题场景中采用大小模型协同、多智能体混编技术，提升意图命中与关键实体精准率，提升一解率并压降系统内操作时长。",
       "湖北电信 10000 号客服每天面对大量人工来话，长尾问题面广、答案多样，传统 NLU 意图识别能力有限。",
       "长尾问题处理难、意图识别准确率不足，坐席压力大、一解率低、操作时长偏长。",
       "采用大小模型协同、多智能体混编技术，在长尾问题场景中提升意图命中与关键实体精准率，进而提升客户诉求一解率、压降系统内操作时长、提高满意率并缓解坐席压力。",
       ["启动谛听客服智能体项目", "大小模型协同+多智能体混编", "长尾问题意图识别", "一解率与满意度提升"],
       [{"label": "意图识别准确率", "value": "显著提升", "kind": "actual"},
        {"label": "系统内操作时长", "value": "有效压降", "kind": "actual"}],
       "大小模型协同兼顾响应及时性与理解深度，长尾问题处理效率提升，缓解客服人员压力，为多业务复杂客服场景提供参考。",
       ["大模型", "智能体", "多智能体"], ["中电信人工智能科技大模型底座"],
       ["通信", "智能体", "客服"], featured=False),

    mk("cs-top10-heilongjiang-gov", "黑龙江数字政府项目",
       {"id": "org-hljgov", "name": "黑龙江省政府", "size": "large", "region": "黑龙江", "type": "government"},
       "government", ["customer-service", "agent"], ["战略与运营", "客户成功"],
       "黑龙江省政府联合中国移动打造“更便捷、更贴心、更智能”的一站式智能客服，基于“政务大模型-信息场-应用”体系与九天·海算政务大模型，使政务办理更协同高效，让数据多跑路、民众少跑腿。",
       "黑龙江数字政府建设需提升市民政务办事体验，传统政务服务流程繁琐、等待时间长。",
       "政务咨询复杂、市民办事效率低，政务信息安全性与可信性要求高。",
       "创新性使用“政务大模型-信息场-应用”政务服务体系，基于九天·海算政务大模型构建一网通办智能客服，兼顾市民办事效率与政务信息安全性。",
       ["构建政务大模型-信息场-应用体系", "九天·海算政务大模型", "一网通办智能客服", "复杂问题精准应答"],
       [{"label": "复杂问题准确率", "value": "提升45%", "improvement": "+45%", "kind": "actual"},
        {"label": "答案有效性", "value": "提升17%", "improvement": "+17%", "kind": "actual"},
        {"label": "拟人化程度", "value": "提升24%", "improvement": "+24%", "kind": "actual"}],
       "一网通办智能客服咨询复杂问题准确率提升45%、答案有效性提升17%、拟人化程度提升24%，让数据多跑路、民众少跑腿。",
       ["大模型", "智能客服", "智能体"], ["中国移动 九天·海算政务大模型"],
       ["政务", "数字政府", "一网通办"], featured=False),

    mk("cs-top10-henan-telecom", "中国电信河南公司智能客服助理项目",
       {"id": "org-henan-telecom", "name": "中国电信河南公司", "size": "large", "region": "河南", "type": "soe"},
       "telecom", ["customer-service", "workflow"], ["客户成功", "信息技术"],
       "河南电信引入智能客服助理支撑省内10000号客服坐席，大模型识别客服与用户对话内容并提供实时智能辅助，显著提升服务效率与质量，并通过实时沟通监控降低客户投诉率。",
       "河南电信 10000 号客服坐席服务量巨大，需实时辅助提升服务质量与效率。",
       "客服响应依赖经验、实时辅助不足，服务延误导致客户流失并影响品牌形象。",
       "引入智能客服助理，大模型实时识别对话内容，为客服提供智能辅助功能（意图识别、情绪监控、话术推荐），帮助快速解决用户问题并降低投诉率。",
       ["引入智能客服助理", "对话内容实时识别", "意图+情绪智能辅助", "实时沟通监控"],
       [{"label": "服务效率与质量", "value": "显著提升", "kind": "actual"},
        {"label": "客户投诉率", "value": "降低", "kind": "actual"}],
       "显著降低因服务延误导致的客户流失、减少人力成本，改善员工工作条件并提高保留率，提升品牌形象。",
       ["大模型", "智能客服", "工作流"], ["科大国创大模型"],
       ["通信", "客服助理", "智能客服"], featured=False),

    mk("cs-top10-lenovo-zhixiaoka", "联想智能问答机器人“助小咖”",
       {"id": "org-lenovo", "name": "联想", "size": "large", "region": "中国", "type": "private"},
       "software-internet", ["knowledge-base", "agent"], ["信息技术", "人力资源"],
       "联想“助小咖”基于生成式与分析式模型提供企业级交互机器人服务，支持知识问答、政策查询、多模态接入、自动化任务执行、多机器人管理，已在 IT、HR、财务、行政、差旅、工厂物料、云平台、销售等二十多种渠道为员工提供支撑。",
       "联想内部员工在 IT、HR、财务等多领域存在大量重复问答与文档查找需求。",
       "分散的本地文档（PDF/Word/PPT/Excel）查找困难，多领域智能助手服务难以统一。",
       "基于生成式+分析式模型打造企业级交互机器人，支持多语言文本/语音与多模态接入，理解本地多格式文档并提供快速信息查找，支持界面调整提示工程打造专属“场景助手”。",
       ["部署助小咖交互机器人", "知识问答/政策查询", "多格式文档理解", "场景助手+提示工程"],
       [{"label": "覆盖渠道", "value": "二十多种", "kind": "actual"},
        {"label": "员工效率与体验", "value": "极大提升", "kind": "actual"}],
       "在 IT 运维、HR、行政、财务、采购等多领域提供智能助手，极大提升员工工作效率与体验，降低文档查找成本。",
       ["大模型", "知识库", "智能体"], ["联想企业级大模型"],
       ["互联网", "智能问答", "知识库"], featured=False),

    mk("cs-top10-futian-xiaofu", "福田政务智慧助手“小福”",
       {"id": "org-futian", "name": "深圳市福田区政务服务数据管理局", "size": "medium", "region": "深圳", "type": "government"},
       "government", ["customer-service", "workflow"], ["战略与运营", "客户成功"],
       "福田区政务服务数据管理局基于盘古政务大模型上线智慧助手“小福”，针对高频复杂事项提供实时问答互动、智能秒批、政策推送，AI 精准抓取对话字段、将居民口语转化为政府办事语言，提高政务办理效率。",
       "福田区政务办理事项高频且复杂，传统“一网通办”模式手续繁琐、等待时间长。",
       "居民口语化咨询难以被准确理解，政务办理效率低、体验差。",
       "基于盘古政务大模型上线“小福”，提供实时问答、智能秒批、政策推送，AI 精准抓取交流字段并理解居民意图，将口语转化为政府办事语言，改变传统一网通办模式。",
       ["上线小福智慧助手", "盘古政务大模型", "实时问答+智能秒批", "口语-办事语言转化"],
       [{"label": "政务办理效率", "value": "提高、等待缩短", "kind": "actual"},
        {"label": "居民服务体验", "value": "便捷高效", "kind": "actual"}],
       "减少繁琐手续与等待时间，提升政府服务水平与居民信任满意度，为其他政府部门智能化政务提供借鉴。",
       ["大模型", "智能客服", "工作流"], ["华为云 盘古政务大模型"],
       ["政务", "智能助手", "秒批"], featured=False),

    mk("cs-top10-vision-tsim", "维音 AIGC+客服数智化培训案例",
       {"id": "org-vision", "name": "维音", "size": "large", "region": "中国", "type": "private"},
       "software-internet", ["content-generation", "customer-service"], ["人力资源", "客户成功"],
       "维音基于大模型服务平台 VisionGAI 升级 AI 客服培训系统 VisionTSIM，支持智能生成陪练素材、上传多格式文件自动提取并生成陪练课程、基于行业模板库快捷搭建课程，已在全国运营中心规模化应用。",
       "维音作为呼叫中心外包商，客服培训（新人/大促/新品）是管理重要环节，传统 1V1 带教成本高。",
       "客服培训受时空限制、依赖人工带教，难以规模化与个性化。",
       "基于 VisionGAI 升级 VisionTSIM，用大模型智能生成陪练素材、自动提取多格式文件生成课程、模板库快捷搭建，以 NLP+情绪识别+大模型模拟服务情境，打造生成式智能陪练。",
       ["部署 VisionGAI 平台", "升级 VisionTSIM", "智能陪练素材生成", "多格式文件自动萃取"],
       [{"label": "培训形态", "value": "无需人工1V1带教、规模化", "kind": "actual"}],
       "打破培训时空限制，每位客服拥有量身定制的金牌教练；以二十余行业话术精调，打造适用于各行业的生成式智能陪练课程。",
       ["AIGC", "内容生成", "智能客服"], ["维音 VisionGAI 大模型"],
       ["互联网", "客服培训", "AIGC"], featured=False),

    mk("cs-top10-xdf-zhike", "新东方：AIGC 让智能客服更智能",
       {"id": "org-xdf", "name": "新东方", "size": "large", "region": "中国", "type": "private"},
       "education", ["customer-service", "knowledge-base"], ["客户成功", "市场与销售"],
       "新东方与智齿科技合作，借助“AIGC+智能客服”融合能力，提升上课咨询场景（售前支付、课程内容、售后退费续费）的直接回答率与学员满意度，缓解人工客服压力。",
       "新东方教培客服每天收到大量上课场景咨询（支付、课程、退费续费），人工压力大。",
       "咨询量大、直接回答率不足，人工客服难以覆盖全部高峰咨询。",
       "采用“双库模式”：在线咨询优先启用智齿科技知识库，无法作答时再启动 AIGC 资料库，保证答案准确度；上传原始材料即自动提炼 FAQ 并扩展相似问，降低知识库冷启动与运维成本。",
       ["合作智齿科技", "双库模式（知识库+AIGC）", "自动提炼FAQ扩展相似问", "直接回答率提升"],
       [{"label": "直接回答率", "value": "提升", "kind": "actual"},
        {"label": "知识库运维", "value": "冷启动与调优成本大幅降低", "kind": "actual"}],
       "在 AIGC 引擎下企业只需上传原始材料即可自动提炼 FAQ 并扩展相似问，极大降低知识库冷启动与运维调优工作量，提升知识库效率与质量。",
       ["AIGC", "智能客服", "知识库"], ["智齿科技 AIGC 引擎"],
       ["教育", "智能客服", "AIGC"], featured=False),

    mk("cs-top10-swepdi-kb", "西南电力设计院智能知识管理与知识问答项目",
       {"id": "org-swepdi", "name": "西南电力设计院", "size": "large", "region": "中国", "type": "soe"},
       "energy-mining", ["knowledge-base", "workflow"], ["信息技术", "战略与运营"],
       "360亿方云助力西南电力设计院实现知识管理与知识问答智能化转型，针对管理制度、知识问答及办公流程痛点，采用大模型实现企业知识智能化管理与高效利用，显著提升管理效率与服务质量。",
       "西南电力设计院在管理制度、知识问答、办公流程中存在知识分散、获取成本高的痛点。",
       "企业非结构化数据价值未释放，知识获取成本高、内部管理效率受限。",
       "构建管理制度问答数字员工与专业知识问答系统，基于大模型打造 AI 文件助手、AI 云文档、AI 知识问答、AI 知识搜索等上层应用，充分释放非结构化数据价值。",
       ["360亿方云平台", "管理制度问答数字员工", "专业知识问答系统", "AI文件/云文档/搜索"],
       [{"label": "内部管理效率", "value": "显著提升", "kind": "actual"},
        {"label": "知识获取成本", "value": "降低", "kind": "actual"}],
       "显著提升企业内部管理效率与员工专业素养，降低知识获取成本，为内部知识问答场景提供可借鉴经验。",
       ["大模型", "知识库", "工作流"], ["360亿方云大模型"],
       ["能源", "知识管理", "知识库"], featured=False),

    mk("cs-top10-zhejiang-lab", "之江实验室基于 AI 大模型的多路召回智能问答助手",
       {"id": "org-zhejianglab", "name": "之江实验室", "size": "large", "region": "浙江", "type": "soe"},
       "government", ["knowledge-base", "agent"], ["信息技术", "战略与运营"],
       "之江实验室基于 AI 大模型开发多路召回智能问答助手“小之知道”，满足知识问答与任务型问答混合场景并支持多模态输出，实现从文档自动生成问答对与相似问题，已用于办公、招聘、入职等内部场景并集成到“之江精灵”音箱、统一搜索。",
       "之江实验室内部存在办公、招聘、入职等多场景问答需求，单一召回精度不足。",
       "多场景融合问答下现有技术召回精度低，问答对录入效率低。",
       "提出多路召回的多场景智能问答方法与系统，满足多路模型并发、提升运行效率；通过大模型批量从文档自动提取问答对并生成相似问题，提高问答对录入效率与召回率。",
       ["开发小之知道问答助手", "多路召回混合问答", "文档自动生成问答对", "能力集成（音箱/搜索）"],
       [{"label": "问答对录入效率", "value": "提升", "kind": "actual"},
        {"label": "召回率", "value": "提高（相似问题生成）", "kind": "actual"}],
       "解决多场景融合问答召回精度低的问题，满足多路模型并发要求；批量自动提取问答对并生成相似问题，提高录入效率与召回率。",
       ["大模型", "知识库", "智能体"], ["之江实验室 AI 大模型"],
       ["政务", "多路召回", "知识问答"], featured=False),
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
