"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  CollectorCategory,
  CollectorDailyResult,
  CollectorRunRecord,
} from "@/lib/repositories/admin";

interface CategoryOption {
  value: CollectorCategory;
  label: string;
}

interface Props {
  daily: CollectorDailyResult;
  runs: CollectorRunRecord[];
  categories: CategoryOption[];
  dbConfigured: boolean;
}

function defaultFrom(): string {
  const d = new Date(Date.now() - 6 * 86_400_000);
  return d.toISOString().slice(0, 10);
}
function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_COUNTS: CollectorRunRecord["counts"] = {
  candidates: 0,
  aiCases: 0,
  success: 0,
  created: 0,
  updated: 0,
  failed: 0,
  skipped: 0,
};

function StatusBadge({ status }: { status: CollectorRunRecord["status"] }) {
  const map: Record<CollectorRunRecord["status"], string> = {
    running: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };
  const label: Record<CollectorRunRecord["status"], string> = {
    running: "运行中",
    success: "成功",
    partial: "部分成功",
    failed: "失败",
  };
  // 兜底：遇到未知状态时不要因 map[status] 为 undefined 而渲染异常
  const cls = map[status] || "bg-gray-100 text-gray-600";
  return <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{label[status] || status || "未知"}</span>;
}

export function CollectorsClient({ daily, runs, categories, dbConfigured }: Props) {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [catFilter, setCatFilter] = useState<CollectorCategory | "all">("all");
  const [byFilter, setByFilter] = useState<"all" | "cron" | "manual">("all");

  // 按日期范围过滤 daily 的 byDateCategory
  const filteredDaily = useMemo(() => {
    return daily.byDateCategory.filter((r) => r.date >= from && r.date <= to);
  }, [daily, from, to]);

  // 按分类 + 触发方式过滤 daily（用于前端分类汇总）
  const byCategoryFiltered = useMemo(() => {
    const m = new Map<CollectorCategory, { category: CollectorCategory; categoryName: string; success: number; failed: number; dedup: number; runs: number }>();
    for (const r of filteredDaily) {
      if (catFilter !== "all" && r.category !== catFilter) continue;
      const cur = m.get(r.category) || { category: r.category, categoryName: r.categoryName, success: 0, failed: 0, dedup: 0, runs: 0 };
      cur.success += r.success;
      cur.failed += r.failed;
      cur.dedup += r.dedup;
      cur.runs += r.runs;
      m.set(r.category, cur);
    }
    return Array.from(m.values());
  }, [filteredDaily, catFilter]);

  // 明细列表过滤
  const filteredRuns = useMemo(() => {
    return (runs || []).filter((r) => {
      const t = r.triggeredAt ? new Date(r.triggeredAt) : null;
      if (!t || Number.isNaN(t.getTime())) return false; // 脏数据不参与展示，避免 toISOString 抛错
      const d = t.toISOString().slice(0, 10);
      if (d < from || d > to) return false;
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (byFilter !== "all" && r.scheduledBy !== byFilter) return false;
      return true;
    });
  }, [runs, from, to, catFilter, byFilter]);

  const total = useMemo(() => {
    return byCategoryFiltered.reduce(
      (acc, c) => {
        acc.success += c.success;
        acc.failed += c.failed;
        acc.dedup += c.dedup;
        acc.runs += c.runs;
        return acc;
      },
      { success: 0, failed: 0, dedup: 0, runs: 0 }
    );
  }, [byCategoryFiltered]);

  if (!dbConfigured) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">采集监控</h1>
        <Card>
          <CardContent className="pt-6 text-amber-700">
            数据库未配置，暂无可展示的采集运行数据。配置 CloudBase 环境变量后重启即可。
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">采集监控</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">日期范围</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">运行次数</div>
            <div className="text-3xl font-bold">{total.runs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">成功入库</div>
            <div className="text-3xl font-bold text-green-600">{total.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">失败</div>
            <div className="text-3xl font-bold text-red-600">{total.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">去重（更新）</div>
            <div className="text-3xl font-bold text-blue-600">{total.dedup}</div>
          </CardContent>
        </Card>
      </div>

      {/* 分类汇总表 */}
      <Card>
        <CardHeader>
          <CardTitle>分类汇总</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCatFilter("all")}
              className={`px-3 py-1 rounded-full text-sm border ${catFilter === "all" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              全部
            </button>
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCatFilter(c.value)}
                className={`px-3 py-1 rounded-full text-sm border ${catFilter === c.value ? "bg-gray-900 text-white" : "bg-white"}`}
              >
                {c.label}
              </button>
            ))}
            <span className="mx-2 text-gray-300">|</span>
            <button
              onClick={() => setByFilter("all")}
              className={`px-3 py-1 rounded-full text-sm border ${byFilter === "all" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              全部触发
            </button>
            <button
              onClick={() => setByFilter("cron")}
              className={`px-3 py-1 rounded-full text-sm border ${byFilter === "cron" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              定时器
            </button>
            <button
              onClick={() => setByFilter("manual")}
              className={`px-3 py-1 rounded-full text-sm border ${byFilter === "manual" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              手动
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">采集器</th>
                  <th className="py-2 pr-4">触发</th>
                  <th className="py-2 pr-4 text-right">成功</th>
                  <th className="py-2 pr-4 text-right">失败</th>
                  <th className="py-2 pr-4 text-right">去重</th>
                  <th className="py-2 pr-4 text-right">运行次数</th>
                </tr>
              </thead>
              <tbody>
                {byCategoryFiltered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      所选范围暂无数据
                    </td>
                  </tr>
                )}
                {byCategoryFiltered.map((c) => (
                  <tr key={c.category} className="border-b">
                    <td className="py-2 pr-4">{c.categoryName}</td>
                    <td className="py-2 pr-4">
                      {byFilter === "manual" ? "手动" : byFilter === "cron" ? "定时器" : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right text-green-600 font-medium">{c.success}</td>
                    <td className="py-2 pr-4 text-right text-red-600 font-medium">{c.failed}</td>
                    <td className="py-2 pr-4 text-right text-blue-600 font-medium">{c.dedup}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{c.runs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 运行明细 */}
      <Card>
        <CardHeader>
          <CardTitle>运行明细（{filteredRuns.length}）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredRuns.length === 0 && (
            <div className="py-6 text-center text-gray-400">所选范围暂无运行记录</div>
          )}
          {filteredRuns.map((r, idx) => {
            // 关键兜底：历史脏数据中 counts 可能整体缺失，
            // 直接访问 r.counts.candidates 会抛 TypeError 并让整页 500。
            const c = r.counts || EMPTY_COUNTS;
            return (
            <div
              key={r.runId || `run-${idx}`}
              className="flex flex-wrap items-center justify-between gap-2 border rounded-lg px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.sourceName}</span>
                  <Badge variant="outline">{r.categoryName}</Badge>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {r.triggeredAt ? new Date(r.triggeredAt).toLocaleString("zh-CN") : "—"}
                  {" · "}
                  {r.scheduledBy === "cron" ? "定时器" : "手动"}
                </div>
                {r.errorMessage && (
                  <div className="text-xs text-red-500 mt-1 truncate max-w-xl">{r.errorMessage}</div>
                )}
              </div>
              <div className="flex gap-4 text-sm text-right">
                <div>
                  <div className="text-gray-400 text-xs">候选</div>
                  <div>{c.candidates}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">AI</div>
                  <div>{c.aiCases}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">成功</div>
                  <div className="text-green-600">{c.success}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">新增</div>
                  <div>{c.created}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">去重</div>
                  <div className="text-blue-600">{c.updated}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">失败</div>
                  <div className="text-red-600">{c.failed}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">跳过</div>
                  <div>{c.skipped}</div>
                </div>
              </div>
            </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
