"use client";

import type { Conversation } from "@/types/chat";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect, onRename, onDelete }: ConversationListProps) {
  if (conversations.length === 0) {
    return <p className="px-2.5 py-4 text-sm text-muted">No conversations yet. Start a new chat!</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
