import type { AiChatMessage, AiContentPart } from "@/lib/ai";
import type { MessageRole } from "@/types/chat";

interface DbMessageLike {
  role: string;
  content: string;
}

const MARKDOWN_IMAGE = /!\[[^\]]*\]\((data:image\/[a-zA-Z0-9.+-]+;base64,[^)]+)\)/g;

/** Db messages store images as markdown so they round-trip through a single `content` column; this pulls them back out into OpenAI-style content parts for the model. */
export function toAiMessages(messages: DbMessageLike[]): AiChatMessage[] {
  return messages.map((message) => {
    const images = [...message.content.matchAll(MARKDOWN_IMAGE)].map((match) => match[1]);
    const text = message.content.replace(MARKDOWN_IMAGE, "").trim();

    const role = message.role as MessageRole;

    if (images.length === 0) {
      return { role, content: message.content };
    }

    const parts: AiContentPart[] = [
      ...(text ? [{ type: "text", text } as const] : []),
      ...images.map((url) => ({ type: "image_url", image_url: { url } }) as const),
    ];
    return { role, content: parts };
  });
}
