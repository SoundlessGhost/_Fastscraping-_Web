"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { platformLabel, type ServiceNode } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";
import type { SessionUser } from "@/lib/auth/session";
import AvatarPicker from "@/components/dashboard/AvatarPicker";
import { useConfirm } from "@/components/ui/Confirm";

// Everything a client manages about themselves, laid out as label→control rows
// (not cards). The /settings sub-pages each render one `section`.

export type DeviceSession = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastSeenAt: string;
  createdAt: string;
  isCurrent: boolean;
};

function fullName(s: ServiceNode) {
  const platform = platformLabel(s.platform);
  return [platform, s.region ? regionName(s.region) : null, s.name === platform ? null : s.name]
    .filter(Boolean)
    .join(" · ");
}

/// User agents are long and mostly noise; show the part a person recognises.
function prettyAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" :
    /Firefox\//.test(ua) ? "Firefox" :
    /curl/i.test(ua) ? "curl" :
    "Browser";
  const os =
    /Windows/.test(ua) ? "Windows" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" :
    "";
  return os ? `${browser} on ${os}` : browser;
}

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/// One connected service key row.
function KeyRow({ s, apiKey }: { s: ServiceNode; apiKey: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(apiKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function remove() {
    const ok = await confirm({
      title: `Remove your key for ${fullName(s)}?`,
      body: "Usage stops showing here until you paste a key again. Nothing on the service itself changes.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setRemoving(true);
    await fetch(`/api/services/${s.slug}/connect`, { method: "DELETE" }).catch(() => {});
    setRemoving(false);
    router.refresh();
  }

  const broken = Boolean(s.connection?.lastError);

  return (
    <div className="st-key">
      <div className="st-key-top">
        <span className={`ds-dot ds-dot--${broken ? "err" : "on"}`} />
        <span className="st-key-n">{fullName(s)}</span>
        <span className="st-key-s">
          {broken
            ? s.connection?.lastError
            : s.connection?.verifiedAt
              ? `verified ${new Date(s.connection.verifiedAt).toLocaleDateString()}`
              : ""}
        </span>
      </div>

      <div className="st-key-row">
        <code className="st-key-val">{revealed ? apiKey : s.connection?.keyMask}</code>
        <button onClick={() => setRevealed((v) => !v)}>{revealed ? "Hide" : "Reveal"}</button>
        <button onClick={copy}>{copied ? "Copied" : "Copy"}</button>
        <Link href={`/dashboard/s/${s.slug}`} className="st-key-link">
          Usage →
        </Link>
        <button className="st-key-rm" onClick={remove} disabled={removing}>
          {removing ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

export default function Settings({
  user,
  services,
  keys,
  memberSince,
  devices,
  section = "all",
}: {
  user: SessionUser;
  services: ServiceNode[];
  /// slug -> the client's own key, decrypted for this page only.
  keys: Record<string, string>;
  memberSince: string | null;
  devices: DeviceSession[];
  section?: "general" | "keys" | "account" | "all";
}) {
  const router = useRouter();
  const confirm = useConfirm();

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  // Password has two doors: change with the current password, or reset with an
  // emailed code.
  const [pwMode, setPwMode] = useState<"change" | "forgot">("change");
  const [codeSent, setCodeSent] = useState(false);
  const [sessBusy, setSessBusy] = useState(false);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(fd.get("firstName") ?? ""),
          lastName: String(fd.get("lastName") ?? ""),
          company: String(fd.get("company") ?? ""),
        }),
      });
      const body = await res.json().catch(() => ({}));
      setProfileMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: body.error ?? "Could not save." });
      if (res.ok) router.refresh();
    } catch {
      setProfileMsg({ ok: false, text: "Network error." });
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = String(fd.get("password") ?? "");
    if (password !== String(fd.get("confirm") ?? "")) {
      setPwMsg({ ok: false, text: "The two new passwords do not match." });
      return;
    }

    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: String(fd.get("currentPassword") ?? ""), password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setPwMsg({ ok: true, text: "Password changed. Other devices were signed out." });
        form.reset();
        router.refresh();
      } else {
        setPwMsg({ ok: false, text: body.error ?? "Could not change password." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Network error." });
    } finally {
      setPwBusy(false);
    }
  }

  async function sendResetCode() {
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        setCodeSent(true);
        setPwMsg({ ok: true, text: `A 6-digit code is on its way to ${user.email}. Enter it below.` });
      } else {
        const b = await res.json().catch(() => ({}));
        setPwMsg({ ok: false, text: b.error ?? "Could not send a code. Try again." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Network error." });
    } finally {
      setPwBusy(false);
    }
  }

  async function resetWithCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const password = String(fd.get("password") ?? "");
    if (password !== String(fd.get("confirm") ?? "")) {
      setPwMsg({ ok: false, text: "The two new passwords do not match." });
      return;
    }

    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, code: String(fd.get("code") ?? "").trim(), password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setPwMode("change");
        setCodeSent(false);
        setPwMsg({ ok: true, text: "Password reset. Other devices were signed out." });
        form.reset();
        router.refresh();
      } else {
        setPwMsg({ ok: false, text: body.error ?? "Could not reset password." });
      }
    } catch {
      setPwMsg({ ok: false, text: "Network error." });
    } finally {
      setPwBusy(false);
    }
  }

  function switchPwMode(mode: "change" | "forgot") {
    setPwMode(mode);
    setCodeSent(false);
    setPwMsg(null);
  }

  async function signOutOthers() {
    const ok = await confirm({
      title: "Sign out of every other device?",
      body: "This device stays signed in. Any other browsers or sessions are logged out.",
      confirmLabel: "Sign out others",
      danger: true,
    });
    if (!ok) return;
    setSessBusy(true);
    await fetch("/api/auth/sessions", { method: "DELETE" }).catch(() => {});
    setSessBusy(false);
    router.refresh();
  }

  async function logoutAll() {
    const ok = await confirm({
      title: "Log out of all devices?",
      body: "You'll be signed out here and everywhere else, and sent back to the login page.",
      confirmLabel: "Log out everywhere",
      danger: true,
    });
    if (!ok) return;
    setSessBusy(true);
    await fetch("/api/auth/sessions", { method: "DELETE" }).catch(() => {}); // other devices
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); // this one
    router.replace("/dashboard/login");
    router.refresh();
  }

  const others = devices.filter((d) => !d.isCurrent);

  const heading =
    section === "keys" ? (
      <>API <em>keys</em></>
    ) : section === "account" ? (
      <>Account <em>&amp; security</em></>
    ) : (
      <>Your <em>profile</em></>
    );

  return (
    <>
      <div className="ds-head">
        <h1 className="dash-title">{heading}</h1>
      </div>

      {(section === "general" || section === "all") && (
        <div className="set-page">
          {/* PROFILE */}
          <section className="set-sec">
            <h2 className="set-sec-h">Profile</h2>
            <form onSubmit={saveProfile}>
              <div className="set-row">
                <div className="set-row-l">Photo</div>
                <div className="set-row-c set-row-c--wide">
                  <AvatarPicker user={user} />
                </div>
              </div>
              <div className="set-row">
                <label className="set-row-l" htmlFor="firstName">First name</label>
                <div className="set-row-c">
                  <input id="firstName" name="firstName" className="cn-in" defaultValue={user.firstName ?? ""} disabled={profileBusy} />
                </div>
              </div>
              <div className="set-row">
                <label className="set-row-l" htmlFor="lastName">Last name</label>
                <div className="set-row-c">
                  <input id="lastName" name="lastName" className="cn-in" defaultValue={user.lastName ?? ""} disabled={profileBusy} />
                </div>
              </div>
              <div className="set-row">
                <label className="set-row-l" htmlFor="company">Company</label>
                <div className="set-row-c">
                  <input id="company" name="company" className="cn-in" defaultValue={user.company ?? ""} disabled={profileBusy} />
                </div>
              </div>
              <div className="set-row">
                <div className="set-row-l">
                  <span>Email</span>
                  <small>your sign-in</small>
                </div>
                <div className="set-row-c">
                  <input className="cn-in st-ro" value={user.email} readOnly disabled />
                </div>
              </div>
              <div className="set-act">
                <button className="btn btn-ghost st-btn" disabled={profileBusy}>
                  {profileBusy ? "Saving…" : "Save changes"}
                </button>
                {profileMsg && <p className={profileMsg.ok ? "st-ok" : "cn-err"}>{profileMsg.text}</p>}
              </div>
            </form>
          </section>

          {/* PASSWORD */}
          <section className="set-sec">
            <h2 className="set-sec-h">
              Password <small>{pwMode === "forgot" ? "reset with an emailed code" : "current password + a new one"}</small>
            </h2>

            {pwMode === "change" ? (
              <form onSubmit={changePassword}>
                <div className="set-row">
                  <label className="set-row-l" htmlFor="currentPassword">Current password</label>
                  <div className="set-row-c">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      className="cn-in"
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.currentTarget.removeAttribute("readonly")}
                      disabled={pwBusy}
                    />
                  </div>
                </div>
                <div className="set-row">
                  <label className="set-row-l" htmlFor="password">New password</label>
                  <div className="set-row-c">
                    <input id="password" name="password" type="password" className="cn-in" autoComplete="new-password" disabled={pwBusy} />
                  </div>
                </div>
                <div className="set-row">
                  <label className="set-row-l" htmlFor="confirm">Repeat new password</label>
                  <div className="set-row-c">
                    <input id="confirm" name="confirm" type="password" className="cn-in" autoComplete="new-password" disabled={pwBusy} />
                  </div>
                </div>
                <div className="set-act">
                  <button className="btn btn-ghost st-btn" disabled={pwBusy}>{pwBusy ? "Changing…" : "Change password"}</button>
                  {pwMsg && <p className={pwMsg.ok ? "st-ok" : "cn-err"}>{pwMsg.text}</p>}
                  <button type="button" className="st-forgot" onClick={() => switchPwMode("forgot")}>Forgot your current password?</button>
                </div>
              </form>
            ) : !codeSent ? (
              <div>
                <p className="cn-note">We&apos;ll email a 6-digit code to <b>{user.email}</b>. Up to 3 a day.</p>
                {pwMsg && <p className={pwMsg.ok ? "st-ok" : "cn-err"}>{pwMsg.text}</p>}
                <div className="set-act">
                  <button type="button" className="btn btn-ghost st-btn" onClick={sendResetCode} disabled={pwBusy}>
                    {pwBusy ? "Sending…" : "Email me a code"}
                  </button>
                  <button type="button" className="st-forgot" onClick={() => switchPwMode("change")}>← Back</button>
                </div>
              </div>
            ) : (
              <form onSubmit={resetWithCode}>
                <div className="set-row">
                  <label className="set-row-l" htmlFor="code">Code from email</label>
                  <div className="set-row-c">
                    <input id="code" name="code" inputMode="numeric" maxLength={6} className="cn-in" autoComplete="one-time-code" placeholder="000000" disabled={pwBusy} />
                  </div>
                </div>
                <div className="set-row">
                  <label className="set-row-l" htmlFor="rpassword">New password</label>
                  <div className="set-row-c">
                    <input id="rpassword" name="password" type="password" className="cn-in" autoComplete="new-password" disabled={pwBusy} />
                  </div>
                </div>
                <div className="set-row">
                  <label className="set-row-l" htmlFor="rconfirm">Repeat new password</label>
                  <div className="set-row-c">
                    <input id="rconfirm" name="confirm" type="password" className="cn-in" autoComplete="new-password" disabled={pwBusy} />
                  </div>
                </div>
                <div className="set-act">
                  <button className="btn btn-ghost st-btn" disabled={pwBusy}>{pwBusy ? "Resetting…" : "Reset password"}</button>
                  {pwMsg && <p className={pwMsg.ok ? "st-ok" : "cn-err"}>{pwMsg.text}</p>}
                  <button type="button" className="st-forgot" onClick={sendResetCode} disabled={pwBusy}>Resend code</button>
                  <button type="button" className="st-forgot" onClick={() => switchPwMode("change")}>← Back</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {section === "keys" && (
        <div className="set-page">
          <section className="set-sec">
            <h2 className="set-sec-h">API keys <small>one key per service</small></h2>
            {services.length === 0 ? (
              <p className="st-lock">
                You haven&apos;t connected any service keys yet. <Link href="/dashboard">Add one →</Link>
              </p>
            ) : (
              <div className="st-keys">
                {services.map((s) => (
                  <KeyRow key={s.slug} s={s} apiKey={keys[s.slug] ?? ""} />
                ))}
              </div>
            )}
            <p className="cn-note">Keys are stored encrypted and only ever sent to their own service.</p>
          </section>
        </div>
      )}

      {section === "account" && (
        <div className="set-page">
          <section className="set-sec">
            <h2 className="set-sec-h">Account</h2>
            <div className="set-row">
              <div className="set-row-l">
                <span>Log out of all devices</span>
                <small>Ends every active session, including this one.</small>
              </div>
              <div className="set-row-c">
                <button className="btn btn-ghost st-btn" onClick={logoutAll} disabled={sessBusy}>Log out</button>
              </div>
            </div>
            <div className="set-row">
              <div className="set-row-l">
                <span>Delete account</span>
                <small>Email us and we&apos;ll remove it and your data.</small>
              </div>
              <div className="set-row-c">
                <button type="button" className="btn btn-ghost st-btn" disabled>Request deletion</button>
              </div>
            </div>
            <div className="set-row">
              <div className="set-row-l">Account ID</div>
              <div className="set-row-c"><code className="set-id">{user.id}</code></div>
            </div>
          </section>

          <section className="set-sec">
            <h2 className="set-sec-h">
              Active sessions <small>{devices.length} active</small>
              {others.length > 0 && (
                <button className="adm-link st-linkbtn" onClick={signOutOthers} disabled={sessBusy}>
                  {sessBusy ? "…" : "Sign out others"}
                </button>
              )}
            </h2>
            <div className="set-table">
              <div className="set-tr set-tr--head">
                <span>Device</span>
                <span>IP</span>
                <span>Signed in</span>
                <span>Last seen</span>
              </div>
              {devices.map((d) => (
                <div className="set-tr" key={d.id}>
                  <span className="set-td-dev">
                    <span className={`ds-dot ds-dot--${d.isCurrent ? "on" : "off"}`} />
                    {prettyAgent(d.userAgent)}
                    {d.isCurrent && <b className="adm-you"> current</b>}
                  </span>
                  <span>{d.ip ?? "—"}</span>
                  <span>{fmtWhen(d.createdAt)}</span>
                  <span>{fmtWhen(d.lastSeenAt)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
