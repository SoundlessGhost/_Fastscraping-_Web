// Standalone public page for the codes view — reuses the dashboard/admin styles
// (.ds-head, .dash-title, .tc-*) without the admin sidebar shell. The marketing
// header/footer are already suppressed for /codes via isAppRoute in lib/chrome.
import "../../styles/dashboard.css";
import "../../styles/dash-pages.css";
import "../../styles/admin.css";

export default function CodesLayout({ children }: { children: React.ReactNode }) {
  return <div className="codes-standalone">{children}</div>;
}
