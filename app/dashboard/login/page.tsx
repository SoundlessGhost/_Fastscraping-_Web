import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

/// Middleware can only see whether a cookie exists, not whether it still means
/// anything — Prisma doesn't run on the edge. So the "you're already signed in,
/// go to the dashboard" bounce lives here, where the session can actually be
/// checked. A cookie whose session was revoked simply gets the login form.
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return <LoginForm />;
}
