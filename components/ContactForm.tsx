"use client";

import { useState, type FormEvent } from "react";

const TOPICS = [
  "Scraping API access",
  "A structured endpoint (Amazon, Google, Zillow…)",
  "Building a custom API for my site",
  "High-volume or async jobs",
  "Enterprise plan & invoicing",
  "Help with my existing account",
  "Something else",
];

const PERSONAL =
  /@(gmail|yahoo|hotmail|outlook|live|icloud|aol|proton|protonmail|gmx|yandex|mail)\./i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");

  const emailOk = EMAIL_RE.test(email);
  const personalWarn = emailOk && PERSONAL.test(email);
  const firstName = name.trim().split(/\s+/)[0] || "there";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    // Validation — first failure wins, matching the design.
    if (name.trim().length < 2)
      return setErr("Add your name so we know who to reply to.");
    if (!emailOk) return setErr("Check the email address. It needs a domain.");
    if (!topic) return setErr("Pick the topic closest to your question.");

    setErr("");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          topic,
          message: msg.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setErr(data.error || "Could not send your question. Try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErr("Network error. Try again.");
      setStatus("error");
    }
  }

  function reset() {
    setName("");
    setCompany("");
    setEmail("");
    setTopic("");
    setMsg("");
    setErr("");
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className="cx-form-card">
        <div className="cx-sent">
          <div className="cx-sent-mark">✓</div>
          <div className="cx-sent-h">Message received, {firstName}.</div>
          <p className="cx-sent-p">
            We&apos;ll reply to <strong>{email}</strong> within one business day,
            with a clear next step for your question.
          </p>
          <div className="cx-summary">
            <div className="cx-summary-row">
              <span className="cx-summary-k">Topic</span>
              <span className="cx-summary-v">{topic || "—"}</span>
            </div>
            <div className="cx-summary-row">
              <span className="cx-summary-k">Company</span>
              <span className="cx-summary-v">{company || "—"}</span>
            </div>
            <div className="cx-summary-row">
              <span className="cx-summary-k">Email</span>
              <span className="cx-summary-v">{email}</span>
            </div>
          </div>
          <button type="button" className="cx-again" onClick={reset}>
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cx-form-card">
      <form onSubmit={handleSubmit} noValidate>
        <div className="cx-form-title">Send us your data question</div>
        <div className="cx-form-sub">
          Takes about a minute. Fields marked optional can be skipped.
        </div>

        <div className="cx-fields">
          <div className="cx-row2">
            <div>
              <div className="cx-label">Full name</div>
              <input
                type="text"
                className="cx-input"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr("");
                }}
              />
            </div>
            <div>
              <div className="cx-label">Company</div>
              <input
                type="text"
                className="cx-input"
                autoComplete="organization"
                placeholder="Your company name"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setErr("");
                }}
              />
            </div>
          </div>

          <div>
            <div className="cx-label">Work email</div>
            <input
              type="email"
              className={`cx-input${personalWarn ? " warn" : ""}`}
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr("");
              }}
            />
            {personalWarn && (
              <div className="cx-warn">
                That looks like a personal address. A company email gets you a
                faster, more specific reply.
              </div>
            )}
          </div>

          <div>
            <div className="cx-label">How can we help?</div>
            <div className="cx-select-wrap">
              <select
                className={`cx-select${topic ? "" : " placeholder"}`}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setErr("");
                }}
              >
                <option value="" disabled>
                  Pick the closest topic
                </option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="cx-select-arr">▼</span>
            </div>
          </div>

          <div>
            <div className="cx-label">
              Anything else <span className="opt">· optional</span>
            </div>
            <textarea
              className="cx-textarea"
              rows={4}
              placeholder="e.g. Daily prices, stock and seller data for 20,000 SKUs on Shopee and Temu, delivered to our S3 bucket every morning."
              value={msg}
              onChange={(e) => setMsg(e.target.value.slice(0, 4000))}
            />
          </div>
        </div>

        {err && <div className="cx-err">{err}</div>}

        <button
          type="submit"
          className="cx-submit"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send my data question"}{" "}
          <span style={{ opacity: 0.6 }}>→</span>
        </button>
        <p className="cx-privacy">
          We use these details only to reply to you. See our{" "}
          <a href="/privacy">privacy policy</a>.
        </p>
      </form>
    </div>
  );
}
