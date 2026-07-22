/* eslint-disable @typescript-eslint/no-explicit-any -- 适配层需要 any 做查询/更新翻译 */
/**
 * CloudBase 文档型数据库数据层（替代 MongoDB 驱动）
 *
 * 项目已彻底弃用 MongoDB / MongoDB Atlas，全部持久化改为腾讯云 CloudBase
 * 文档型数据库（@cloudbase/node-sdk）。为尽量降低 ~25 处调用点的改动风险，
 * 这里提供一个“mongodb 兼容”的薄适配层：对外暴露与 mongodb 驱动风格一致的
 * getDb()/collection()/findOne()/find()/insertOne()/updateOne()/aggregate()...
 * 等 API，内部全部翻译为 CloudBase 文档数据库原生调用。
 *
 * 3 个 repository（cases / admin / reports）中依赖 Atlas 高级能力
 * （$search / $vectorSearch / $facet）的函数已重写为 CloudBase 原生实现。
 */
import cloudbase from "@cloudbase/node-sdk";

type AnyObj = Record<string, any>;

let appInstance: any = null;

function getApp(): any {
  if (!appInstance) {
    appInstance = cloudbase.init({
      env: process.env.CLOUDBASE_ENV as string,
      secretId: process.env.CLOUDBASE_SECRET_ID as string,
      secretKey: process.env.CLOUDBASE_SECRET_KEY as string,
      region: process.env.CLOUDBASE_REGION || "ap-shanghai",
    });
  }
  return appInstance;
}

/** 是否已配置 CloudBase（取代原 isMongoConfigured / hasMongo） */
export function isDbConfigured(): boolean {
  return Boolean(
    process.env.CLOUDBASE_ENV &&
      process.env.CLOUDBASE_SECRET_ID &&
      process.env.CLOUDBASE_SECRET_KEY,
  );
}

export const hasDb = isDbConfigured();

/** 原生 CloudBase Database 对象（供 repository 中需要聚合/原生 API 的场景使用） */
export function getCloudBaseDb(): any {
  if (!isDbConfigured()) {
    throw new Error(
      "CloudBase 未配置：请设置环境变量 CLOUDBASE_ENV / CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY",
    );
  }
  return getApp().database();
}

/** 兼容原 MongoServerError，便于既有 `instanceof MongoServerError && code === 11000` 逻辑继续工作 */
export class MongoServerError extends Error {
  code: number;
  constructor(message: string, code = 11000) {
    super(message);
    this.name = "MongoServerError";
    this.code = code;
  }
}

function cmd() {
  const db = getCloudBaseDb();
  return {
    db,
    _: db.command,
    agg: (db.command as any).aggregate,
    RegExp: db.RegExp,
  };
}

function toMongoError(e: any): any {
  if (e && e instanceof MongoServerError) return e;
  const msg = String((e && e.message) || e || "");
  if (/E11000|duplicate key|unique|已存在|index/i.test(msg)) {
    return new MongoServerError(msg, 11000);
  }
  return e;
}

/* ------------------------------------------------------------------ */
/* filter 翻译（mongodb 查询对象 -> CloudBase where）                   */
/* ------------------------------------------------------------------ */

