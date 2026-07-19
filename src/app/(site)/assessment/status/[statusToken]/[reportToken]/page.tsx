import type { Metadata } from "next";
import { AssessmentProcessing } from "@/components/assessment-processing";

export const metadata: Metadata = {
  title: "AI 体检报告生成中",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

type Params = Promise<{ statusToken: string; reportToken: string }>;

export default async function AssessmentStatusPage({ params }: { params: Params }) {
  const { statusToken, reportToken } = await params;
  return (
    <main className="container-page py-12 sm:py-16 lg:py-20">
      <AssessmentProcessing statusToken={statusToken} reportToken={reportToken} />
    </main>
  );
}
