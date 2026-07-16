import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import Overview from "@/components/dashboard/Overview";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  return <Overview user={user} services={await getCatalogForUser(user.id)} />;
}