function translateFilter(filter: any): any {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) return filter;
  const { _ } = cmd();
  const plain: AnyObj = {};
  const clauses: any[] = [];

  const handleFieldOps = (opObj: AnyObj): any => {
    const ops: any[] = [];
    for (const op of Object.keys(opObj)) {
      const ov = opObj[op];
      switch (op) {
        case "$eq":
          ops.push(ov);
          break;
        case "$ne":
          ops.push(_.neq(ov));
          break;
        case "$gt":
          ops.push(_.gt(ov));
          break;
        case "$gte":
          ops.push(_.gte(ov));
          break;
        case "$lt":
          ops.push(_.lt(ov));
          break;
        case "$lte":
          ops.push(_.lte(ov));
          break;
        case "$in":
          ops.push(_.in(ov));
          break;
        case "$nin":
          ops.push(_.nin(ov));
          break;
        case "$exists":
          ops.push(_.exists(ov));
          break;
        case "$type":
          ops.push((_ as any).type ? (_ as any).type(ov) : { $type: ov });
          break;
        case "$all":
          ops.push(_.all(ov));
          break;
        case "$size":
          ops.push((_ as any).size(ov));
          break;
        case "$elemMatch":
          ops.push((_ as any).elemMatch(translateFilter(ov)));
          break;
        case "$not": {
          const inner = ov instanceof RegExp ? cmd().RegExp({ regexp: ov.source, options: String(ov.flags).replace(/[^imsxu]/g, "") }) : translateFilter(ov);
          ops.push((_ as any).not(inner));
          break;
        }
        case "$regex": {
          const opts = opObj.$options || (ov instanceof RegExp ? ov.flags : "");
          const source = ov instanceof RegExp ? ov.source : String(ov);
          ops.push(
            cmd().RegExp({
              regexp: source,
              options: String(opts).replace(/[^imsxu]/g, ""),
            }),
          );
          break;
        }
        case "$options":
          break;
        default:
          ops.push(ov);
      }
    }
    if (ops.length === 1) return ops[0];
    return _.and(ops);
  };

  for (const key of Object.keys(filter)) {
    const val = filter[key];
    if (key === "$or") clauses.push(_.or((val as any[]).map(translateFilter)));
    else if (key === "$and") clauses.push(_.and((val as any[]).map(translateFilter)));
    else if (key === "$nor") clauses.push((_ as any).nor((val as any[]).map(translateFilter)));
    else if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      Object.keys(val).length > 0 &&
      Object.keys(val).every((k) => k.startsWith("$"))
    ) {
      plain[key] = handleFieldOps(val);
    } else if (val instanceof RegExp) {
      plain[key] = cmd().RegExp({ regexp: val.source, options: String(val.flags).replace(/[^imsxu]/g, "") });
    } else {
      plain[key] = val;
    }
  }

  const parts: any[] = [];
  if (Object.keys(plain).length) parts.push(plain);
  parts.push(...clauses);
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return _.and(parts);
}

/* ------------------------------------------------------------------ */
/* update 翻译                                                         */
/* ------------------------------------------------------------------ */

function normalizeEach(v: any) {
  if (v && typeof v === "object" && !Array.isArray(v) && "$each" in v) return v.$each;
  return v;
}

function buildUpdate(update: any): AnyObj {
  const { _ } = cmd();
  const upd: AnyObj = {};
  const set: AnyObj = { ...(update.$set || {}) };
  // 模拟 $setOnInsert：仅当 upsert 插入时生效；在 _update 的 upsert 分支里合并到插入文档，
  // 这里非 upsert 更新时不包含它（与 mongodb 语义一致）。
  if (update.$setOnInsert && (update as any).__upsert) Object.assign(set, update.$setOnInsert);
  Object.assign(upd, set);
  if (update.$inc) for (const k of Object.keys(update.$inc)) upd[k] = _.inc(update.$inc[k]);
  if (update.$mul) for (const k of Object.keys(update.$mul)) upd[k] = (_.mul ? _.mul(update.$mul[k]) : update.$mul[k]);
  if (update.$min) for (const k of Object.keys(update.$min)) upd[k] = (_.min ? _.min(update.$min[k]) : update.$min[k]);
  if (update.$max) for (const k of Object.keys(update.$max)) upd[k] = (_.max ? _.max(update.$max[k]) : update.$max[k]);
  if (update.$unset) for (const k of Object.keys(update.$unset)) upd[k] = _.remove();
  if (update.$rename) for (const k of Object.keys(update.$rename)) upd[k] = (_.rename ? _.rename(update.$rename[k]) : update.$rename[k]);
  if (update.$push) for (const k of Object.keys(update.$push)) upd[k] = _.push(normalizeEach(update.$push[k]));
  if (update.$pull) {
    for (const k of Object.keys(update.$pull)) {
      const pv = update.$pull[k];
      upd[k] = _.pull(pv && typeof pv === "object" && !Array.isArray(pv) && "$in" in pv ? _.in(pv.$in) : pv);
    }
  }
  if (update.$addToSet) for (const k of Object.keys(update.$addToSet)) upd[k] = _.addToSet(normalizeEach(update.$addToSet[k]));
  return upd;
}

