"use client";

/**
 * Wiederverwendbarer Bestätigungs-Dialog (Overlay). Rendert nichts, wenn
 * `open` false ist. Klick auf den Hintergrund oder „Abbrechen" schließt ihn.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Abbrechen",
  busyLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-theme-card rounded-2xl shadow-xl p-6 max-w-sm w-full border border-theme-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-theme-primary mb-2">
          {title}
        </h3>
        <p className="text-sm text-theme-secondary mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 btn btn-primary text-sm disabled:opacity-50"
          >
            {busy ? (busyLabel ?? "Wird gesendet…") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
