import { NextResponse } from "next/server";
import { getConversationWithMessages, touchConversation } from "@/lib/db/conversations";
import { deleteMessageAndAfter, listMessages } from "@/lib/db/messages";
import { streamAssistantReply, sseResponse } from "@/features/chat/server/stream-assistant-reply";
import { toAiMessages } from "@/features/chat/server/to-ai-messages";
import type { ApiErrorPayload } from "@/types/chat";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const conversation = await getConversationWithMessages(id);
  if (!conversation) {
    const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }

  const lastMessage = conversation.messages.at(-1);
  if (!lastMessage) {
    const payload: ApiErrorPayload = { error: "There is nothing to regenerate yet.", code: "EMPTY_PROMPT" };
    return NextResponse.json(payload, { status: 400 });
  }

  if (lastMessage.role === "assistant") {
    await deleteMessageAndAfter(id, lastMessage.createdAt);
  }

  const history = await listMessages(id);
  if (history.length === 0 || history.at(-1)?.role !== "user") {
    const payload: ApiErrorPayload = { error: "There is no user prompt to respond to.", code: "EMPTY_PROMPT" };
    return NextResponse.json(payload, { status: 400 });
  }

  await touchConversation(id);
  const stream = streamAssistantReply(id, conversation.model, toAiMessages(history));
  return sseResponse(stream);
}
