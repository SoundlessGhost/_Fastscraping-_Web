"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { platformLabel, type ServiceNode } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";
import type { SessionUser } from "@/lib/auth/session";

// Account, password, and the keys you have connected — the three things a
// client needs to manage themselves.

function fullName(s: ServiceNode) {
  return [platformLabel(s.platform), s.region ? regionName(s.region) : null, s.name].filter(Boolean).join(" · ");
}

export default function Settings({
  user,
  services,
  passwordWaitDays,
  memberSince,
}: {
  user: SessionUser;
  services: ServiceNode[];
  passwordWaitDays: number;
  memberSince: string | null;
}) {
  const router = useRouter();

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [removing, setRemoving] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: String(fd.get("name") ?? ""), company: String(fd.get("company") ?? "") }),
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

  async function removeKey(slug: string) {
    setRemoving(slug);
    await fetch(`/api/services/${slug}/connect`, { method: "DELETE" }).catch(() => {});
    setRemoving(null);
    router.refresh();
  }

  const locked = passwordWaitDays > 0;

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Account <em>settings</em>
          </h1>
          <p className="dash-meta">
            <b>{user.email}</b>
            {memberSince && <> · member since {new Date(memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</>}
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
            <label className="cn-l" htmlFor="name">
              Name
            </label>
            <input id="name" name="name" className="cn-in" defaultValue={user.name ?? ""} disabled={profileBusy} />

            <label className="cn-l" htmlFor="company">
              Company
            </label>
            <input id="company" name="company" className="cn-in" defaultValue={user.company ?? ""} disabled={profileBusy} />

            {profileMsg && <p className={profileMsg.ok ? "st-ok" : "cn-err"}>{profileMsg.text}</p>}
            <button className="btn btn-ghost st-btn" disabled={profileBusy}>
              {profileBusy ? "Saving…" : "Save"}
            </button>
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

        {/* KEYS */}
        <div className="dash-card st-card st-card--wide">
          <div className="dash-card-h">
            <div className="dash-card-t">
              Connected keys <small>one key per service</small>
            </div>
          </div>
          <div className="st-body">
            {services.length === 0 ? (
              <p className="st-lock">You haven&apos;t connected any service keys yet.</p>
            ) : (
              <div className="st-keys">
                {services.map((s) => (
                  <div className="st-key" key={s.slug}>
                    <span className={`ds-dot ds-dot--${s.connection?.lastError ? "err" : "on"}`} />
                    <span className="st-key-n">{fullName(s)}</span>
                    <span className="st-key-m">{s.connection?.keyMask}</span>
                    <span className="st-key-s">
                      {s.connection?.lastError
                        ? s.connection.lastError
                        : s.connection?.verifiedAt
                          ? `verified ${new Date(s.connection.verifiedAt).toLocaleDateString()}`
                          : ""}
                    </span>
                    <button className="st-rm" onClick={() => removeKey(s.slug)} disabled={removing === s.slug}>
                      {removing === s.slug ? "…" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="cn-note">
              Removing a key only forgets it here. It keeps working wherever else you use it.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
