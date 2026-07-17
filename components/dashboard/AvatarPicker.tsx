"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/dashboard/Avatar";
import type { SessionUser } from "@/lib/auth/session";

const MAX_MB = 10;

export default function AvatarPicker({ user }: { user: SessionUser }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Show the new picture the instant it's chosen, rather than after the upload.
  const [preview, setPreview] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Checked here too, so a 40 MB photo fails instantly instead of after a
    // long upload. The server checks again — this is only for the wait.
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_MB} MB.`);
      if (input.current) input.current.value = "";
      return;
    }

    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const body = new FormData();
      body.append("avatar", file);
      const res = await fetch("/api/auth/avatar", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not upload that image.");
        setPreview(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
      setPreview(null);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    setPreview(null);
    await fetch("/api/auth/avatar", { method: "DELETE" }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="ap">
      <span className="ap-shot">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob: URL
          <img src={preview} alt="" className="av-img" />
        ) : (
          <Avatar user={user} size={72} />
        )}
        {busy && <span className="ap-busy" />}
      </span>

      <div className="ap-side">
        <div className="ap-acts">
          <button type="button" className="btn btn-ghost ap-btn" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Uploading…" : user.avatarVersion ? "Change photo" : "Upload photo"}
          </button>
          {user.avatarVersion && (
            <button type="button" className="st-rm" onClick={remove} disabled={busy}>
              Remove
            </button>
          )}
        </div>
        <p className="cn-note">JPG, PNG, WebP or GIF · up to {MAX_MB} MB. Shown next to Log out.</p>
        {error && <p className="cn-err">{error}</p>}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={pick}
        hidden
      />
    </div>
  );
}
