"use client";

import { selectActiveModel, useChatStore } from "@/lib/store/chat-store";

export function useModels() {
  const models = useChatStore((state) => state.models);
  const activeModel = useChatStore(selectActiveModel);
  const setActiveModel = useChatStore((state) => state.setActiveModel);

  return { models, activeModel, setActiveModel };
}
