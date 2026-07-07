"use client";

import { useChatStore } from "@/lib/store/chat-store";

export function useConversations() {
  const conversations = useChatStore((state) => state.conversations);
  const activeId = useChatStore((state) => state.activeId);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const startNewConversation = useChatStore((state) => state.startNewConversation);
  const renameConversation = useChatStore((state) => state.renameConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);

  return {
    conversations,
    activeId,
    selectConversation,
    startNewConversation,
    renameConversation,
    deleteConversation,
  };
}
