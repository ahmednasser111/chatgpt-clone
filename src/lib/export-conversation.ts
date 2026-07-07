import type { ChatMessage, Conversation } from "@/types/chat";

export function exportConversationAsJson(conversation: Conversation, messages: ChatMessage[]) {
  const payload = {
    id: conversation.id,
    title: conversation.title,
    model: conversation.model,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: messages.map(({ role, content, createdAt }) => ({ role, content, createdAt })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${conversation.title.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "conversation"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
