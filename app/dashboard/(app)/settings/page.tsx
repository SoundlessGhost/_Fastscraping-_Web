import { redirect } from "next/navigation";

// Settings moved to its own /settings area — keep the old link working.
export default function OldSettingsRedirect() {
  redirect("/settings/general");
}
