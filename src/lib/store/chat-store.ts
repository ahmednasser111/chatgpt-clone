import { create } from "zustand";
import type { ApiErrorPayload, ChatMessage, Conversation, DocumentMeta, ModelOption } from "@/types/chat";
import {
  ApiRequestError,
  createConversationRequest,
  deleteConversationRequest,
  deleteDocumentRequest,
  deleteLastUserMessageRequest,
  editLastUserMessageRequest,
  fetchConversation,
  fetchConversations,
  fetchModels,
  listDocumentsRequest,
  regenerateStream,
  renameConversationRequest,
  sendMessageStream,
  updateConversationModelRequest,
  uploadDocumentRequest,
} from "@/lib/api/client";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

type Status = "idle" | "loading" | "streaming";

interface ChatState {
  conversations: Conversation[];
  models: ModelOption[];
  activeId: string | null;
  messages: ChatMessage[];
  pendingModel: string;
  status: Status;
  streamingText: string;
  error: ApiErrorPayload | null;
  documents: DocumentMeta[];

  init: () => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setPendingModel: (model: string) => void;
  setActiveModel: (model: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  regenerate: () => Promise<void>;
  editLastUserMessage: (content: string) => Promise<void>;
  deleteLastUserMessage: () => Promise<void>;
  clearError: () => void;
  loadDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

export function selectActiveModel(state: Pick<ChatState, "conversations" | "activeId" | "pendingModel">): string {
  const active = state.conversations.find((c) => c.id === state.activeId);
  return active?.model ?? state.pendingModel;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  models: [],
  activeId: null,
  messages: [],
  pendingModel: DEFAULT_MODEL_ID,
  status: "idle",
  streamingText: "",
  error: null,
  documents: [],

  init: async () => {
    try {
      const [{ models }, { conversations }] = await Promise.all([fetchModels(), fetchConversations()]);
      set({ models, conversations });
    } catch (err) {
      set({ error: toErrorPayload(err) });
    }
  },

  startNewConversation: () => {
    set({ activeId: null, messages: [], streamingText: "", error: null, documents: [] });
  },

  selectConversation: async (id) => {
    set({ status: "loading", error: null });
    try {
      const { conversation } = await fetchConversation(id);
      set({ activeId: id, messages: conversation.messages, status: "idle" });
      await get().loadDocuments();
    } catch (err) {
      set({ error: toErrorPayload(err), status: "idle" });
    }
  },

  renameConversation: async (id, title) => {
    try {
      const { conversation } = await renameConversationRequest(id, title);
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? conversation : c)),
      }));
    } catch (err) {
      set({ error: toErrorPayload(err) });
    }
  },

  deleteConversation: async (id) => {
    try {
      await deleteConversationRequest(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        activeId: state.activeId === id ? null : state.activeId,
        messages: state.activeId === id ? [] : state.messages,
      }));
    } catch (err) {
      set({ error: toErrorPayload(err) });
    }
  },

  setPendingModel: (model) => set({ pendingModel: model }),

  setActiveModel: async (model) => {
    const { activeId } = get();
    if (!activeId) {
      set({ pendingModel: model });
      return;
    }
    try {
      const { conversation } = await updateConversationModelRequest(activeId, model);
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === activeId ? conversation : c)),
      }));
    } catch (err) {
      set({ error: toErrorPayload(err) });
    }
  },

  sendMessage: async (content) => {
    const trimmed = content.trim();
    if (!trimmed) {
      set({ error: { error: "Message cannot be empty.", code: "EMPTY_PROMPT" } });
      return;
    }

    let { activeId } = get();
    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      conversationId: activeId ?? "",
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    try {
      if (!activeId) {
        const { conversation } = await createConversationRequest(get().pendingModel);
        activeId = conversation.id;
        set((state) => ({ activeId, conversations: [conversation, ...state.conversations] }));
      }

      optimisticUser.conversationId = activeId;
      set((state) => ({
        messages: [...state.messages, optimisticUser],
        status: "streaming",
        streamingText: "",
        error: null,
      }));

      await sendMessageStream(activeId, trimmed, streamHandlers(set, get), undefined);
      await refreshConversationMeta(set);
    } catch (err) {
      set({ error: toErrorPayload(err), status: "idle" });
    }
  },

  regenerate: async () => {
    const { activeId } = get();
    if (!activeId) return;

    set((state) => ({
      messages: state.messages.at(-1)?.role === "assistant" ? state.messages.slice(0, -1) : state.messages,
      status: "streaming",
      streamingText: "",
      error: null,
    }));

    try {
      await regenerateStream(activeId, streamHandlers(set, get), undefined);
      await refreshConversationMeta(set);
    } catch (err) {
      set({ error: toErrorPayload(err), status: "idle" });
    }
  },

  editLastUserMessage: async (content) => {
    const { activeId } = get();
    const trimmed = content.trim();
    if (!activeId || !trimmed) return;

    set({ status: "loading", error: null });
    try {
      await editLastUserMessageRequest(activeId, trimmed);
      set((state) => {
        const lastUserIndex = [...state.messages].reverse().findIndex((m) => m.role === "user");
        if (lastUserIndex === -1) return { status: "idle" };
        const index = state.messages.length - 1 - lastUserIndex;
        const updated = state.messages.slice(0, index + 1);
        updated[index] = { ...updated[index], content: trimmed };
        return { messages: updated, status: "idle" };
      });
      await get().regenerate();
    } catch (err) {
      set({ error: toErrorPayload(err), status: "idle" });
    }
  },

  deleteLastUserMessage: async () => {
    const { activeId } = get();
    if (!activeId) return;

    set({ status: "loading", error: null });
    try {
      await deleteLastUserMessageRequest(activeId);
      set((state) => {
        const lastUserIndex = [...state.messages].reverse().findIndex((m) => m.role === "user");
        if (lastUserIndex === -1) return { status: "idle" };
        const index = state.messages.length - 1 - lastUserIndex;
        return { messages: state.messages.slice(0, index), status: "idle" };
      });
    } catch (err) {
      set({ error: toErrorPayload(err), status: "idle" });
    }
  },

  clearError: () => set({ error: null }),

  loadDocuments: async () => {
    const { activeId } = get();
    if (!activeId) {
      set({ documents: [] });
      return;
    }
    try {
      const { documents } = await listDocumentsRequest(activeId);
      set({ documents });
    } catch (err) {
      set({ error: toErrorPayload(err) });
    }
  },

  uploadDocument: async (file) => {
    const { activeId } = get();
    if (!activeId) return;
    try {
      const { document } = await uploadDocumentRequest(activeId, file);
      set((state) => ({ documents: [...state.documents, document] }));
    } catch (err) {
      set({ error: toErrorPayload(err) });
    }
  },

  deleteDocument: async (documentId) => {
    const { activeId } = get();
    if (!activeId) return;
    try {
      await deleteDocumentRequest(activeId, documentId);
      set((state) => ({ documents: state.documents.filter((d) => d.id !== documentId) }));
    } catch (err) {
      set({ error: toErrorPayload(err) });
    }
  },
}));

function streamHandlers(set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void, get: () => ChatState) {
  return {
    onDelta: (delta: string) => set((state) => ({ streamingText: state.streamingText + delta })),
    onDone: (message: ChatMessage) => set({ messages: [...get().messages, message], streamingText: "", status: "idle" }),
    onError: (error: ApiErrorPayload) => set({ error, streamingText: "", status: "idle" }),
  };
}

async function refreshConversationMeta(set: (partial: Partial<ChatState>) => void) {
  try {
    const { conversations } = await fetchConversations();
    set({ conversations });
  } catch {
    // Non-fatal — sidebar metadata (title/updatedAt) just stays stale until next refresh.
  }
}

function toErrorPayload(err: unknown): ApiErrorPayload {
  if (err instanceof ApiRequestError) return { error: err.message, code: err.code };
  if (err instanceof Error) return { error: err.message, code: "UNKNOWN" };
  return { error: "Something went wrong.", code: "UNKNOWN" };
}
