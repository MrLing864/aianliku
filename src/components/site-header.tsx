import Link from "next/link";
import { ArrowUpRight, Menu, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/cases", label: "AI案例" },
  { href: "/industries/manufacturing", label: "行业" },
  { href: "/scenarios/knowledge-base", label: "AI场景" },
  { href: "/assessment", label: "企业体检" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl supports-[backdrop-filter]:bg-background/78">
      <div className="container-page flex h-[68px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="icon" asChild aria-label="搜索案例"><Link href="/cases"><Search /></Link></Button>
          <Button asChild className="group rounded-full px-5"><Link href="/assessment">免费 AI 体检<ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link></Button>
        </div>
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="打开导航"><Menu /></Button></SheetTrigger>
          <SheetContent side="right" className="w-[86vw] max-w-sm p-0">
            <SheetHeader className="border-b p-5"><SheetTitle className="sr-only">网站导航</SheetTitle><Logo /></SheetHeader>
            <nav className="grid gap-1 p-4" aria-label="移动端导航">
              {navItems.map((item) => <Button key={item.href} variant="ghost" size="lg" asChild className="justify-start text-base"><Link href={item.href}>{item.label}</Link></Button>)}
              <Button size="lg" asChild className="mt-3"><Link href="/assessment">免费 AI 体检<ArrowUpRight /></Link></Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