function buildUpsertDoc(filter: any, update: any): AnyObj {
  const doc: AnyObj = {};
  if (filter && typeof filter === "object" && !Array.isArray(filter)) {
    for (const k of Object.keys(filter)) {
      const v = filter[k];
      if (typeof v === "object" && v && !Array.isArray(v) && Object.keys(v).some((x) => x.startsWith("$"))) continue;
      doc[k] = v;
    }
  }
  const set = { ...(update.$set || {}) };
  if (update.$setOnInsert) Object.assign(set, update.$setOnInsert);
  Object.assign(doc, set);
  return doc;
}

/* ------------------------------------------------------------------ */
/* projection                                                          */
/* ------------------------------------------------------------------ */

function buildField(proj: AnyObj): AnyObj | null {
  const field: AnyObj = {};
  let excludeNonId = false;
  for (const [k, v] of Object.entries(proj)) {
    if (v === 1 || v === true) field[k] = true;
    else if (v === 0 || v === false) {
      if (k === "_id") field._id = false;
      else excludeNonId = true;
    }
  }
  if (excludeNonId) return null; // 含非 _id 字段排除，CloudBase field() 不支持，改为取全量后剔除
  return field;
}

function stripProjection(doc: AnyObj, proj: AnyObj): AnyObj {
  const out = { ...doc };
  for (const [k, v] of Object.entries(proj)) {
    if (v === 0 || v === false) delete out[k];
  }
  return out;
}

function stripProjectionArr(docs: any[], proj: AnyObj): any[] {
  return docs.map((d) => stripProjection(d, proj));
}

/* ------------------------------------------------------------------ */
/* aggregate 翻译                                                      */
/* ------------------------------------------------------------------ */

function translateExpr(expr: any): any {
  if (expr == null || typeof expr !== "object" || Array.isArray(expr)) {
    if (Array.isArray(expr)) return expr.map(translateExpr);
    return expr;
  }
  const { agg } = cmd();
  const keys = Object.keys(expr);
  if (keys.length === 1 && keys[0].startsWith("$")) {
    const op = keys[0].slice(1);
    const val = (expr as AnyObj)[keys[0]];
    const fn = agg && (agg as AnyObj)[op];
    if (typeof fn === "function") {
      if (Array.isArray(val)) return fn(...val.map(translateExpr));
      return fn(translateExpr(val));
    }
    return expr;
  }
  const out: AnyObj = {};
  for (const k of keys) out[k] = translateExpr(expr[k]);
  return out;
}

function translateGroupId(v: any): any {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o: AnyObj = {};
    for (const k of Object.keys(v)) o[k] = translateExpr(v[k]);
    return o;
  }
  return v;
}

function translateGroup(g: AnyObj): AnyObj {
  const out: AnyObj = {};
  for (const k of Object.keys(g)) {
    if (k === "_id") out._id = translateGroupId(g._id);
    else out[k] = translateExpr(g[k]);
  }
  return out;
}

function translateProject(p: AnyObj): AnyObj {
  const out: AnyObj = {};
  for (const k of Object.keys(p)) {
    if (k === "_id") {
      if (p._id === 1) out._id = true;
      continue; // _id:0 忽略（CloudBase 聚合 project 默认不包含 _id）
    }
    const v = p[k];
    if (v === 0) continue; // 排除型字段在列举包含字段时天然被排除
    out[k] = translateExpr(v);
  }
  return out;
}

function translateSort(s: AnyObj): AnyObj {
  const out: AnyObj = {};
  for (const [k, v] of Object.entries(s || {})) {
    out[k] = v === -1 || v === "desc" ? "desc" : "asc";
  }
  return out;
}

