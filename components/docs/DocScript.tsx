"use client";

import { useEffect } from "react";

/// Runs a generated doc page's inline script on every mount. next/script runs an inline script with an id only once
/// per session, so after a client-side navigation away and back the doc's code tabs, copy buttons and section
/// highlight would stop working. A fresh <script> element per mount avoids that; the doc script guards itself
/// (data-ready on its root), so a second run on the same DOM does nothing.
export default function DocScript({ code }: { code: string }) {
  useEffect(() => {
    const s = document.createElement("script");
    s.text = code;
    document.body.appendChild(s);
    s.remove();
  }, [code]);
  return null;
}
