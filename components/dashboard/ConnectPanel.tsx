"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ServiceNode } from "@/lib/services/taxonomy";

// Asks for the key, then hands it to the server, which asks the service's own
// backend whether the key exists. We store it only if that backend says yes.

export default function ConnectPanel({ service, title }: { service: ServiceNode; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notReady = service.status !== "ACTIVE";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Read from the form, not React state: browser autofill does not fire
    // onChange, which would leave a controlled value empty.
    const apiKey = String(new FormData(e.currentTarget).get("apiKey") ?? "").trim();
    if (!apiKey) {
      setError("Paste the API key you use for this service.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/services/${service.slug}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message ?? "Could not connect that key.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (notReady) {
    return (
      <div className="cn">
        <div className="cn-box">
          <h2 className="cn-t">{title} isn&apos;t live yet</h2>
          <p className="cn-s">
            This service is in the catalog but not yet wired to a backend. Once it&apos;s running,
            it&apos;ll accept your key here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cn">
      <form className="cn-box" onSubmit={submit}>
        <h2 className="cn-t">Add your API key</h2>
        <p className="cn-s">
          {title} checks your key on its own server — exactly like it does when you call it. Paste the
          key and we&apos;ll ask it whether the key is yours.
        </p>

        <label className="cn-l" htmlFor="apiKey">
          API key
        </label>
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

        {error && <p className="cn-err">{error}</p>}

        <button className="btn btn-primary cn-btn" type="submit" disabled={busy}>
          {busy ? "Checking with the service…" : "Connect"}
        </button>

        <p className="cn-note">
          Stored encrypted, and only ever sent to this service. Remove it any time from Settings.
        </p>
      </form>
    </div>
  );
}
