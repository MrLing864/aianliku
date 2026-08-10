import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-page grid min-h-[70vh] place-items-center py-20 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border bg-card text-primary">
          <SearchX className="size-7" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">页面走丢了</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          你访问的页面可能已被移动或删除。试试从案例库重新检索，或直接浏览热门行业与场景。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/cases">浏览全部案例<ArrowRight /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/industries/manufacturing">热门行业</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/scenarios/knowledge-base">热门场景</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
