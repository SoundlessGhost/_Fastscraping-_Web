"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildTree } from "@/lib/services/taxonomy";

export type AdminService = {
  id: string;
  name: string;
  slug: string;
  category: string;
  platform: string;
  region: string | null;
  endpoint: string | null;
  baseUrl: string;
  usagePath: string;
  authHeader: string;
  kind: string;
  status: "ACTIVE" | "DISABLED";
  sortOrder: number;
  notes: string | null;
  /// How many clients hold a key for it — shown before a destructive delete.
  clients: number;
};

type Draft = Omit<AdminService, "id" | "clients"> & { id: string | null };

const EMPTY: Draft = {
  id: null,
  name: "",
  slug: "",
  category: "ecommerce",
  platform: "",
  region: "",
  endpoint: "",
  baseUrl: "http://",
  usagePath: "/me/usage",
  authHeader: "X-API-Key",
  kind: "generic",
  status: "DISABLED",
  sortOrder: 0,
  notes: "",
};

/// Slug is derived from the taxonomy so it stays predictable, but stays
/// editable — an existing service's slug is its URL and shouldn't shift under
/// a client just because a label changed.
function suggestSlug(d: Draft) {
  return [d.platform, d.region, d.endpoint]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ServicesEditor({ services }: { services: AdminService[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  // Reuse the client-side grouping so admin sees exactly the shape clients see.
  const tree = useMemo(
    () =>
      buildTree(
        services.map((s) => ({
          slug: s.slug,
          name: s.name,
          category: s.category,
          platform: s.platform,
          region: s.region,
          endpoint: s.endpoint,
          kind: s.kind,
          status: s.status,
          connection: null,
        })),
      ),
    [services],
  );

  const byId = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const bySlug = useMemo(() => new Map(services.map((s) => [s.slug, s])), [services]);

  function edit(id: string) {
    const s = byId.get(id);
    if (!s) return;
    setError(null);
    setSlugTouched(true);
    setDraft({ ...s, region: s.region ?? "", endpoint: s.endpoint ?? "", notes: s.notes ?? "" });
  }

  function create() {
    setError(null);
    setSlugTouched(false);
    setDraft({ ...EMPTY });
  }

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);

    const slug = draft.slug.trim() || suggestSlug(draft);
    const body = {
      name: draft.name.trim(),
      slug,
      category: draft.category.trim(),
      platform: draft.platform.trim(),
      region: draft.region?.trim() || null,
      endpoint: draft.endpoint?.trim() || null,
      baseUrl: draft.baseUrl.trim(),
      usagePath: draft.usagePath.trim(),
      authHeader: draft.authHeader.trim(),
      kind: draft.kind.trim(),
      status: draft.status,
      sortOrder: Number(draft.sortOrder) || 0,
      notes: draft.notes?.trim() || null,
    };

    try {
      const res = await fetch(draft.id ? `/api/admin/services/${draft.id}` : "/api/admin/services", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setDraft(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: AdminService) {
    const warn =
      s.clients > 0
        ? `\n\n${s.clients} client${s.clients === 1 ? " has" : "s have"} a key connected to it. Deleting drops those keys — they'd have to paste them again.`
        : "";
    if (!confirm(`Delete "${s.name}" (${s.slug}) from the catalog?${warn}`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/services/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete.");
    }
    setBusy(false);
    router.refresh();
  }

  const slugPreview = draft && !slugTouched ? suggestSlug(draft) : draft?.slug;

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Service <em>catalog</em>
          </h1>
          <p className="dash-meta">
            <b>{services.length}</b> services · this is the list clients see in their sidebar
          </p>
        </div>
        <button className="btn btn-primary" onClick={create}>
          Add service
        </button>
      </div>

      {error && !draft && <div className="su-error"><b>{error}</b></div>}

      {draft && (
        <div className="dash-card adm-card adm-form">
          <div className="dash-card-h">
            <div className="dash-card-t">
              {draft.id ? "Edit service" : "New service"}{" "}
              <small>a running endpoint: its own address, its own key</small>
            </div>
          </div>

          <div className="adm-form-body">
            <div className="adm-fgrid">
              <label>
                <span className="cn-l">Category</span>
                <input className="cn-in" value={draft.category} onChange={(e) => set("category", e.target.value)} placeholder="ecommerce" />
              </label>
              <label>
                <span className="cn-l">Platform</span>
                <input className="cn-in" value={draft.platform} onChange={(e) => set("platform", e.target.value)} placeholder="shopee" />
              </label>
              <label>
                <span className="cn-l">Region <i>optional</i></span>
                <input className="cn-in" value={draft.region ?? ""} onChange={(e) => set("region", e.target.value)} placeholder="br" />
              </label>
              <label>
                <span className="cn-l">Endpoint <i>optional</i></span>
                <input className="cn-in" value={draft.endpoint ?? ""} onChange={(e) => set("endpoint", e.target.value)} placeholder="get_pc" />
              </label>
            </div>

            <div className="adm-fgrid">
              <label>
                <span className="cn-l">Display name</span>
                <input className="cn-in" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="get_pc" />
              </label>
              <label>
                <span className="cn-l">Slug <i>URL</i></span>
                <input
                  className="cn-in"
                  value={slugPreview ?? ""}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                  placeholder="shopee-br-get-pc"
                />
              </label>
            </div>

            <label>
              <span className="cn-l">Base URL <i>where this endpoint runs</i></span>
              <input className="cn-in" value={draft.baseUrl} onChange={(e) => set("baseUrl", e.target.value)} placeholder="http://86.48.2.59:8040" />
            </label>

            <div className="adm-fgrid">
              <label>
                <span className="cn-l">Usage path</span>
                <input className="cn-in" value={draft.usagePath} onChange={(e) => set("usagePath", e.target.value)} />
              </label>
              <label>
                <span className="cn-l">Auth header</span>
                <input className="cn-in" value={draft.authHeader} onChange={(e) => set("authHeader", e.target.value)} />
              </label>
              <label>
                <span className="cn-l">Adapter <i>kind</i></span>
                <select className="cn-in" value={draft.kind} onChange={(e) => set("kind", e.target.value)}>
                  <option value="shopee-usage">shopee-usage</option>
                  <option value="generic">generic</option>
                </select>
              </label>
              <label>
                <span className="cn-l">Status</span>
                <select className="cn-in" value={draft.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
                  <option value="ACTIVE">ACTIVE — accepts keys</option>
                  <option value="DISABLED">DISABLED — coming soon</option>
                </select>
              </label>
              <label>
                <span className="cn-l">Sort order</span>
                <input className="cn-in" type="number" value={draft.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
              </label>
            </div>

            <label>
              <span className="cn-l">Notes <i>internal</i></span>
              <input className="cn-in" value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
            </label>

            {error && <p className="cn-err">{error}</p>}

            <p className="cn-note">
              Set ACTIVE only once the backend is reachable — a client&apos;s key is checked against it the
              moment they try to connect.
            </p>

            <div className="adm-form-acts">
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                {busy ? "Saving…" : draft.id ? "Save changes" : "Create service"}
              </button>
              <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The catalog, in the same shape the client sidebar renders */}
      {tree.map((cat) => (
        <section className="adm-cat" key={cat.category}>
          <h2 className="ov-sec-t">{cat.label}</h2>
          {cat.platforms.map((plat) => (
            <div className="adm-plat" key={plat.platform}>
              <h3 className="adm-plat-t">
                {plat.label} <small>{plat.count}</small>
              </h3>
              {plat.regions.map((reg) => (
                <div key={reg.region ?? "_all"}>
                  <div className="adm-reg-t">{reg.label}</div>
                  {reg.services.map((node) => {
                    const s = bySlug.get(node.slug);
                    if (!s) return null;
                    return (
                      <div className="adm-srow" key={s.id}>
                        <span className={`ds-dot ds-dot--${s.status === "ACTIVE" ? "on" : "soon"}`} />
                        <span className="adm-sname">{s.name}</span>
                        <span className="adm-sslug">{s.slug}</span>
                        <span className="adm-surl">{s.baseUrl}</span>
                        <span className="adm-skind">{s.kind}</span>
                        <span className="adm-sclients">{s.clients} key{s.clients === 1 ? "" : "s"}</span>
                        <span className="adm-acts">
                          <button onClick={() => edit(s.id)}>Edit</button>
                          <button className="adm-danger" onClick={() => remove(s)} disabled={busy}>
                            Delete
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
