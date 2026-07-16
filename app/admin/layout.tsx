import type { Metadata } from "next";
import "../styles/dashboard.css";
import "../styles/dash-shell.css";
import "../styles/dash-pages.css";
import "../styles/admin.css";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Middleware only checks that a session cookie exists; the role check is here,
// where Prisma can run.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return <AdminShell user={user}>{children}</AdminShell>;
}
