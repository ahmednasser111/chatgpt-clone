export type AiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string | AiContentPart[];
}

export interface GenerateOptions {
  model: string;
  messages: AiChatMessage[];
  signal?: AbortSignal;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
}
