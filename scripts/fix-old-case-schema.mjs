import { readFileSync } from "node:fs";
import { join } from "node:path";
import cloudbase from "@cloudbase/node-sdk";

const envText = readFileSync(join(process.cwd(), ".env"), "utf-8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Za-z_][\w]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
  region: process.env.CLOUDBASE_REGION || "ap-shanghai",
});
const db = app.database();
const coll = db.collection("cases");
const _ = db.command;

// Full catalog objects (mirrors src/lib/catalog.ts)
const industries = {
  finance:           { slug: "finance",           displayName: "金融" },
  retail:            { slug: "retail",            displayName: "零售与消费" },
  manufacturing:     { slug: "manufacturing",     displayName: "制造业" },
  "software-internet": { slug: "software-internet", displayName: "软件与互联网" },
  telecom:           { slug: "telecom",           displayName: "通信" },
  energy:            { slug: "energy-mining",     displayName: "能源与矿山" },
  healthcare:        { slug: "healthcare",        displayName: "医疗健康" },
  education:         { slug: "education",         displayName: "教育" },
  automotive:        { slug: "automotive",        displayName: "汽车" },
  logistics:         { slug: "logistics",         displayName: "物流与仓储" },
  government:        { slug: "government",        displayName: "政务与公共服务" },
  aerospace:         { slug: "aerospace",         displayName: "航空航天" },
};

const scenarios = {
  "customer-service":     { name: "智能客服",   slug: "customer-service",     synonyms: ["AI客服", "售后AI", "客服机器人", "智能服务", "大模型客服", "智能客服助手"] },
  sales:                  { name: "销售辅助",   slug: "sales",                 synonyms: ["智能营销", "AI营销", "销售助手", "AI销售", "精准营销", "营销助手"] },
  "knowledge-base":       { name: "企业知识库", slug: "knowledge-base",        synonyms: ["RAG", "知识助手", "知识问答", "智能知识库", "知识管理"] },
  workflow:               { name: "流程自动化", slug: "workflow",              synonyms: ["RPA", "自动化", "数字员工", "智能审核", "自动流程"] },
  forecast:               { name: "预测与分析", slug: "forecast",              synonyms: ["智能报告", "数据分析", "需求预测", "归因分析", "指标分析"] },
  "content-generation":   { name: "内容生成",   slug: "content-generation",    synonyms: ["AIGC", "智能设计", "文案生成", "AI生成", "AI创作", "AI出题"] },
  "rnd-design":           { name: "研发设计与仿真", slug: "rnd-design",        synonyms: ["研发辅助", "代码生成", "AI编程", "大模型研发", "智能研发"] },
  "ops-inspection":       { name: "智能运维与巡检", slug: "ops-inspection",    synonyms: ["智能运维", "巡检", "设备运检"] },
  "ai-infra":             { name: "算力基础设施与AI平台", slug: "ai-infra",    synonyms: ["AI平台", "大模型平台", "模型训练", "算力"] },
  "production-scheduling": { name: "智能排产与工艺优化", slug: "production-scheduling", synonyms: ["智能生产", "排产"] },
  agent:                  { name: "Agent",       slug: "agent",                synonyms: ["智能体", "AI Agent", "数字人"] },
};

