"use client";

import { useChatStore } from "@/lib/store/chat-store";

export function useChat() {
  const messages = useChatStore((state) => state.messages);
  const status = useChatStore((state) => state.status);
  const streamingText = useChatStore((state) => state.streamingText);
  const error = useChatStore((state) => state.error);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const regenerate = useChatStore((state) => state.regenerate);
  const editLastUserMessage = useChatStore((state) => state.editLastUserMessage);
  const deleteLastUserMessage = useChatStore((state) => state.deleteLastUserMessage);
  const clearError = useChatStore((state) => state.clearError);

  return {
    messages,
    status,
    streamingText,
    error,
    sendMessage,
    regenerate,
    editLastUserMessage,
    deleteLastUserMessage,
    clearError,
    isStreaming: status === "streaming",
  };
}
