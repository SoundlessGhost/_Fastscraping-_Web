"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { scrollShellTop } from "@/lib/chrome";

// Next's built-in "scroll to top on navigation" targets `window`, but the
// marketing shell scrolls inside `.site-scroll` (body is overflow:hidden), so
// navigating between pages used to leave you wherever you were scrolled. This
// resets the shell to the top on every route change — except when the URL has a
// hash, so `/solutions#pricing-intelligence` still lands on its section.
export default function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    scrollShellTop(false); // instant on navigation; smooth is for the same-page taps
  }, [pathname]);
  return null;
}
