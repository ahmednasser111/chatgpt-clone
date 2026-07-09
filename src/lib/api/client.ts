import type {
  ApiErrorPayload,
  ChatMessage,
  Conversation,
  ConversationWithMessages,
  DocumentMeta,
  ModelOption,
} from "@/types/chat";

export class ApiRequestError extends Error {
  code: ApiErrorPayload["code"];
  status: number;

  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.error);
    this.name = "ApiRequestError";
    this.code = payload.code;
    this.status = status;
  }
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
      code: "UNKNOWN",
    }))) as ApiErrorPayload;
    throw new ApiRequestError(payload, response.status);
  }
  return response.json() as Promise<T>;
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new ApiRequestError({ error: "Network request failed. Check your connection.", code: "NETWORK_ERROR" }, 0);
  }
  return parseJsonOrThrow<T>(response);
}

export function fetchModels(): Promise<{ models: ModelOption[] }> {
  return requestJson("/api/models");
}

export function fetchConversations(): Promise<{ conversations: Conversation[] }> {
  return requestJson("/api/conversations");
}

export function fetchConversation(id: string): Promise<{ conversation: ConversationWithMessages }> {
  return requestJson(`/api/conversations/${id}`);
}

export function createConversationRequest(model: string, title?: string): Promise<{ conversation: Conversation }> {
  return requestJson("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, title }),
  });
}

export function renameConversationRequest(id: string, title: string): Promise<{ conversation: Conversation }> {
  return requestJson(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export function updateConversationModelRequest(id: string, model: string): Promise<{ conversation: Conversation }> {
  return requestJson(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
}

export async function deleteConversationRequest(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    await parseJsonOrThrow(response);
  }
}

export async function deleteLastUserMessageRequest(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/messages/last`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    await parseJsonOrThrow(response);
  }
}

export function editLastUserMessageRequest(conversationId: string, content: string): Promise<{ message: ChatMessage }> {
  return requestJson(`/api/conversations/${conversationId}/messages/last`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export function listDocumentsRequest(conversationId: string): Promise<{ documents: DocumentMeta[] }> {
  return requestJson(`/api/conversations/${conversationId}/documents`);
}

export function uploadDocumentRequest(conversationId: string, file: File): Promise<{ document: DocumentMeta }> {
  const formData = new FormData();
  formData.append("file", file);
  return requestJson(`/api/conversations/${conversationId}/documents`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteDocumentRequest(conversationId: string, documentId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}/documents/${documentId}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    await parseJsonOrThrow(response);
  }
}

export type SseHandlers = {
  onDelta: (delta: string) => void;
  onDone: (message: ChatMessage) => void;
  onError: (error: ApiErrorPayload) => void;
};

async function consumeSseStream(response: Response, handlers: SseHandlers, conversationId: string): Promise<void> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
      code: "UNKNOWN",
    }))) as ApiErrorPayload;
    handlers.onError(payload);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError({ error: "No response stream from server.", code: "UNKNOWN" });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const event = JSON.parse(trimmed.slice(5).trim());

      if (event.type === "delta") {
        handlers.onDelta(event.content);
      } else if (event.type === "done") {
        handlers.onDone({
          id: event.messageId,
          conversationId,
          role: "assistant",
          content: event.content,
          createdAt: event.createdAt,
        });
      } else if (event.type === "error") {
        handlers.onError({ error: event.error, code: event.code });
      }
    }
  }
}

export function sendMessageStream(
  conversationId: string,
  content: string,
  handlers: SseHandlers,
  signal?: AbortSignal,
): Promise<void> {
  return fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal,
  }).then((response) => consumeSseStream(response, handlers, conversationId));
}

export function regenerateStream(conversationId: string, handlers: SseHandlers, signal?: AbortSignal): Promise<void> {
  return fetch(`/api/conversations/${conversationId}/regenerate`, {
    method: "POST",
    signal,
  }).then((response) => consumeSseStream(response, handlers, conversationId));
}
