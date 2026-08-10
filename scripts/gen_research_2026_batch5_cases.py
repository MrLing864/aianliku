# -*- coding: utf-8 -*-
"""report/ 下 2026 行业研报抽取第 5 批：中航证券《AI 医疗行业 4 月月报》代表案例。
来源（report_ocr_batch_20260723/ 新提取）：
  - 中航证券 2026-04-14《AI 医疗行业 4 月月报：重磅合作频现，应用场景纵深拓展》
入库：node scripts/insert-cases.mjs cases_json/gen_research_2026_batch5_cases.json
"""
import json
import os
from case_common import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "cases_json", "gen_research_2026_batch5_cases.json")
COLLECTED = "2026-07-23"
RISK = ("数据来自券商研报与公开披露，医疗 AI 涉及临床安全与合规，产品需通过 NMPA/FDA 等监管审批；"
        "模型在复杂任务上的低报、数据偏差与隐私保护是落地关键风险，临床应用应以人机协同为前提。")

SRC_TITLE = "AI 医疗行业 4 月月报：重磅合作频现，应用场景纵深拓展"
SRC_PUB = "中航证券"
SRC_DATE = "2026-04-14"


def mk(slug, title, org, summary, background, problem, solution, steps, results, roi,
       tech, models, tags, conf="high", featured=False):
    return {
        "id": f"case-{slug}", "slug": f"case-{slug}", "title": title, "organization": org,
        "industry": "healthcare", "scenarios": ["agent", "knowledge-base", "workflow"],
        "businessFunctions": ["客户成功", "战略与运营"], "summary": summary,
        "background": background, "problem": problem, "solution": solution,
        "implementationSteps": steps, "duration": "规模落地（2025-2026）", "cost": "未披露",
        "results": results, "roi": roi, "risks": RISK,
        "editorComment": {
            "suitableFor": "医疗机构、医疗 AI 企业与有智慧医疗诉求的卫生管理机构",
            "prerequisites": "具备医疗数据积累与合规基础，有 HIS/PACS 等系统对接与临床验证条件",
            "priority": "建议参考",
            "text": f"{org['name']}的「{title}」源自券商研报披露的公开案例，量化指标可供同业对标。",
        },
        "implementers": [{"name": f"{org['name']}（含技术合作方）", "role": "其他"}],
        "outcomeStatus": "success", "confidence": conf,
        "sources": [{"id": f"src-res-med-{slug}", "title": SRC_TITLE, "publisher": SRC_PUB,
                     "type": "report", "url": "", "publishedAt": SRC_DATE,
                     "collectedAt": COLLECTED, "accessibility": "available",
                     "supports": ["summary", "results"]}],
        "featured": featured, "publishedAt": SRC_DATE, "implementationYear": 2026,
        "implementationTimePrecision": "year", "techPath": tech, "modelStack": models,
        "sourceReport": {"title": SRC_TITLE, "publisher": SRC_PUB, "year": 2026},
        "tags": tags, "seo": {"metaTitle": f"{title} - 企业 AI 应用案例",
                              "metaDescription": summary[:80], "keywords": tags},
    }


