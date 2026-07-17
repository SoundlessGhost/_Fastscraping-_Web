import type { SessionUser } from "@/lib/auth/session";

// One avatar, everywhere. Falls back to the plain silhouette every site uses
// when someone hasn't uploaded a picture.

export function avatarSrc(user: Pick<SessionUser, "id" | "avatarVersion">): string | null {
  return user.avatarVersion ? `/api/avatar/${user.id}?v=${user.avatarVersion}` : null;
}

export default function Avatar({
  user,
  size = 32,
  className = "",
}: {
  user: Pick<SessionUser, "id" | "avatarVersion" | "email">;
  size?: number;
  className?: string;
}) {
  const src = avatarSrc(user);

  return (
    <span className={`av ${className}`} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by our own
        // route as raw bytes; next/image would only add a second round trip.
        <img src={src} alt="" width={size} height={size} className="av-img" />
      ) : (
        <svg viewBox="0 0 32 32" className="av-img" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="currentColor" opacity="0.1" />
          <circle cx="16" cy="12.5" r="5" fill="currentColor" opacity="0.45" />
          <path
            d="M4.8 27.4a11.6 11.6 0 0 1 22.4 0A15.94 15.94 0 0 1 16 32c-4.3 0-8.2-1.7-11.2-4.6z"
            fill="currentColor"
            opacity="0.45"
          />
        </svg>
      )}
    </span>
  );
}
