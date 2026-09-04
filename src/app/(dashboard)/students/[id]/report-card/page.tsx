import { ReportCardPage } from "@/features/exam/components/ReportCardPage";

export default async function StudentReportCardRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportCardPage studentId={id} />;
}
