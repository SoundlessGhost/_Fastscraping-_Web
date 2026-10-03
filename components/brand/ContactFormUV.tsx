"use client";

import { useState, type FormEvent } from "react";

const TOPICS = [
  "Shopee API trial key",
  "Restaurant / food-delivery data",
  "Managed pipeline quote",
  "A new platform (custom scraper)",
  "Dataset on demand",
  "White-label / reseller",
  "Help with my existing account",
  "Something else",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Status = "idle" | "sending" | "sent" | "error";

/// Posts the same payload as the old form to /api/contact (Resend email to
/// CONTACT_TO), so the backend is untouched.
export default function ContactFormUV() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    if (name.trim().length < 2) return setErr("Add your name so we know who to reply to.");
    if (!EMAIL_RE.test(email)) return setErr("Add a valid work email.");
    setErr("");
    setStatus("sending");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, topic, message }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d?.ok) throw new Error(d?.error || "Could not send.");
      setStatus("sent");
    } catch (e2) {
      setStatus("error");
      setErr(e2 instanceof Error ? e2.message : "Could not send.");
    }
  }

  if (status === "sent") {
    return (
      <div className="fsx-form">
        <h2 className="fsx-h3">Thanks, {name.trim().split(/\s+/)[0]}.</h2>
        <p className="fsx-ok">
          Your note is with Khalid. You&apos;ll get a reply at {email} within 24 hours, usually much sooner.
        </p>
      </div>
    );
  }

  return (
    <form className="fsx-form" onSubmit={onSubmit} noValidate style={{ flex: "1 1 460px", minWidth: 0 }}>
      <h2 className="fsx-h3">Request a trial key or a sample</h2>
      <div className="fsx-grid-2" style={{ gap: 16 }}>
        <div className="fsx-field">
          <label htmlFor="cf-name">Name</label>
          <input id="cf-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="fsx-field">
          <label htmlFor="cf-email">Work email</label>
          <input id="cf-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="fsx-field">
        <label htmlFor="cf-company">Company</label>
        <input id="cf-company" type="text" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div className="fsx-field">
        <label htmlFor="cf-topic">What do you need?</label>
        <select id="cf-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="fsx-field">
        <label htmlFor="cf-msg">Product links or target sites (3–5 is plenty)</label>
        <textarea id="cf-msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      {err ? (
        <p className="fsx-err" role="alert">
          {err}
        </p>
      ) : null}
      <button type="submit" className="fsx-btn fsx-btn-lg" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send request"}
      </button>
      <span className="fsx-note">No newsletter, no sales sequence. One reply from Khalid.</span>
    </form>
  );
}
