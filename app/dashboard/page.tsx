import DashboardHome from "@/components/dashboard/DashboardHome";

// Rendered only after the client confirms who is signed in, so there is no
// static shell to validate for instant navigation (same on every dashboard page).
export const instant = false;

export default function DashboardPage() {
  return <DashboardHome />;
}