function applyStage(chain: any, stage: AnyObj): any {
  const key = Object.keys(stage)[0];
  const val = stage[key];
  switch (key) {
    case "$match":
      return chain.match(translateFilter(val));
    case "$group":
      return chain.group(translateGroup(val));
    case "$project":
      return chain.project(translateProject(val));
    case "$sort":
      return chain.sort(translateSort(val));
    case "$skip":
      return chain.skip(val);
    case "$limit":
      return chain.limit(val);
    case "$count":
      return chain.count(val);
    case "$lookup":
      return chain.lookup(val);
    case "$unwind":
      return chain.unwind(val);
    case "$addFields":
      return chain.addFields(val);
    case "$replaceRoot":
      return chain.replaceRoot(val);
    case "$sample":
      return chain.sample(val);
    case "$sortByCount":
      return chain.sortByCount(val);
    case "$bucket":
      return chain.bucket(val);
    case "$bucketAuto":
      return chain.bucketAuto(val);
    case "$geoNear":
      return chain.geoNear(val);
    default: {
      const m = key.replace(/^\$/, "");
      if (chain && typeof chain[m] === "function") return chain[m](val);
      return chain;
    }
  }
}

/* ------------------------------------------------------------------ */
/* 兼容集合 / 查询 / 聚合 类                                            */
/* ------------------------------------------------------------------ */

class FacadeQuery<T = any> {
  private proj: AnyObj | null;
  constructor(private chain: any, proj: AnyObj | null = null) {
    this.proj = proj;
  }
  sort(s: AnyObj) {
    for (const [k, v] of Object.entries(s || {})) {
      this.chain = this.chain.orderBy(k, v === -1 || v === "desc" ? "desc" : "asc");
    }
    return this;
  }
  skip(n: number) {
    this.chain = this.chain.skip(n);
    return this;
  }
  limit(n: number) {
    this.chain = this.chain.limit(n);
    return this;
  }
  project<U = T>(p: AnyObj): FacadeQuery<U> {
    this.proj = p;
    return this as unknown as FacadeQuery<U>;
  }
  async toArray(): Promise<T[]> {
    let q = this.chain;
    if (this.proj) {
      const field = buildField(this.proj);
      if (field) q = q.field(field);
    }
    const r = await q.get();
    let data = (r && r.data) || [];
    if (this.proj) {
      const field = buildField(this.proj);
      if (!field) data = stripProjectionArr(data, this.proj);
    }
    return data as T[];
  }
  async next(): Promise<T | null> {
    const arr = await this.toArray();
    return (arr && arr[0]) ?? null;
  }
}

class FacadeAggregate<T = any> {
  constructor(private chain: any, pipeline: any[]) {
    for (const stage of pipeline) this.chain = applyStage(this.chain, stage);
  }
  async toArray(): Promise<T[]> {
    const r = await this.chain.end();
    return (r && r.data) || [];
  }
  async next(): Promise<T | null> {
    const r = await this.chain.end();
    const data = (r && r.data) || [];
    return data[0] ?? null;
  }
}

class FacadeCollection<T = any> {
  constructor(private name: string) {}
  private native() {
    return getCloudBaseDb().collection(this.name);
  }

  async findOne<U = T>(
    filter: any,
    options?: { projection?: AnyObj },
  ): Promise<U | null> {
    const where = translateFilter(filter);
    let q: any = this.native().where(where);
    const proj = options?.projection;
    let strip = false;
    if (proj) {
      const field = buildField(proj);
      if (field) q = q.field(field);
      else strip = true;
    }
    const r = await q.limit(1).get();
    let doc = r && r.data && r.data[0] ? r.data[0] : null;
    if (doc && strip) doc = stripProjection(doc, proj!);
    return doc as U | null;
  }

  find<U = T>(filter: any, options?: { projection?: AnyObj }): FacadeQuery<U> {
    let q: any = this.native().where(translateFilter(filter));
    const proj = options?.projection;
    let stripProj: AnyObj | null = null;
    if (proj) {
      const field = buildField(proj);
      if (field) q = q.field(field);
      else stripProj = proj;
    }
    return new FacadeQuery<U>(q, stripProj);
  }

