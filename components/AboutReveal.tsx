"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal for the About page. Elements marked [data-reveal] fade up when
 * they enter the viewport; the [data-journey] block draws its green line in.
 *
 * Content is visible by default (nothing is hidden in CSS), so if JS never runs
 * the page still reads fine. On mount we only arm the elements that are still
 * below the fold, then hand them to an IntersectionObserver — the same approach
 * the design source uses. Respects prefers-reduced-motion.
 */
export default function AboutReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const line = document.querySelector<HTMLElement>("[data-journey-line]");
    const vh = window.innerHeight;

    els.forEach((el) => {
      // Already on screen at load — leave it be.
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      const d = Number(el.dataset.delay || 0);
      el.style.opacity = "0";
      el.style.transform = "translateY(22px)";
      el.style.transition = `opacity .7s ease ${d}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${d}ms`;
    });

    if (line) {
      line.style.transform = "scaleX(0)";
      line.style.transition = "transform 1.6s cubic-bezier(.3,.6,.2,1) .15s";
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const t = e.target as HTMLElement;
          if (t.dataset.journey !== undefined) {
            if (line) line.style.transform = "scaleX(1)";
          } else {
            t.style.opacity = "1";
            t.style.transform = "none";
          }
          io.unobserve(t);
        });
      },
      { threshold: 0.15 },
    );

    els.forEach((el) => io.observe(el));
    const j = document.querySelector("[data-journey]");
    if (j) io.observe(j);

    return () => io.disconnect();
  }, []);

  return null;
}
