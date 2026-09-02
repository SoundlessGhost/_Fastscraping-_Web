import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import Overview from "@/components/dashboard/Overview";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  const services = await getCatalogForUser(user.id);

  // The sidebar has no Overview entry any more, so landing on /dashboard would
  // strand the client on a page nothing links back to. Send them straight to
  // the first service in the catalog — the one the sidebar shows at the top —
  // so signing in lands on real usage instead of an empty prompt.
  const first = services.find((s) => s.status === "ACTIVE") ?? services[0];
  if (first) redirect(`/dashboard/s/${first.slug}`);

  // No catalog at all (a brand-new install): the prompt is the only thing left
  // to show, so keep it rather than redirecting into nowhere.
  return <Overview user={user} services={services} />;
}
