import tcb from "@cloudbase/node-sdk";
import "dotenv/config";
const app = tcb.init({ env: process.env.CLOUDBASE_ENV, secretId: process.env.CLOUDBASE_SECRET_ID, secretKey: process.env.CLOUDBASE_SECRET_KEY });
const db = app.database();
const r = await db.collection("cases").field({ _id: true, title: true }).limit(1).skip(5).get();
const c = r.data[0];
console.log("id:", c._id, "title:", c.title);
// 测试简单小写字段名 vs 含大写字段名
const up = await db.collection("cases").where({ _id: c._id }).update({ data: { fpv2: "abc", fingerprintVersion: "dedup-v2-probe" } });
console.log("update 返回:", JSON.stringify(up));
const back = await db.collection("cases").doc(c._id).get();
console.log("回读 fpv2:", back?.data?.fpv2, "| fingerprintVersion:", back?.data?.fingerprintVersion);
// 清理
await db.collection("cases").where({ _id: c._id }).update({ data: { fpv2: db.command.remove(), fingerprintVersion: db.command.remove() } });
console.log("清理后:", (await db.collection("cases").doc(c._id).get())?.data?.fpv2);
