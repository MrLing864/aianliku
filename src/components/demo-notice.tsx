import { FlaskConical } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <Alert className="border-amber-200/80 bg-amber-50/70 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <FlaskConical className="size-4" />
      {!compact && <AlertTitle>当前展示演示案例</AlertTitle>}
      <AlertDescription>{compact ? "演示数据" : "这些匿名内容只用于验证产品流程，不代表真实企业事实；接入 CloudBase 后可通过后台导入已核验案例。"}</AlertDescription>
    </Alert>
  );
}
