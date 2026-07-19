import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps { compact?: boolean; href?: string; className?: string; }

export function Logo({ compact = false, href = "/", className }: LogoProps) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 focus-ring rounded-md", className)} aria-label="AI案例库首页">
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-foreground text-background shadow-sm transition-transform group-hover:-rotate-2">
        <span className="text-[11px] font-bold tracking-[-0.08em]">AI</span>
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-[-0.025em]">AI案例库</span>
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">AI An Li Ku</span>
        </span>
      )}
    </Link>
  );
}
