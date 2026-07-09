"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { FileText, Library, Loader2, X } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";

export function DocumentPanel({ disabled }: { disabled?: boolean }) {
  const { documents, uploadDocument, deleteDocument } = useDocuments();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadDocument(file);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <input ref={fileInputRef} type="file" accept=".txt,.md" hidden onChange={handleFileChange} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-hover disabled:opacity-60"
        aria-label="Attached sources"
      >
        <Library size={14} />
        Sources{documents.length > 0 ? ` (${documents.length})` : ""}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-72 rounded-xl border border-border bg-surface p-2 shadow-lg">
          <div className="max-h-56 overflow-y-auto">
            {documents.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted">
                No documents attached. Upload a .txt or .md file to give this conversation extra context.
              </p>
            )}
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-hover">
                <FileText size={14} className="shrink-0 text-muted" />
                <span className="flex-1 truncate" title={doc.filename}>
                  {doc.filename}
                </span>
                <span className="shrink-0 text-xs text-muted">{doc.chunkCount} chunks</span>
                <button
                  type="button"
                  onClick={() => deleteDocument(doc.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-hover hover:text-foreground"
                  aria-label={`Remove ${doc.filename}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-1.5 text-xs font-medium text-muted hover:bg-surface-hover disabled:opacity-60"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {isUploading ? "Uploading…" : "Upload .txt / .md"}
          </button>
        </div>
      )}
    </div>
  );
}
