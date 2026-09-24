"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../styles/login.css";

const RESEND_COOLDOWN = 60;

type Mode = "login" | "signup" | "forgot";

// Friendly messages for a failed Google redirect (?error=… on this page).
const URL_ERRORS: Record<string, string> = {
  google_unconfigured: "Google sign-in isn't set up yet.",
  google_denied: "Google sign-in was cancelled.",
  google_state: "Google sign-in failed — please try again.",
  google_token: "Google sign-in failed — please try again.",
  google_profile: "Google sign-in failed — please try again.",
  google_email: "That Google account has no verified email.",
  account_disabled: "This account has been disabled. Contact support.",
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
  // Password captured up front on signup, sent with the code at verify time.
  const [signupPassword, setSignupPassword] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    firstField.current?.focus();
  }, [mode, step]);

  // Surface a ?error= left by a failed Google sign-in redirect.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("error");
    if (p && URL_ERRORS[p]) setError(URL_ERRORS[p]);
  }, []);

  function goto(next: Mode) {
    setMode(next);
    setStep(1);
    setError("");
    setNotice("");
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

      // ---------- SIGN UP ----------
      // Step 1: email + password -> we email a 6-digit code.
      // Step 2: enter the code -> account is created with the step-1 password.
      if (mode === "signup") {
        if (step === 1) {
          const addr = val("email");
          const pw = String(fd.get("password") ?? "");
          if (pw.length < 8) return setError("Password must be at least 8 characters.");
          const { r, d } = await post("/api/auth/signup", { email: addr });
          if (!r.ok || !d.ok) return setError(d.error || "Could not send the code.");
          setEmail(addr);
          setSignupPassword(pw);
          setCooldown(RESEND_COOLDOWN);
          return setStep(2);
        }
        const c = val("code");
        if (!/^\d{6}$/.test(c)) return setError("Enter the 6-digit code.");
        const { r, d } = await post("/api/auth/signup/verify", {
          email,
          code: c,
          password: signupPassword,
        });
        if (!r.ok || !d.ok) {
          setError(d.error || "Could not create the account.");
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
      ? "Sign in"
      : mode === "signup"
        ? step === 1
          ? "Sign up"
          : "Create account"
        : step === 1
          ? "Send reset code"
          : "Set new password";

  const heading =
    mode === "login"
      ? "Sign in to your account"
      : mode === "signup"
        ? step === 1
          ? "Create your account"
          : "Check your email"
        : step === 1
          ? "Reset your password"
          : "Check your email";

  const showGoogle = mode === "login" || (mode === "signup" && step === 1);
  const showEmail =
    mode === "login" || (mode === "signup" && step === 1) || (mode === "forgot" && step === 1);
  const showPassword = mode === "login" || (mode === "signup" && step === 1);
  const showCode =
    (mode === "signup" && step === 2) || (mode === "forgot" && step === 2);

  const eye = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <main className="lg-split">
      {/* LEFT · editorial — mirrors the homepage hero */}
      <section className="lg-left">
        <div className="lg-left-body">
          <Link href="/" className="brand lg-logo">
            <span className="brand-mark">f</span>
            <span>Fastscraping</span>
          </Link>
          <span className="eyebrow">Enterprise-grade data extraction</span>
          <h1 className="lg-h1">
            <span className="lg-h1-line">We handle your</span>
            <span className="lg-h1-line">
              <em>web scraping</em>
            </span>
            <span className="lg-h1-line">pipeline.</span>
          </h1>
          <p className="lg-sub">
            Structured data delivered{" "}
            <strong>reliably, at any scale</strong> — bypassing Cloudflare,
            DataDome and login walls. No proxy headaches. No infrastructure
            overhead. No babysitting.
          </p>
          <div className="hero-bullets">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Bypass Cloudflare &amp; Captchas
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Large-scale on demand
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              No proxy hassles
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT · auth form */}
      <section className="lg-right">
        <div className="lg-right-inner">
          <div className={`lg-card${done ? " done" : ""}`}>
            {!done ? (
              <form className="lg-card-body" onSubmit={onSubmit} noValidate>
                <h2 className="lg-title">{heading}</h2>
                <p className="lg-switch">
                  {mode === "login" && (
                    <>
                      Don&apos;t have an account?{" "}
                      <button type="button" onClick={() => goto("signup")}>
                        Sign up
                      </button>
                    </>
                  )}
                  {mode === "signup" && step === 1 && (
                    <>
                      Already have an account?{" "}
                      <button type="button" onClick={() => goto("login")}>
                        Sign in
                      </button>
                    </>
                  )}
                  {mode === "signup" && step === 2 && (
                    <>
                      Enter the 6-digit code sent to <b>{email}</b>
                    </>
                  )}
                  {mode === "forgot" && step === 1 && <>We&apos;ll email you a reset code.</>}
                  {mode === "forgot" && step === 2 && (
                    <>
                      Enter the code sent to <b>{email}</b> and a new password.
                    </>
                  )}
                </p>

                {showGoogle && (
                  <>
                    <a className="lg-google" href="/api/auth/google">
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
                      </svg>
                      Continue with Google
                    </a>
                    <div className="lg-or">
                      <span>OR</span>
                    </div>
                  </>
                )}

                {showEmail && (
                  <div className="lg-field">
                    <input
                      ref={firstField}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email"
                      aria-label="Email"
                      autoComplete="email"
                      spellCheck={false}
                    />
                  </div>
                )}

                {showPassword && (
                  <div className="lg-field lg-mt">
                    <input
                      id="password"
                      name="password"
                      type={show ? "text" : "password"}
                      placeholder="Password"
                      aria-label="Password"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                )}

                {showCode && (
                  <>
                    <div className="lg-field">
                      <input
                        ref={firstField}
                        id="code"
                        name="code"
                        inputMode="numeric"
                        maxLength={6}
                        className="lg-code"
                        placeholder="000000"
                        aria-label="6-digit code"
                        autoComplete="one-time-code"
                      />
                    </div>
                    <div className="lg-resend">
                      <button type="button" onClick={resend} disabled={cooldown > 0 || busy}>
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </>
                )}

                {mode === "forgot" && step === 2 && (
                  <>
                    <div className="lg-field lg-mt">
                      <input
                        id="password"
                        name="password"
                        type={show ? "text" : "password"}
                        placeholder="New password"
                        aria-label="New password"
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
                    <div className="lg-field lg-mt">
                      <input
                        id="confirm"
                        name="confirm"
                        type={show ? "text" : "password"}
                        placeholder="Repeat new password"
                        aria-label="Repeat new password"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}

                <div className={`lg-hint${error ? " error" : ""}`}>
                  {error || notice || " "}
                </div>

                <button type="submit" className={`lg-auth${busy ? " busy" : ""}`} disabled={busy}>
                  <span className="lg-auth-label">{label}</span>
                  <span className="lg-auth-arrow">→</span>
                </button>

                <div className="lg-links">
                  {mode === "login" ? (
                    <button type="button" onClick={() => goto("forgot")}>
                      Forgot your password?
                    </button>
                  ) : (
                    <>
                      {step > 1 && (
                        <button type="button" onClick={() => setStep((s) => s - 1)}>
                          ← Back
                        </button>
                      )}
                      <button type="button" onClick={() => goto("login")}>
                        Back to sign in
                      </button>
                    </>
                  )}
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
        </div>
      </section>
    </main>
  );
}