  async insertOne(doc: any) {
    try {
      const res = await this.native().add(doc);
      return { insertedId: res.id ?? (res.ids && res.ids[0]) ?? null, acknowledged: true };
    } catch (e) {
      throw toMongoError(e);
    }
  }

  async insertMany(docs: any[]) {
    try {
      const res = await this.native().add(docs);
      return { insertedIds: res.ids ?? [], insertedCount: docs.length };
    } catch (e) {
      throw toMongoError(e);
    }
  }

  async updateOne(filter: any, update: any, opts: { upsert?: boolean } = {}) {
    return this._update(filter, update, opts, false);
  }
  async updateMany(filter: any, update: any, opts: { upsert?: boolean } = {}) {
    return this._update(filter, update, opts, true);
  }
  async replaceOne(filter: any, doc: any, opts: { upsert?: boolean } = {}) {
    return this._update(filter, { $set: doc }, opts, false);
  }

  async _update(filter: any, update: any, opts: { upsert?: boolean }, multi: boolean) {
    const where = translateFilter(filter);
    const coll = this.native();
    if (opts.upsert) {
      const found = await coll.where(where).limit(1).get();
      if (!found.data || found.data.length === 0) {
        const insertDoc = buildUpsertDoc(filter, update);
        try {
          const res = await coll.add(insertDoc);
          return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: res.id ?? null };
        } catch (e) {
          throw toMongoError(e);
        }
      }
    }
    const withUpsertFlag = { ...update, __upsert: Boolean(opts.upsert) };
    const upd = buildUpdate(withUpsertFlag);
    let q: any = coll.where(where);
    if (multi) q = q.options({ multiple: true });
    const res = await q.update(upd);
    return {
      matchedCount: res.updated ?? 0,
      modifiedCount: res.updated ?? 0,
      upsertedCount: 0,
      upsertedId: null,
    };
  }

  async deleteOne(filter: any) {
    const r = await this.native().where(translateFilter(filter)).remove();
    return { deletedCount: Number(r.deleted ?? 0) };
  }
  async deleteMany(filter: any) {
    const r = await this.native().where(translateFilter(filter)).remove();
    return { deletedCount: Number(r.deleted ?? 0) };
  }

  async countDocuments(filter: any) {
    const r = await this.native().where(translateFilter(filter)).count();
    return r.total ?? 0;
  }
  async estimatedDocumentCount() {
    const r = await this.native().count();
    return r.total ?? 0;
  }

  aggregate<U = any>(pipeline: any[]): FacadeAggregate<U> {
    return new FacadeAggregate<U>(this.native().aggregate(), pipeline);
  }

  // CloudBase 索引在控制台管理，不通过 SDK 自动创建
  async createIndex() {
    return null;
  }
  async createIndexes() {
    return null;
  }
  async createSearchIndex() {
    return null;
  }
  async listSearchIndexes() {
    return [];
  }
}

export interface FacadeDb {
  collection<T = any>(name: string): FacadeCollection<T>;
  command(cmd: any): Promise<any>;
}

/** 兼容原 getDb()：返回 mongodb 风格的集合访问对象（底层为 CloudBase） */
export async function getDb(): Promise<FacadeDb> {
  if (!isDbConfigured()) {
    throw new Error(
      "CloudBase 未配置：请设置环境变量 CLOUDBASE_ENV / CLOUDBASE_SECRET_ID / CLOUDBASE_SECRET_KEY",
    );
  }
  return {
    collection(name: string) {
      return new FacadeCollection(name);
    },
    async command(c: any) {
      if (c && c.ping === 1) {
        await getCloudBaseDb()
          .collection("cases")
          .limit(1)
          .get()
          .catch(() => undefined);
      }
      return { ok: 1, ...c };
    },
  };
}

/** 兼容原 ensureIndexes()：CloudBase 索引在控制台管理 */
export async function ensureIndexes(): Promise<void> {
  if (!isDbConfigured()) return;
  // Intentionally a no-op: CloudBase document database indexes are managed in the console.
}
