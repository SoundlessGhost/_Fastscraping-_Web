"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// A small confirmation modal in the site's own design, replacing the browser's
// native confirm() (the ugly "www.fastscraping.com says" box). No dependencies.
//
// Usage: wrap a client subtree in <ConfirmProvider>, then in any child call
//   const confirm = useConfirm();
//   if (await confirm({ title, body, confirmLabel, danger })) { ... }
// It returns a promise that resolves true on confirm, false on cancel/dismiss.

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /// Reddens the confirm button for destructive actions.
  danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      setPending((p) => {
        p?.resolve(ok);
        return null;
      });
    },
    [],
  );

  // Esc cancels, Enter confirms — same reflexes as the native dialog.
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="cf-scrim" onClick={() => close(false)}>
          <div
            className="cf-box"
            role="alertdialog"
            aria-modal="true"
            aria-label={pending.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cf-bar">
              <span className="cf-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="cf-bar-t">confirm</span>
            </div>
            <div className="cf-body">
              <h2 className="cf-title">{pending.title}</h2>
              {pending.body && <p className="cf-text">{pending.body}</p>}
              <div className="cf-acts">
                <button className="cf-btn cf-cancel" onClick={() => close(false)}>
                  {pending.cancelLabel ?? "Cancel"}
                </button>
                <button
                  className={`cf-btn cf-ok ${pending.danger ? "is-danger" : ""}`}
                  onClick={() => close(true)}
                  autoFocus
                >
                  {pending.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
