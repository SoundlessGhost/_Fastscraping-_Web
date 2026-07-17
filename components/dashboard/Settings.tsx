"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { platformLabel, type ServiceNode } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";
import type { SessionUser } from "@/lib/auth/session";
import AvatarPicker from "@/components/dashboard/AvatarPicker";

// Everything a client manages about themselves: who they are, how they sign in,
// which keys they've connected, and where they're signed in.

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
  // For a brand that is its own single service, name and platform are the same
  // string — "StubHub · StubHub" helps nobody.
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

/// One connected service. The key arrives with the page, so Reveal is a pure
/// toggle — no request, nothing to wait for. Keys can't be removed here: a
/// client's access to a service is ours to manage, not theirs to drop.
function KeyRow({ s, apiKey }: { s: ServiceNode; apiKey: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(apiKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
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
      </div>
    </div>
  );
}

export default function Settings({
  user,
  services,
  keys,
  passwordWaitDays,
  memberSince,
  devices,
}: {
  user: SessionUser;
  services: ServiceNode[];
  /// slug -> the client's own key, decrypted for this page only.
  keys: Record<string, string>;
  passwordWaitDays: number;
  memberSince: string | null;
  devices: DeviceSession[];
}) {
  const router = useRouter();

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
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

  async function signOutOthers() {
    if (!confirm("Sign out of every other device?")) return;
    setSessBusy(true);
    await fetch("/api/auth/sessions", { method: "DELETE" }).catch(() => {});
    setSessBusy(false);
    router.refresh();
  }

  const locked = passwordWaitDays > 0;
  const others = devices.filter((d) => !d.isCurrent);

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Account <em>settings</em>
          </h1>
          <p className="dash-meta">
            <b>{user.email}</b>
            {memberSince && (
              <> · member since {new Date(memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</>
            )}
          </p>
        </div>
      </div>

      <div className="st-grid">
        {/* PROFILE */}
        <form className="dash-card st-card" onSubmit={saveProfile}>
          <div className="dash-card-h">
            <div className="dash-card-t">Profile</div>
          </div>
          <div className="st-body">
            <AvatarPicker user={user} />

            <div className="st-two">
              <div>
                <label className="cn-l" htmlFor="firstName">
                  First name
                </label>
                <input id="firstName" name="firstName" className="cn-in" defaultValue={user.firstName ?? ""} disabled={profileBusy} />
              </div>
              <div>
                <label className="cn-l" htmlFor="lastName">
                  Last name
                </label>
                <input id="lastName" name="lastName" className="cn-in" defaultValue={user.lastName ?? ""} disabled={profileBusy} />
              </div>
            </div>

            <div className="st-two">
              <div>
                <label className="cn-l" htmlFor="company">
                  Company
                </label>
                <input id="company" name="company" className="cn-in" defaultValue={user.company ?? ""} disabled={profileBusy} />
              </div>
              <div>
                <label className="cn-l" htmlFor="email">
                  Email <i className="st-hint">your sign-in</i>
                </label>
                <input id="email" className="cn-in st-ro" value={user.email} readOnly disabled />
              </div>
            </div>

            <div className="st-foot">
              <button className="btn btn-ghost st-btn" disabled={profileBusy}>
                {profileBusy ? "Saving…" : "Save changes"}
              </button>
              {profileMsg && <p className={profileMsg.ok ? "st-ok" : "cn-err"}>{profileMsg.text}</p>}
            </div>
          </div>
        </form>

        {/* PASSWORD */}
        <form className="dash-card st-card" onSubmit={changePassword}>
          <div className="dash-card-h">
            <div className="dash-card-t">
              Password <small>changeable once every 30 days</small>
            </div>
          </div>
          <div className="st-body">
            {locked ? (
              <p className="st-lock">
                Your password was changed recently. You can change it again in <b>{passwordWaitDays}</b> day
                {passwordWaitDays === 1 ? "" : "s"}.
              </p>
            ) : (
              <>
                <label className="cn-l" htmlFor="currentPassword">
                  Current password
                </label>
                <input id="currentPassword" name="currentPassword" type="password" className="cn-in" autoComplete="current-password" disabled={pwBusy} />

                <label className="cn-l" htmlFor="password">
                  New password
                </label>
                <input id="password" name="password" type="password" className="cn-in" autoComplete="new-password" disabled={pwBusy} />

                <label className="cn-l" htmlFor="confirm">
                  Repeat new password
                </label>
                <input id="confirm" name="confirm" type="password" className="cn-in" autoComplete="new-password" disabled={pwBusy} />

                {pwMsg && <p className={pwMsg.ok ? "st-ok" : "cn-err"}>{pwMsg.text}</p>}
                <button className="btn btn-ghost st-btn" disabled={pwBusy}>
                  {pwBusy ? "Changing…" : "Change password"}
                </button>
              </>
            )}
            {locked && pwMsg && <p className={pwMsg.ok ? "st-ok" : "cn-err"}>{pwMsg.text}</p>}
          </div>
        </form>

        {/* API KEYS */}
        <div className="dash-card st-card st-card--wide">
          <div className="dash-card-h">
            <div className="dash-card-t">
              API keys <small>one key per service</small>
            </div>
          </div>
          <div className="st-body">
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
            <p className="cn-note">
              Keys are stored encrypted and only ever sent to their own service. Need one changed? Email us.
            </p>
          </div>
        </div>

        {/* SESSIONS */}
        <div className="dash-card st-card st-card--wide">
          <div className="dash-card-h">
            <div className="dash-card-t">
              Where you&apos;re signed in <small>{devices.length} active</small>
            </div>
            {others.length > 0 && (
              <button className="adm-link st-linkbtn" onClick={signOutOthers} disabled={sessBusy}>
                {sessBusy ? "…" : "Sign out other devices"}
              </button>
            )}
          </div>
          <div className="st-body">
            <div className="st-sessions">
              {devices.map((d) => (
                <div className="st-sess" key={d.id}>
                  <span className={`ds-dot ds-dot--${d.isCurrent ? "on" : "off"}`} />
                  <span className="st-sess-n">
                    {prettyAgent(d.userAgent)}
                    {d.isCurrent && <b className="adm-you"> this device</b>}
                  </span>
                  <span className="st-sess-m">{d.ip ?? "—"}</span>
                  <span className="st-sess-m">last seen {fmtWhen(d.lastSeenAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
