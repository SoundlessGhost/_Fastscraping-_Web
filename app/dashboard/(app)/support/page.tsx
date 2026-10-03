import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { platformLabel } from "@/lib/services/taxonomy";
import { BOOK_CALL_URL } from "@/lib/site-links";
import { COMPANY } from "@/lib/company";
import SupportForm from "@/components/dashboard/SupportForm";
import { IcCal, IcMail } from "@/components/dashboard/icons";

export const metadata: Metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  const [services, sp] = await Promise.all([getCatalogForUser(user.id), searchParams]);
  const mine = services.filter((s) => s.connections.length > 0).map((s) => `${platformLabel(s.platform)} · ${s.name}`);

  return (
    <div className="ap2">
      <div className="ap2-head">
        <h1>Support</h1>
        <p>
          Real engineers, not a ticket bot. Open a request below or email support directly. We work from GMT+6 and answer within one
          business day; live production issues come first.
        </p>
      </div>

      <div className="ap2-split">
        <SupportForm email={user.email} services={mine} initialTopic={sp.topic} />

        <div className="ap2-stack">
          <a className="ap2-chan ap2-chan--pri" href={BOOK_CALL_URL} target="_blank" rel="noopener">
            <span className="ap2-chan-ic">{IcCal}</span>
            <span>
              <b>Book a call with Khalid</b>
              <small>30 minutes on Google Meet, pick any open slot</small>
            </span>
          </a>
          <a className="ap2-chan" href={`mailto:${COMPANY.supportEmail}`}>
            <span className="ap2-chan-ic">{IcMail}</span>
            <span>
              <b>Email support</b>
              <small>{COMPANY.supportEmail}</small>
            </span>
          </a>
          <p className="ap2-note">
            For a faster fix, include the job ID or item link and the time it happened. Never send your API key in a message;
            we can see which key you use from your account.
          </p>
        </div>
      </div>
    </div>
  );
}
