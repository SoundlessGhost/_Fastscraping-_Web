import "../styles/dashboard.css";
import "../styles/dash-shell.css";
import "../styles/dash-pages.css";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import SettingsShell from "@/components/dashboard/SettingsShell";

// The settings area — its own sidebar (General, Account, …) behind the same
// session check as the dashboard.
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  return <SettingsShell user={user}>{children}</SettingsShell>;
}
