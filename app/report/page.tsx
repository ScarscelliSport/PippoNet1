import { buildFornitureReport } from "@/lib/report";
import ReportForniture from "@/components/ReportForniture";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const rows = await buildFornitureReport();
  return <ReportForniture rows={rows} />;
}
