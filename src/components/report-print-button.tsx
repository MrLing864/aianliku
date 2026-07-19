"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportPrintButton() {
  return <Button type="button" variant="outline" size="sm" onClick={() => window.print()}><Printer />打印 / 保存 PDF</Button>;
}
