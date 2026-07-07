"use client";

import { useState } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { ChatMessage } from "@/types/chat";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { CopyButton } from "@/components/CopyButton";

interface MessageBubbleProps {
  message: ChatMessage;
  isLastUserMessage: boolean;
  isLastAssistantMessage: boolean;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onRegenerate: () => void;
}

export function MessageBubble({
  message,
  isLastUserMessage,
  isLastAssistantMessage,
  onEdit,
  onDelete,
  onRegenerate,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const isUser = message.role === "user";

  function commitEdit() {
    setIsEditing(false);
    if (draft.trim() && draft.trim() !== message.content) {
      onEdit(draft.trim());
    } else {
      setDraft(message.content);
    }
  }

  return (
    <div className={clsx("group flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={clsx("flex max-w-[85%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {isEditing ? (
          <div className="w-full min-w-[16rem] rounded-2xl border border-border bg-background p-3">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(8, Math.max(2, draft.split("\n").length))}
              className="w-full resize-none bg-transparent text-sm outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(message.content);
                  setIsEditing(false);
                }}
                className="rounded-md px-3 py-1 text-xs hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitEdit}
                className="rounded-md bg-accent px-3 py-1 text-xs text-accent-foreground hover:opacity-90"
              >
                Save & submit
              </button>
            </div>
          </div>
        ) : (
          <div
            className={clsx(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isUser ? "bg-bubble-user text-bubble-user-foreground" : "bg-transparent",
            )}
          >
            <MarkdownRenderer content={message.content} />
          </div>
        )}

        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <CopyButton text={message.content} />
            {isUser && isLastUserMessage && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
                  aria-label="Edit message"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-danger"
                  aria-label="Delete message"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            )}
            {!isUser && isLastAssistantMessage && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
                aria-label="Regenerate response"
              >
                <RotateCcw size={14} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
