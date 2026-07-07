import { NextResponse } from "next/server";
import { getConversationWithMessages, renameConversation, touchConversation } from "@/lib/db/conversations";
import { addMessage, listMessages } from "@/lib/db/messages";
import { streamAssistantReply, sseResponse } from "@/features/chat/server/stream-assistant-reply";
import { toAiMessages } from "@/features/chat/server/to-ai-messages";
import type { ApiErrorPayload } from "@/types/chat";

type RouteContext = { params: Promise<{ id: string }> };

function titleFromContent(content: string): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine || "New conversation";
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const content: string = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    const payload: ApiErrorPayload = { error: "Message cannot be empty.", code: "EMPTY_PROMPT" };
    return NextResponse.json(payload, { status: 400 });
  }

  const conversation = await getConversationWithMessages(id);
  if (!conversation) {
    const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }

  await addMessage(id, "user", content);

  if (conversation.messages.length === 0) {
    await renameConversation(id, titleFromContent(content));
  }
  await touchConversation(id);

  const history = await listMessages(id);
  const stream = streamAssistantReply(id, conversation.model, toAiMessages(history));
  return sseResponse(stream);
}
