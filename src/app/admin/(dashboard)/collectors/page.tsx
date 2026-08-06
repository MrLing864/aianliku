import { getAdminDbOrNull } from "@/src/lib/admin-auth";
import {
  getCollectorRunDaily,
  listCollectorRuns,
  type CollectorCategory,
  type CollectorDailyResult,
  type CollectorRunRecord,
} from "@/src/lib/repositories/admin";
import { CollectorsClient } from "./collectors-client";

export const dynamic = "force-dynamic";

const ALL_CATEGORIES: { value: CollectorCategory; label: string }[] = [
  { value: "internet_giant", label: "互联网大厂" },
  { value: "government", label: "政府机关" },
  { value: "university", label: "高等院校" },
  { value: "famous_company", label: "知名企业" },
];

export default async function AdminCollectorsPage() {
  const db = await getAdminDbOrNull();
  let daily: CollectorDailyResult = { rangeDays: 30, byDateCategory: [], byCategory: [] };
  let runs: CollectorRunRecord[] = [];

  if (db) {
    // 拉取近 30 天数据，前端按日期范围 + 分类过滤，无需实时查询
    daily = await getCollectorRunDaily(30);
    runs = await listCollectorRuns({ limit: 500 });
  }

  return (
    <CollectorsClient
      daily={daily}
      runs={runs}
      categories={ALL_CATEGORIES}
      dbConfigured={!!db}
    />
  );
}
