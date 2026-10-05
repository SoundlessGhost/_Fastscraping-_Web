"use client";

import { useState, type FormEvent } from "react";

export const SUPPORT_TOPICS = [
  "Technical issue",
  "Billing or invoice",
  "Bank transfer or invoice",
  "Buy credits or change plan",
  "Trial key",
  "New platform or endpoint",
  "Something else",
] as const;

/// Support request from the dashboard. The account email is attached on the
/// server, so the client only says what is wrong.
export default function SupportForm({
  email,
  services,
  initialTopic,
}: {
  email: string;
  services: string[];
  initialTopic?: string;
}) {
  const start = SUPPORT_TOPICS.find((t) => t === initialTopic) ?? SUPPORT_TOPICS[0];
  const [topic, setTopic] = useState<string>(start);
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    if (message.trim().length < 10) return setErr("Tell us a little more (at least 10 characters).");
    setErr("");
    setState("sending");
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, service, message }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not send.");
      setState("sent");
    } catch (e2) {
      setState("idle");
      setErr(e2 instanceof Error ? e2.message : "Could not send.");
    }
  }

  if (state === "sent") {
    return (
      <div className="ap2-form">
        <h3>Request sent</h3>
        <p className="ap2-ok">We reply to {email} within one business day. Live production issues are handled first.</p>
        <div className="ap2-row">
          <button
            className="ap2-btn ap2-btn--out"
            onClick={() => {
              setMessage("");
              setState("idle");
            }}
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="ap2-form" onSubmit={onSubmit} noValidate>
      <h3>Open a support request</h3>
      <div className="ap2-field">
        <label htmlFor="sp-topic">Topic</label>
        <select id="sp-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {SUPPORT_TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="ap2-field">
        <label htmlFor="sp-svc">Service (optional)</label>
        <select id="sp-svc" value={service} onChange={(e) => setService(e.target.value)}>
          <option value="">Not about one service</option>
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="ap2-field">
        <label htmlFor="sp-msg">What happened?</label>
        <textarea
          id="sp-msg"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Include a job ID, an item link or the error you saw. Never paste your API key."
        />
      </div>
      {err ? (
        <p className="ap2-err" role="alert">
          {err}
        </p>
      ) : null}
      <div className="ap2-row">
        <button type="submit" className="ap2-btn" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send request"}
        </button>
        <span className="ap2-note">Reply goes to {email}</span>
      </div>
    </form>
  );
}
