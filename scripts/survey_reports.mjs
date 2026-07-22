import fs from 'fs';
import path from 'path';

const DIR = 'c:/Users/Administrator/Desktop/aianliku/code/report_ocr';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.txt') && !f.endsWith('.done'));

const keywords = ['案例', '最佳实践', '企业', '客户', '落地', '实践', '效果', '提升', '降低', '缩短', '效率', '成本'];

const rows = [];
for (const f of files) {
  const t = fs.readFileSync(path.join(DIR, f), 'utf-8');
  const size = t.length;
  const cnt = {};
  let total = 0;
  for (const k of keywords) {
    const c = (t.match(new RegExp(k, 'g')) || []).length;
    cnt[k] = c;
    total += c;
  }
  // 估算"案例段落"数量：以"案例"或"实践"附近是否带公司名做粗略判断
  rows.push({ name: f.replace('.txt', ''), size, total, ...cnt });
}

rows.sort((a, b) => b.total - a.total);
console.log('name | size(KB) | 案例 | 最佳实践 | 企业 | 客户 | 落地 | 实践 | 效果 | 提升 | 降低 | 缩短 | 效率 | 成本 | total');
for (const r of rows) {
  console.log(
    `${r.name.slice(0, 30).padEnd(32)} | ${(r.size/1024).toFixed(0).padStart(4)} | ${String(r['案例']).padStart(4)} | ${String(r['最佳实践']).padStart(4)} | ${String(r['企业']).padStart(4)} | ${String(r['客户']).padStart(4)} | ${String(r['落地']).padStart(4)} | ${String(r['实践']).padStart(4)} | ${String(r['效果']).padStart(4)} | ${String(r['提升']).padStart(4)} | ${String(r['降低']).padStart(4)} | ${String(r['缩短']).padStart(4)} | ${String(r['效率']).padStart(4)} | ${String(r['成本']).padStart(4)} | ${r.total}`
  );
}
