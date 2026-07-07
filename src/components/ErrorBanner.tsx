import { AlertTriangle, X } from "lucide-react";
import type { ApiErrorPayload } from "@/types/chat";

export function ErrorBanner({ error, onDismiss }: { error: ApiErrorPayload; onDismiss: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">{error.error}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="shrink-0 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
}