CASES = [
    mk("research-2026-anzhen-llm", "北京安贞医院：全国首个公立医院运行管理大模型，报告生成几天→5分钟",
       {"id": "org-anzhen", "name": "北京安贞医院", "size": "large", "region": "北京", "type": "private"},
       "北京安贞医院联合中国电信发布全国首个“公立医院运行管理大模型”，打通 HIS、SPD、ODR 等核心系统，治理 300 余万条数据、建立 800 余个核心管理指标，构建“问数智能体”与运行分析引擎；运行管理报告生成时间从几天缩短至 5 分钟，管理响应速度提升 95%、精准决策效率提升 60%。",
       "公立医院运营管理依赖人工整理多系统数据，报告周期长、决策滞后，缺乏统一智能分析能力。",
       "医院运行管理数据分散于 HIS/SPD/ODR 等系统，人工汇总慢、响应滞后，难以支撑精准决策。",
       "以中国电信星辰大模型为底座，打通核心业务系统、治理海量数据并构建管理知识库，形成“问数智能体”与运行分析引擎，面向不同角色输出定制化决策报告。",
       ["联合发布运行管理大模型", "打通 HIS/SPD/ODR 多系统", "治理 300 万+ 数据建指标库", "问数智能体+运行分析引擎"],
       [{"label": "运行管理报告生成", "value": "几天→5 分钟", "kind": "actual"},
        {"label": "管理响应速度", "value": "+95%", "kind": "actual"},
        {"label": "精准决策效率", "value": "+60%", "kind": "actual"}],
       "AI 大模型从临床诊疗延伸至医院运营管理核心，显著提升管理效率与科学性，为公立医院高质量发展提供范式。",
       ["大模型", "智能体", "知识库"], ["中国电信星辰大模型"],
       ["医疗", "医院运营大模型", "智能体", "智慧医院"], conf="high", featured=True),

    mk("research-2026-kingmed-ai", "金域医学：AI 宫颈癌筛查效率提升 4 倍，域见医言落地 60+ 智能体",
       {"id": "org-kingmed", "name": "金域医学", "size": "large", "region": "广州", "type": "private"},
       "金域医学 AI 宫颈癌智能筛查工作站集成数字病理辅助初筛与基因扩增曲线智能分析，HPV 核酸检测日处理量 3000 份、TCT 液基细胞检测日处理量 2400 份，人均日检测效率提升 4 倍，AI 辅助筛查模型年调用量超 120 万例；自研“域见医言”大模型“小域医”落地 60+ 智能体，覆盖多类临床场景。",
       "国内病理医生资源不足、分布不均，大规模宫颈癌筛查依赖人工阅片，效率低、周期长。",
       "病理人工阅片效率低、易疲劳；大规模筛查对自动化与一致性要求高。",
       "以 AI 智能筛查工作站实现样本处理-检测-阅片全流程自动化，搭载辅助初筛与曲线分析模型；以“域见医言”大模型构建“小域医”多场景智能体。",
       ["AI 宫颈癌筛查工作站", "全流程自动化实验模块", "辅助初筛+曲线智能分析", "域见医言小域医 60+ 智能体"],
       [{"label": "HPV 日处理量", "value": "3000 份", "kind": "actual"},
        {"label": "人均日检测效率", "value": "提升 4 倍", "kind": "actual"},
        {"label": "AI 辅助筛查年调用量", "value": "超 120 万例", "kind": "actual"},
        {"label": "小域医落地智能体", "value": "60+ 个", "kind": "actual"}],
       "AI 破解病理资源瓶颈，年调用量超百万级，数智化转型构建“数据要素×”新生态，提升大规模筛查可及性。",
       ["大模型", "智能体", "数字病理"], ["域见医言大模型"],
       ["医疗", "AI筛查", "数字病理", "智能体"], conf="high"),

    mk("research-2026-deshu-ai", "德适生物：医学影像大模型第一股，核型检测 100% 灵敏度、报告 30 天→4-7 天",
       {"id": "org-deshu", "name": "德适生物", "size": "medium", "region": "杭州", "type": "private"},
       "德适生物登陆港交所成为“医学影像大模型第一股”，自研 iMedImage® 医学影像基座模型支持染色体、CT、MRI、超声等 19 种模态、覆盖超 90% 临床场景；核心产品 AI AutoVision® 在染色体数目异常检测实现 100% 灵敏度与特异度、结构异常灵敏度 94.05%，报告周期从 30 天大幅缩短至 4-7 天；国内核型分析市占率 30.6% 居首，2025 年前三季度营收 1.12 亿元（同比+470%）。",
       "染色体核型分析长期依赖人工、周期长、一致性差，医学影像诊断对效率与准确率要求高。",
       "核型分析人工判读慢、易错；医学影像诊断报告周期长，基层能力不足。",
       "以 iMedImage® 多模态基座模型支撑全场景影像理解，AI AutoVision® 实现核型自动化检测与快速报告，进入 NMPA 创新医疗器械绿色通道并规模化推广。",
       ["iMedImage® 基座模型", "AI AutoVision® 核型检测", "多模态影像覆盖 90% 场景", "港交所上市+临床推广"],
       [{"label": "染色体数目异常检测", "value": "100% 灵敏度与特异度", "kind": "actual"},
        {"label": "报告周期", "value": "30 天→4-7 天", "kind": "actual"},
        {"label": "2025 前三季营收", "value": "1.12 亿元", "improvement": "同比+470%", "kind": "actual"}],
       "高准确率+短周期+强商业化（营收高增、市占率第一）验证医学影像大模型价值，普惠基层诊断。",
       ["大模型", "医学影像", "智能体"], ["iMedImage® 基座模型"],
       ["医疗", "医学影像大模型", "核型分析", "早筛"], conf="high"),

    mk("research-2026-neusoft-damo", "东软医疗×阿里达摩院：平扫 CT+AI 多癌早筛嵌入设备，下沉 130+ 国家",
       {"id": "org-neusoft", "name": "东软医疗", "size": "large", "region": "沈阳", "type": "private"},
       "阿里达摩院与东软医疗达成战略合作，将“平扫 CT+AI”多癌早筛算法深度嵌入东软医疗 CT 设备，基层医院常规平扫即可自动提示胰腺癌、食管癌、结直肠癌等高致死率癌症早期风险，无需造影剂、不增加患者负担；依托东软覆盖全球 130 余个国家的设备与供应链体系，实现“硬件设备+AI 算法”一体化交付，推动早筛技术普惠下沉。",
       "高端癌症早筛依赖专用设备与造影剂，基层部署门槛高、可及性差。",
       "多癌早筛技术难以下沉基层；AI 算法与医疗装备产业化通道未打通。",
       "将达摩院多癌早筛算法嵌入 CT 设备，以“平扫 CT+AI”零增量负担实现基层早筛；借东软全球设备网络一体化交付。",
       ["达摩院算法嵌入 CT 设备", "平扫 CT+AI 多癌早筛", "硬件+AI 一体化交付", "全球设备网络下沉"],
       [{"label": "覆盖设备国家", "value": "130+ 个国家", "kind": "actual"},
        {"label": "早筛癌种", "value": "胰腺癌/食管癌/结直肠癌等", "kind": "actual"}],
       "打通 AI 算法与医疗装备产业化通道，让高端多癌早筛依托国产 CT 快速下沉基层，提升早诊率。",
       ["大模型", "医学影像", "智能体"], ["阿里达摩院平扫 CT+AI"],
       ["医疗", "多癌早筛", "医学影像", "基层普惠"], conf="medium"),

    mk("research-2026-pagd-ai", "平安好医生：AI 辅助诊疗准确率约 98%，覆盖 2000+ 疾病、服务超千万用户",
       {"id": "org-pagd", "name": "平安好医生", "size": "large", "region": "上海", "type": "private"},
       "平安好医生 AI 辅助诊疗系统以“平安医博通”多模态医疗大模型为技术支撑，包含平安芯医、AI Doctor 等核心产品，AI 辅助咨询问诊准确率约 98%，覆盖超 2000 种疾病诊断知识，7×24 小时提供线上咨询、报告解读、疾病管理等全场景服务，已服务超千万用户。",
       "优质医疗资源紧张、问诊成本高，用户对健康咨询的即时性、可及性诉求强。",
       "线下问诊资源有限、响应慢；医生病历整理与分诊负担重。",
       "以多模态医疗大模型构建 AI 辅助诊疗系统，覆盖咨询-分诊-报告解读-管理全场景，并协助医生完成病历整理，以“人+机+生态”闭环实现资源普惠。",
       ["平安医博通多模态大模型", "AI Doctor/芯医产品", "全场景健康服务", "人机协同普惠"],
       [{"label": "AI 辅助诊疗准确率", "value": "约 98%", "kind": "actual"},
        {"label": "覆盖疾病", "value": "超 2000 种", "kind": "actual"},
        {"label": "服务用户", "value": "超千万", "kind": "actual"}],
       "高准确率+大规模用户服务验证医疗大模型 C 端商业化，助力优质医疗资源普惠与降本。",
       ["大模型", "智能体", "多模态"], ["平安医博通大模型"],
       ["医疗", "AI辅助诊疗", "互联网医疗", "健康助手"], conf="high"),

    mk("research-2026-uih-ai", "联影医疗：uAI 影智大模型+Avatar 数字人+MERITS 手术平台全栈落地",
       {"id": "org-uih", "name": "联影医疗", "size": "large", "region": "上海", "type": "private"},
       "联影医疗以 uAI 影智大模型具备医学影像通用底层学习能力并支持新疾病类型快速迁移；融合语音识别、医疗文本大模型与具身智能研发 uAI Avatar 数字人，支持多轮对话、医学问答与手术设备操纵；uAI MERITS 手术平台依托多模态医疗 AI 实现术前精准分割、术中 3D 图像配准与实时指引，大幅提升手术效率与精准度。",
       "医学影像设备需从“出图”向“智能诊断+手术导航”升级，临床对影像理解与术中智能指引诉求强。",
       "影像诊断依赖专家、新病种适配慢；术中导航缺乏实时 AI 指引。",
       "以 uAI 影智大模型为底座实现影像通用学习与快速迁移；以 uAI Avatar 数字人提供拟人化交互；以 uAI MERITS 实现术前-术中全流程智能手术支持。",
       ["uAI 影智大模型", "uAI Avatar 数字人", "uAI MERITS 手术平台", "跨模态技术融合"],
       [{"label": "uAI 影智能力", "value": "影像通用学习+新疾病快速迁移", "kind": "actual"},
        {"label": "uAI MERITS", "value": "术前精准分割+术中实时 3D 指引", "kind": "actual"}],
       "影像设备向“智能诊断+手术导航”全栈升级，夯实高端医疗装备国产化与智能化竞争力。",
       ["大模型", "智能体", "具身智能", "医学影像"], ["uAI 影智大模型"],
       ["医疗", "医学影像", "手术导航", "数字人"], conf="medium"),
]


def main():
    out = []
    for c in CASES:
        rec = build(c)
        out.append(rec)
        print(f"  [OK] {rec['title']}  (slug={rec['slug']})")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n已生成 {len(out)} 条案例 -> {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
