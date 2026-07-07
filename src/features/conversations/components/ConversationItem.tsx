"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, MessageSquare, Pencil, Trash2, X } from "lucide-react";
import clsx from "clsx";
import type { Conversation } from "@/types/chat";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationItem({ conversation, isActive, onSelect, onRename, onDelete }: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function commitRename() {
    setIsEditing(false);
    if (draftTitle.trim() && draftTitle.trim() !== conversation.title) {
      onRename(conversation.id, draftTitle.trim());
    } else {
      setDraftTitle(conversation.title);
    }
  }

  return (
    <div
      className={clsx(
        "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer",
        isActive ? "bg-surface-hover text-foreground" : "text-foreground/80 hover:bg-surface-hover",
      )}
      onClick={() => !isEditing && onSelect(conversation.id)}
    >
      <MessageSquare size={16} className="shrink-0 text-muted" />

      {isEditing ? (
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraftTitle(conversation.title);
              setIsEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded border border-border bg-background px-1 py-0.5 text-sm outline-none"
        />
      ) : (
        <div className="min-w-0 flex-1">
          <p className="truncate">{conversation.title}</p>
          <p className="truncate text-xs text-muted">{format(new Date(conversation.createdAt), "MMM d, yyyy")}</p>
        </div>
      )}

      <div className={clsx("flex shrink-0 items-center gap-0.5", isEditing || confirmingDelete ? "" : "opacity-0 group-hover:opacity-100")}>
        {isEditing ? (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); commitRename(); }} className="rounded p-1 hover:bg-surface" aria-label="Save title">
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDraftTitle(conversation.title);
                setIsEditing(false);
              }}
              className="rounded p-1 hover:bg-surface"
              aria-label="Cancel rename"
            >
              <X size={14} />
            </button>
          </>
        ) : confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id);
              }}
              className="rounded p-1 text-danger hover:bg-surface"
              aria-label="Confirm delete"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(false);
              }}
              className="rounded p-1 hover:bg-surface"
              aria-label="Cancel delete"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="rounded p-1 hover:bg-surface"
              aria-label="Rename conversation"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(true);
              }}
              className="rounded p-1 hover:bg-surface"
              aria-label="Delete conversation"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
