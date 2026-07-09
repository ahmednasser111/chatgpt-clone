"use client";

import { useChatStore } from "@/lib/store/chat-store";

export function useDocuments() {
  const documents = useChatStore((state) => state.documents);
  const uploadDocument = useChatStore((state) => state.uploadDocument);
  const deleteDocument = useChatStore((state) => state.deleteDocument);

  return { documents, uploadDocument, deleteDocument };
}
