import { CaseEditor } from "@/components/case-editor";
export default function NewCasePage() { return <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold text-primary">案例管理</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">新建案例</h1><p className="mt-2 text-sm text-muted-foreground">先粘贴来源材料，再由 DeepSeek 辅助抽取字段。</p><div className="mt-7"><CaseEditor /></div></div>; }