const fixList = [
  // ====== 客服智能应用报告 (10) ======
  { slug: "case-report-kefu-top10-2024-1",  title: "招商银行：大模型智能客服助手",                    ind: "finance",            scn: ["customer-service"] },
  { slug: "case-report-kefu-top10-2024-2",  title: "伊利：基于大模型的智能客服与营销助手",              ind: "retail",             scn: ["customer-service", "sales"] },
  { slug: "case-report-kefu-top10-2024-3",  title: "联想：大模型驱动的智能客服体系",                    ind: "software-internet",  scn: ["customer-service"] },
  { slug: "case-report-kefu-top10-2024-4",  title: "中国移动：大模型智能客服",                         ind: "telecom",            scn: ["customer-service"] },
  { slug: "case-report-kefu-top10-2024-5",  title: "蚂蚁集团：大模型客服应用",                         ind: "finance",            scn: ["customer-service"] },
  { slug: "case-report-kefu-top10-2024-6",  title: "海尔智家：大模型客服与智能家居助手",                ind: "manufacturing",      scn: ["customer-service"] },
  { slug: "case-report-kefu-top10-2024-7",  title: "南方航空：大模型智能客服",                         ind: "logistics",          scn: ["customer-service"] },
  { slug: "case-report-kefu-top10-2024-8",  title: "京东：大模型客服与商家助手",                       ind: "retail",             scn: ["customer-service", "sales"] },
  { slug: "case-report-kefu-top10-2024-9",  title: "国家电网：大模型智能客服",                         ind: "energy",             scn: ["customer-service"] },
  { slug: "case-report-kefu-top10-2024-10", title: "美团：大模型客服与商家智能助手",                     ind: "retail",             scn: ["customer-service", "workflow"] },

  // ====== 2024年度AI应用报告 (30) ======
  { slug: "case-report-2024top30-1",  title: "勃小智RAG医学资料检索增强",                              ind: "healthcare",          scn: ["knowledge-base"] },
  { slug: "case-report-2024top30-2",  title: "基于对话式AI指标分析的猎头管理与决策洞察",                  ind: "software-internet",   scn: ["sales", "forecast"] },
  { slug: "case-report-2024top30-3",  title: "东方红智能小牛",                                       ind: "finance",             scn: ["forecast", "agent"] },
  { slug: "case-report-2024top30-4",  title: "基于金融大模型的智能化核查项目",                           ind: "finance",             scn: ["workflow"] },
  { slug: "case-report-2024top30-5",  title: "基于电力认知大模型的设备运检知识助手",                      ind: "energy",              scn: ["knowledge-base", "ops-inspection"] },
  { slug: "case-report-2024top30-6",  title: "基于aiXcoder代码大模型的智能化软件开发应用实践",            ind: "software-internet",   scn: ["rnd-design"] },
  { slug: "case-report-2024top30-7",  title: "「AI组卷判卷」Agent实践",                               ind: "education",           scn: ["content-generation", "agent"] },
  { slug: "case-report-2024top30-8",  title: "海盟控股基于供应链大模型的数字员工应用实践",                  ind: "logistics",           scn: ["workflow", "agent"] },
  { slug: "case-report-2024top30-9",  title: "吉利星睿AI大模型",                                      ind: "automotive",          scn: ["ai-infra"] },
  { slug: "case-report-2024top30-10", title: "面向网格现代化治理场景的AI大模型应用",                      ind: "government",          scn: ["knowledge-base", "workflow"] },
  { slug: "case-report-2024top30-11", title: "丹青大模型助力雷火游戏美术生产",                            ind: "software-internet",   scn: ["content-generation"] },
  { slug: "case-report-2024top30-12", title: "诺亚财富基于领域大模型的智能知识库和知识助手应用",              ind: "finance",             scn: ["knowledge-base"] },
  { slug: "case-report-2024top30-13", title: "思必驰DFM-2大模型在智慧办公场景中的应用",                    ind: "software-internet",   scn: ["content-generation", "workflow"] },
  { slug: "case-report-2024top30-14", title: "基于盘古大模型的智能矿山项目",                              ind: "energy",              scn: ["ops-inspection", "workflow"] },
  { slug: "case-report-2024top30-15", title: "基于AI大模型的汽车在线问答平台",                            ind: "automotive",          scn: ["customer-service"] },
  { slug: "case-report-2024top30-16", title: "360智脑大模型赋能金融行业数智升级",                         ind: "finance",             scn: ["ai-infra"] },
  { slug: "case-report-2024top30-17", title: "泰康集团人力资源共享服务中心场景大模型应用实践",                ind: "finance",             scn: ["workflow"] },
  { slug: "case-report-2024top30-18", title: "天士力中医药大模型",                                     ind: "healthcare",          scn: ["knowledge-base", "rnd-design"] },
  { slug: "case-report-2024top30-19", title: "实在TARS大模型在天翼数科的应用",                            ind: "telecom",             scn: ["ai-infra"] },
  { slug: "case-report-2024top30-20", title: "嫦娥工程",                                             ind: "aerospace",           scn: ["rnd-design"] },
  { slug: "case-report-2024top30-21", title: "基于零犀因果大模型的保险个人助理",                           ind: "finance",             scn: ["sales", "customer-service"] },
  { slug: "case-report-2024top30-22", title: "元贝贝&华藏大模型智能婴儿床项目",                           ind: "manufacturing",       scn: ["rnd-design"] },
  { slug: "case-report-2024top30-23", title: "阳光正言GPT大模型开放平台",                                ind: "finance",             scn: ["ai-infra"] },
  { slug: "case-report-2024top30-24", title: "智能场外交易发现平台",                                    ind: "finance",             scn: ["workflow", "forecast"] },
  { slug: "case-report-2024top30-25", title: "知识库问答大模型项目",                                     ind: "software-internet",   scn: ["knowledge-base"] },
  { slug: "case-report-2024top30-26", title: "基于大模型的智能研发体系建设",                              ind: "software-internet",   scn: ["rnd-design"] },
  { slug: "case-report-2024top30-27", title: "中国工商银行数字员工解决方案",                              ind: "finance",             scn: ["workflow", "customer-service"] },
  { slug: "case-report-2024top30-28", title: "中国农业银行ChatABC大模型",                                ind: "finance",             scn: ["ai-infra", "customer-service"] },
  { slug: "case-report-2024top30-29", title: "基于大模型的审计数字劳动力",                                 ind: "finance",             scn: ["workflow"] },
  { slug: "case-report-2024top30-30", title: "基于AI大模型的客服问题归因分析和服务质量分析系统",               ind: "telecom",             scn: ["customer-service", "forecast"] },
];

async function main() {
  let ok = 0, fail = 0, skip = 0;

  for (const entry of fixList) {
    const ind = industries[entry.ind];
    const scn = entry.scn.map(s => scenarios[s]);

    if (!ind) { console.log(`SKIP ${entry.slug}: unknown industry ${entry.ind}`); skip++; continue; }

    try {
      const res = await coll.where({ slug: entry.slug }).update({
        industry: ind,
        scenarios: scn,
      });
      if (res?.updated > 0) {
        ok++;
        console.log(`OK ${entry.slug} → ${ind.displayName} · ${scn.map(s=>s.name).join("/")}`);
      } else {
        console.log(`NOOP ${entry.slug}: not found or unchanged`);
        skip++;
      }
    } catch (e) {
      fail++;
      console.log(`FAIL ${entry.slug}: ${e?.message || e}`);
    }
  }

  console.log(`\nDone: ok=${ok} fail=${fail} skip=${skip}`);
}

main().catch(console.error);
