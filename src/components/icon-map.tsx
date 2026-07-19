import { Bot, ChartNoAxesCombined, Code2, Factory, Globe2, GraduationCap, HeartPulse, Landmark, LibraryBig, MessagesSquare, ReceiptText, ScanSearch, ScanText, ShoppingBag, Sparkles, TrendingUp, Truck, Workflow, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { Bot, ChartNoAxesCombined, Code2, Factory, Globe2, GraduationCap, HeartPulse, Landmark, LibraryBig, MessagesSquare, ReceiptText, ScanSearch, ScanText, ShoppingBag, Sparkles, TrendingUp, Truck, Workflow };
export function CatalogIcon({ name, className }: { name: string; className?: string }) { const Icon = icons[name] ?? Sparkles; return <Icon className={className} />; }
