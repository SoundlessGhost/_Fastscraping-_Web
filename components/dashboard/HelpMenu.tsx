"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOOK_CALL_URL } from "@/lib/site-links";
import { COMPANY } from "@/lib/company";
import { IcCal, IcDoc, IcHelp, IcMail } from "@/components/dashboard/icons";


/// "Help" in the dashboard top bar: every way to reach a person, one click.
export default function HelpMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="ds-help">
      {open && <button className="ds-help-scrim" onClick={() => setOpen(false)} aria-hidden="true" tabIndex={-1} />}
      <button
        className="ds-tb"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="ds-help-menu"
      >
        {IcHelp}
        <span className="ds-tb-label">Support</span>
      </button>
      {open && (
        <div className="ds-help-menu" id="ds-help-menu" role="menu">
          <Link href="/dashboard/support" role="menuitem">
            <span className="ds-item-ic">{IcDoc}</span>
            <span>
              <b>Open a support request</b>
              <small>Goes to the team with your account attached</small>
            </span>
          </Link>
          <a href={BOOK_CALL_URL} target="_blank" rel="noopener" role="menuitem">
            <span className="ds-item-ic">{IcCal}</span>
            <span>
              <b>Book a call with Khalid</b>
              <small>30 minutes on Google Meet</small>
            </span>
          </a>
          <a href={`mailto:${COMPANY.supportEmail}`} role="menuitem">
            <span className="ds-item-ic">{IcMail}</span>
            <span>
              <b>Email support</b>
              <small>{COMPANY.supportEmail}</small>
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
