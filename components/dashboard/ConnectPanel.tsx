"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceNode } from "@/lib/services/taxonomy";

// Asks for the key, then hands it to the server, which asks the service's own
// backend whether the key exists. We store it only if that backend says yes.
//
// This is the first thing a client sees for a service they haven't connected,
// so it doubles as the pitch: alongside the key form it previews exactly what
// unlocks the moment the key checks out, and spells out how connecting works.

// Inline glyphs — line icons that inherit currentColor, sized by their parent
// in CSS so the same drawing serves the crest, the input and the notes.
const KeyGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2 20 3" />
    <path d="m17 6 2.6 2.6" />
    <path d="m14 9 2.6 2.6" />
  </svg>
);

const LockGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const CheckGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const TagGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11.5V5a2 2 0 0 1 2-2h6.5a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8l-6.6 6.6a2 2 0 0 1-2.8 0L3.6 12.9a2 2 0 0 1-.6-1.4Z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </svg>
);

/// What the dashboard shows once a key is in — kept honest: these are the real
/// panels a connected service renders, not decoration.
const FEATURES = [
  { k: "Live volume", d: "Today, 7-day, 30-day and lifetime requests — refreshed every few seconds." },
  { k: "Prepaid credits", d: "Purchased, used and remaining, billed off your successful jobs." },
  { k: "Job health", d: "Completed, not found and failed, with your success rate." },
  { k: "Daily breakdown", d: "A day-by-day chart, your busiest days, and a per-date lookup." },
];

const STEPS = [
  { t: "Paste your key", d: "The same key you already use to call this service." },
  { t: "We check it with the service", d: "We ask its own server if the key is yours — nothing is saved until it says yes." },
  { t: "Your usage loads", d: "Live figures appear here and keep updating on their own." },
];

// Fixed heights so the preview chart is identical on server and client (no
// hydration mismatch) — it's an illustration, not data.
const BARS = [38, 54, 47, 68, 61, 82, 55, 66, 44, 73, 50, 63];

/// The always-present right rail: a skeleton of the real dashboard (dashes, not
/// invented numbers) plus the feature list, so the page reads as "here's what
/// you're about to unlock" rather than one lonely form.
function Preview() {
  return (
    <aside className="cn-preview" aria-hidden="true">
      <div className="cn-pv-eyebrow">Once connected</div>

      <div className="cn-pv-tiles">
        {["Today", "Last 7 days", "Credits left"].map((l) => (
          <div className="cn-pv-tile" key={l}>
            <span className="cn-pv-tl">{l}</span>
            <span className="cn-pv-tv">—</span>
          </div>
        ))}
      </div>

      <div className="cn-pv-chart">
        {BARS.map((h, i) => (
          <span className="cn-pv-bar" style={{ height: `${h}%` }} key={i} />
        ))}
      </div>

      <ul className="cn-feat">
        {FEATURES.map((f) => (
          <li className="cn-feat-row" key={f.k}>
            <span className="cn-feat-ck">{CheckGlyph}</span>
            <span>
              <b>{f.k}</b>
              <span className="cn-feat-d">{f.d}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Steps() {
  return (
    <div className="cn-steps">
      {STEPS.map((s, i) => (
        <div className="cn-step" key={s.t}>
          <span className="cn-step-n">{i + 1}</span>
          <div>
            <div className="cn-step-t">{s.t}</div>
            <p className="cn-step-d">{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ConnectPanel({
  service,
  title,
  // "first" is the empty state (no keys yet); "add" is a client who already has
  // keys connecting another one. Add mode drops the preview/steps pitch and
  // sends them back to their usage once the key checks out.
  mode = "first",
}: {
  service: ServiceNode;
  title: string;
  mode?: "first" | "add";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notReady = service.status !== "ACTIVE";
  const isAdd = mode === "add";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Read from the form, not React state: browser autofill does not fire
    // onChange, which would leave a controlled value empty.
    const fd = new FormData(e.currentTarget);
    const apiKey = String(fd.get("apiKey") ?? "").trim();
    const label = String(fd.get("label") ?? "").trim();
    if (!label) {
      setError("Give this key a name so you can tell it apart.");
      return;
    }
    if (!apiKey) {
      setError("Paste the API key you use for this service.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/services/${service.slug}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, label }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message ?? "Could not connect that key.");
        return;
      }
      // Land on the key we just added; a first key just reveals the usage view.
      if (isAdd && body.key?.id) {
        router.push(`/dashboard/s/${service.slug}?k=${body.key.id}`);
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cn">
      <header className="cn-head">
        <div className="cn-head-row">
          <h1 className="cn-title">{title}</h1>
          {!isAdd && (
            <span className={`cn-flag ${notReady ? "cn-flag--soon" : "cn-flag--live"}`}>
              {notReady ? "coming soon" : "not connected"}
            </span>
          )}
        </div>
        <p className="cn-lead">
          {notReady
            ? "This endpoint is in the catalog but isn't wired to a backend yet. The moment it's live, you'll add your key right here and your usage will show up."
            : isAdd
              ? "Connect another key to this service. Give it a name so you can switch between your keys and read each one's usage on its own."
              : "Add the API key you already use for this service to see your live usage — volume, credits and job health, all in one place."}
        </p>
      </header>

      <div className={`cn-grid ${isAdd ? "cn-grid--solo" : ""}`}>
        {notReady ? (
          <div className="cn-box cn-box--soon">
            <h2 className="cn-t">Not live yet</h2>
            <p className="cn-s">
              We&apos;re still wiring {title} to its backend. Check back shortly — nothing else is needed
              from you until then.
            </p>
          </div>
        ) : (
          <form className="cn-box cn-box--form" onSubmit={submit}>
            <div className="cn-box-head">
              <span className="cn-ico">{KeyGlyph}</span>
              <div>
                <h2 className="cn-t">{isAdd ? "Add another key" : "Add your API key"}</h2>
                <p className="cn-s">
                  {title} checks your key on its own server — exactly like it does when you call it. Name it,
                  paste the key, and we&apos;ll ask the service whether the key is yours.
                </p>
              </div>
            </div>

            <label className="cn-l" htmlFor="keyName">
              Key name
            </label>
            <div className="cn-field">
              <span className="cn-field-ico">{TagGlyph}</span>
              <input
                id="keyName"
                name="label"
                className="cn-in"
                type="text"
                autoComplete="off"
                spellCheck={false}
                maxLength={12}
                placeholder="Production…"
                disabled={busy}
              />
            </div>

            <label className="cn-l cn-l--gap" htmlFor="apiKey">
              API key
            </label>
            <div className="cn-field">
              <span className="cn-field-ico">{KeyGlyph}</span>
              <input
                id="apiKey"
                name="apiKey"
                className="cn-in"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder="sk_…"
                disabled={busy}
              />
            </div>

            {error && <p className="cn-err">{error}</p>}

            <button className="btn btn-primary cn-btn" type="submit" disabled={busy}>
              {busy ? "Checking with the service…" : isAdd ? "Add key" : "Connect"}
            </button>

            <p className="cn-note">
              <span className="cn-note-ico">{LockGlyph}</span>
              <span>Stored encrypted, and only ever sent to this service. Remove it any time from the switcher or Settings.</span>
            </p>

            {isAdd && (
              <button
                type="button"
                className="cn-back"
                onClick={() => router.push(`/dashboard/s/${service.slug}`)}
                disabled={busy}
              >
                ← Back to usage
              </button>
            )}
          </form>
        )}

        {!isAdd && <Preview />}
      </div>

      {!isAdd && <Steps />}
    </div>
  );
}
