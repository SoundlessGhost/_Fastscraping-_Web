"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/// Cloudflare Turnstile widget. Renders nothing when no site key is configured,
/// so the form works unchanged on environments without keys.
export default function TurnstileWidget({
  onToken,
  resetSignal = 0,
}: {
  onToken: (token: string) => void;
  resetSignal?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);
  const cbRef = useRef(onToken);
  cbRef.current = onToken;

  function mount() {
    if (!TURNSTILE_SITE_KEY || !ref.current || !window.turnstile || idRef.current) return;
    idRef.current = window.turnstile.render(ref.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "light",
      callback: (t: string) => cbRef.current(t),
      "expired-callback": () => cbRef.current(""),
      "error-callback": () => cbRef.current(""),
    });
  }

  useEffect(() => {
    mount();
    return () => {
      if (idRef.current && window.turnstile) {
        try { window.turnstile.remove(idRef.current); } catch { /* ignore */ }
        idRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetSignal && idRef.current && window.turnstile) {
      window.turnstile.reset(idRef.current);
      cbRef.current("");
    }
  }, [resetSignal]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={mount}
      />
      <div ref={ref} className="fsx-turnstile" style={{ minHeight: 65, margin: "4px 0 12px" }} />
    </>
  );
}
