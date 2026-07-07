export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  supportsVision?: boolean;
}

export interface ApiErrorPayload {
  error: string;
  code:
    | "INVALID_API_KEY"
    | "RATE_LIMITED"
    | "EMPTY_PROMPT"
    | "NETWORK_ERROR"
    | "UNSUPPORTED_MODEL"
    | "NOT_FOUND"
    | "UNKNOWN";
}
