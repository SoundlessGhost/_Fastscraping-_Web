"use client";

import { useEffect, useState } from "react";

// "Add another key" as a modal, in the same window-chrome as the confirm dialog
// (components/ui/Confirm) — reuses its .cf-* shell, with the connect form's
// .cn-* fields inside. Opened from the key switcher and from Settings; the whole
// add flow now happens in place, without leaving the usage view.

const TagGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11.5V5a2 2 0 0 1 2-2h6.5a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8l-6.6 6.6a2 2 0 0 1-2.8 0L3.6 12.9a2 2 0 0 1-.6-1.4Z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </svg>
);
const KeyGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2 20 3" />
    <path d="m17 6 2.6 2.6" />
    <path d="m14 9 2.6 2.6" />
  </svg>
);

export default function AddKeyDialog({
  slug,
  serviceTitle,
  onClose,
  onAdded,
}: {
  slug: string;
  serviceTitle: string;
  /// Called on cancel / dismiss.
  onClose: () => void;
  /// Called once the backend accepts the key, with the new key's id.
  onAdded: (keyId: string | undefined) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Esc dismisses (but not mid-request, so a stray key can't drop a pending add).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Read from the form, not React state: browser autofill does not fire
    // onChange, which would leave a controlled value empty.
    const fd = new FormData(e.currentTarget);
    const label = String(fd.get("label") ?? "").trim();
    const apiKey = String(fd.get("apiKey") ?? "").trim();
    if (!label) return setError("Give this key a name so you can tell it apart.");
    if (!apiKey) return setError("Paste the API key you use for this service.");

    setBusy(true);
    try {
      const res = await fetch(`/api/services/${slug}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, label }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message ?? "Could not connect that key.");
        return;
      }
      onAdded(body.key?.id);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cf-scrim" onClick={() => !busy && onClose()}>
      <form
        className="cf-box ak-box"
        role="dialog"
        aria-modal="true"
        aria-label="Add another key"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="cf-bar">
          <span className="cf-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="cf-bar-t">add key</span>
        </div>

        <div className="cf-body">
          <h2 className="cf-title">Add another key</h2>
          <p className="cf-text">
            Connect another key to {serviceTitle}. Give it a name so you can switch between your keys.
          </p>

          <label className="cn-l" htmlFor="ak-name">
            Key name
          </label>
          <div className="cn-field">
            <span className="cn-field-ico">{TagGlyph}</span>
            <input
              id="ak-name"
              name="label"
              className="cn-in"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
              placeholder="Production…"
              disabled={busy}
              autoFocus
            />
          </div>

          <label className="cn-l cn-l--gap" htmlFor="ak-key">
            API key
          </label>
          <div className="cn-field">
            <span className="cn-field-ico">{KeyGlyph}</span>
            <input
              id="ak-key"
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

          <div className="cf-acts">
            <button type="button" className="cf-btn cf-cancel" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="cf-btn cf-ok" disabled={busy}>
              {busy ? "Checking…" : "Add key"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
