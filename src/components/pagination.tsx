import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({ page, pageCount, params }: { page: number; pageCount: number; params: URLSearchParams }) {
  if (pageCount <= 1) return null;
  function href(nextPage: number) { const copy = new URLSearchParams(params); copy.set("page", String(nextPage)); return `?${copy}`; }
  const pages = Array.from(new Set([1, page - 1, page, page + 1, pageCount])).filter((item) => item >= 1 && item <= pageCount);
  return <nav aria-label="案例分页" className="mt-10 flex items-center justify-center gap-1.5">
    <Button variant="outline" size="icon" asChild={page > 1} disabled={page <= 1}>{page > 1 ? <Link href={href(page - 1)} aria-label="上一页"><ChevronLeft /></Link> : <ChevronLeft />}</Button>
    {pages.map((item, index) => <span key={item} className="contents">{index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}<Button variant={item === page ? "default" : "outline"} size="icon" asChild><Link href={href(item)} aria-current={item === page ? "page" : undefined}>{item}</Link></Button></span>)}
    <Button variant="outline" size="icon" asChild={page < pageCount} disabled={page >= pageCount}>{page < pageCount ? <Link href={href(page + 1)} aria-label="下一页"><ChevronRight /></Link> : <ChevronRight />}</Button>
  </nav>;
}
