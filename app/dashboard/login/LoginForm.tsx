"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../styles/login.css";

const MAIL = "https://mail.google.com/mail/?view=cm&fs=1&to=khalid@fastscraping.com";
const RESEND_COOLDOWN = 60;

type Mode = "login" | "signup" | "forgot";

const PROMPT: Record<Mode, { cmd: string; note: string }> = {
  login: { cmd: "auth --login", note: "# email + password" },
  signup: { cmd: "auth --signup", note: "# we'll email you a 6-digit code" },
  forgot: { cmd: "auth --reset", note: "# we'll email you a reset code" },
};

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [clock, setClock] = useState("--:--:-- UTC");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const d = new Date();
      setClock(`${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    firstField.current?.focus();
  }, [mode, step]);

  function goto(next: Mode) {
    setMode(next);
    setStep(1);
    setError("");
    setNotice("");
    setCode("");
  }

  async function post(url: string, body: unknown) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = (await r.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      role?: string;
    };
    return { r, d };
  }

  function finish() {
    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 800);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const val = (k: string) => String(fd.get(k) ?? "").trim();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      // ---------- LOGIN ----------
      if (mode === "login") {
        const { r, d } = await post("/api/auth/login", {
          email: val("email"),
          password: String(fd.get("password") ?? ""),
        });
        if (!r.ok || !d.ok) return setError(d.error || "Login failed.");
        return finish();
      }

      // ---------- SIGNUP ----------
      if (mode === "signup") {
        if (step === 1) {
          const addr = val("email");
          const { r, d } = await post("/api/auth/signup", { email: addr });
          if (!r.ok || !d.ok) return setError(d.error || "Could not send the code.");
          setEmail(addr);
          setCooldown(RESEND_COOLDOWN);
          setNotice(`Code sent to ${addr}`);
          return setStep(2);
        }
        if (step === 2) {
          const c = val("code");
          if (!/^\d{6}$/.test(c)) return setError("Enter the 6-digit code.");
          setCode(c);
          return setStep(3);
        }
        const pw = String(fd.get("password") ?? "");
        if (pw !== String(fd.get("confirm") ?? "")) return setError("Passwords don't match.");
        const { r, d } = await post("/api/auth/signup/verify", {
          email,
          code,
          password: pw,
          firstName: val("firstName") || undefined,
          lastName: val("lastName") || undefined,
          company: val("company") || undefined,
        });
        if (!r.ok || !d.ok) {
          setError(d.error || "Could not create the account.");
          if ((d.error || "").toLowerCase().includes("code")) setStep(2);
          return;
        }
        return finish();
      }

      // ---------- FORGOT ----------
      if (step === 1) {
        const addr = val("email");
        const { r, d } = await post("/api/auth/forgot", { email: addr });
        if (!r.ok || !d.ok) return setError(d.error || "Something went wrong.");
        setEmail(addr);
        setCooldown(RESEND_COOLDOWN);
        setNotice(`If an account exists for ${addr}, a code is on its way.`);
        return setStep(2);
      }
      const pw = String(fd.get("password") ?? "");
      if (pw !== String(fd.get("confirm") ?? "")) return setError("Passwords don't match.");
      const { r, d } = await post("/api/auth/reset", {
        email,
        code: val("code"),
        password: pw,
      });
      if (!r.ok || !d.ok) return setError(d.error || "Could not reset the password.");
      return finish();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError("");
    const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/forgot";
    const { r, d } = await post(url, { email });
    if (!r.ok || !d.ok) setError(d.error || "Could not resend.");
    else {
      setCooldown(RESEND_COOLDOWN);
      setNotice("New code sent.");
    }
    setBusy(false);
  }

  const label = busy
    ? "Working"
    : mode === "login"
      ? "Authenticate"
      : mode === "signup"
        ? step === 1
          ? "Send code"
          : step === 2
            ? "Continue"
            : "Create account"
        : step === 1
          ? "Send reset code"
          : "Set new password";

  const eye = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <main className="lg-split">
      {/* LEFT · editorial */}
      <section className="lg-left">
        <header className="lg-brandrow">
          <Link href="/" className="brand">
            <span className="brand-mark">f</span>
            <span>Fastscraping</span>
          </Link>
          <Link href="/" className="lg-back">
            ← fastscraping.com
          </Link>
        </header>

        <div className="lg-left-body">
          <span className="eyebrow">Client access · live usage</span>
          <h1 className="lg-h1">
            Your pipeline,
            <em>live —</em>
            <span className="lg-h1-line">as it flows.</span>
          </h1>
          <p className="lg-sub">
            Every service you run with us, in one place.{" "}
            <strong>Requests, regions, job health — one login.</strong>
          </p>
          <ul className="lg-points">
            <li>
              <span className="lg-arrow">→</span> All your services in one dashboard
            </li>
            <li>
              <span className="lg-arrow">→</span> Daily traffic &amp; day-by-day breakdown
            </li>
            <li>
              <span className="lg-arrow">→</span> Job health · success / fail / pending
            </li>
          </ul>
          <div className="lg-nokey">
            Questions about your account?{" "}
            <a href={MAIL} target="_blank" rel="noopener noreferrer">
              Email Khalid →
            </a>
          </div>
        </div>

        <footer className="lg-left-foot">
          <span>© 2026 Fastscraping</span>
          <span className="lg-foot-sep">·</span>
          <Link href="/privacy">Privacy</Link>
          <span className="lg-foot-sep">·</span>
          <Link href="/terms">Terms</Link>
        </footer>
      </section>

      {/* RIGHT · terminal */}
      <section className="lg-right">
        <div className="lg-right-inner">
          <div className="lg-status-strip">
            <span className="lg-live">
              <span className="lg-live-dot" />
              All pipelines healthy
            </span>
            <span className="lg-utc">{clock}</span>
          </div>

          <div className={`lg-card${done ? " done" : ""}`}>
            <div className="lg-card-bar">
              <span className="lg-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="lg-card-title">
                fastscraping ~ <b>secure-login</b>
              </span>
              <svg className="lg-lock" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>

            {!done ? (
              <form className="lg-card-body" onSubmit={onSubmit} noValidate>
                <div className="lg-prompt">
                  <span className="lg-ps">$</span> {PROMPT[mode].cmd}
                </div>
                <div className="lg-tline dim">{PROMPT[mode].note}</div>

                {(mode === "login" || step === 1) && (
                  <>
                    <label className="lg-label" htmlFor="email">
                      Email
                    </label>
                    <div className="lg-field">
                      <input
                        ref={firstField}
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        spellCheck={false}
                      />
                    </div>
                  </>
                )}

                {mode === "login" && (
                  <>
                    <label className="lg-label lg-mt" htmlFor="password">
                      Password
                    </label>
                    <div className="lg-field">
                      <input
                        id="password"
                        name="password"
                        type={show ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={`lg-eye${show ? " on" : ""}`}
                        aria-label={show ? "Hide password" : "Show password"}
                        onClick={() => setShow((s) => !s)}
                      >
                        {eye}
                      </button>
                    </div>
                  </>
                )}

                {mode !== "login" && step === 2 && (
                  <>
                    <label className="lg-label" htmlFor="code">
                      6-digit code
                    </label>
                    <div className="lg-field">
                      <input
                        ref={mode === "forgot" ? undefined : firstField}
                        id="code"
                        name="code"
                        inputMode="numeric"
                        maxLength={6}
                        className="lg-code"
                        placeholder="000000"
                        autoComplete="one-time-code"
                      />
                    </div>
                    <div className="lg-resend">
                      <span>Sent to {email}</span>
                      <button type="button" onClick={resend} disabled={cooldown > 0 || busy}>
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </>
                )}

                {((mode === "signup" && step === 3) || (mode === "forgot" && step === 2)) && (
                  <>
                    <label className="lg-label lg-mt" htmlFor="password">
                      {mode === "forgot" ? "New password" : "Password"}
                    </label>
                    <div className="lg-field">
                      <input
                        ref={mode === "signup" ? firstField : undefined}
                        id="password"
                        name="password"
                        type={show ? "text" : "password"}
                        placeholder="8+ chars, letters + numbers"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className={`lg-eye${show ? " on" : ""}`}
                        aria-label={show ? "Hide password" : "Show password"}
                        onClick={() => setShow((s) => !s)}
                      >
                        {eye}
                      </button>
                    </div>
                    <label className="lg-label lg-mt" htmlFor="confirm">
                      Confirm password
                    </label>
                    <div className="lg-field">
                      <input
                        id="confirm"
                        name="confirm"
                        type={show ? "text" : "password"}
                        placeholder="repeat it"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}

                {mode === "signup" && step === 3 && (
                  <>
                    <div className="lg-two">
                      <div>
                        <label className="lg-label lg-mt" htmlFor="firstName">
                          First name <span className="lg-opt">optional</span>
                        </label>
                        <div className="lg-field">
                          <input id="firstName" name="firstName" type="text" placeholder="First" autoComplete="given-name" />
                        </div>
                      </div>
                      <div>
                        <label className="lg-label lg-mt" htmlFor="lastName">
                          Last name <span className="lg-opt">optional</span>
                        </label>
                        <div className="lg-field">
                          <input id="lastName" name="lastName" type="text" placeholder="Last" autoComplete="family-name" />
                        </div>
                      </div>
                    </div>
                    <label className="lg-label lg-mt" htmlFor="company">
                      Company <span className="lg-opt">optional</span>
                    </label>
                    <div className="lg-field">
                      <input id="company" name="company" type="text" placeholder="Company" autoComplete="organization" />
                    </div>
                  </>
                )}

                <div className={`lg-hint${error ? " error" : ""}`}>
                  {error || notice || (mode === "login" ? "Use the email you signed up with" : " ")}
                </div>

                <button type="submit" className={`lg-auth${busy ? " busy" : ""}`} disabled={busy}>
                  <span className="lg-auth-label">{label}</span>
                  <span className="lg-auth-arrow">→</span>
                </button>

                <div className="lg-links">
                  {mode === "login" ? (
                    <>
                      <button type="button" onClick={() => goto("forgot")}>
                        Forgot password?
                      </button>
                      <button type="button" onClick={() => goto("signup")}>
                        Create account
                      </button>
                    </>
                  ) : (
                    <>
                      {step > 1 && (
                        <button type="button" onClick={() => setStep((s) => s - 1)}>
                          ← Back
                        </button>
                      )}
                      <button type="button" onClick={() => goto("login")}>
                        Back to login
                      </button>
                    </>
                  )}
                </div>

                <div className="lg-fine">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  Encrypted · stays logged in · never stored in your browser
                </div>
              </form>
            ) : (
              <div className="lg-success">
                <div className="lg-success-mark">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="lg-success-t">You&apos;re in.</div>
                <div className="lg-success-s">Loading your dashboard…</div>
                <div className="lg-success-bar">
                  <span />
                </div>
              </div>
            )}
          </div>

          <div className="lg-under">
            <span>Trouble logging in? </span>
            <a href={MAIL} target="_blank" rel="noopener noreferrer">
              khalid@fastscraping.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
