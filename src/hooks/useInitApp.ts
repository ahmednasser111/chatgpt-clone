"use client";

import { useEffect } from "react";
import { useChatStore } from "@/lib/store/chat-store";

/** Loads the model list and conversation list once when the app mounts. */
export function useInitApp() {
  const init = useChatStore((state) => state.init);
  useEffect(() => {
    init();
  }, [init]);
}
