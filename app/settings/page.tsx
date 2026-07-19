import { redirect } from "next/navigation";

// /settings opens on General by default.
export default function SettingsIndex() {
  redirect("/settings/general");
}
