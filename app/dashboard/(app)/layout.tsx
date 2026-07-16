import "../../styles/dashboard.css";
import "../../styles/dash-shell.css";
import "../../styles/dash-pages.css";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import DashShell from "@/components/dashboard/DashShell";

// Everything under this group is behind a real session check. The login page
// lives outside the group, so it keeps its own bare layout.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  const services = await getCatalogForUser(user.id);

  return (
    <DashShell user={user} services={services}>
      {children}
    </DashShell>
  );
}
