import { DashboardView } from "src/features/admin/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <DashboardView />;
}
