import { NextResponse } from "next/server";
import { getConversationWithMessages, touchConversation } from "@/lib/db/conversations";
import { deleteMessageAndAfter, getLastUserMessage, updateMessageContent } from "@/lib/db/messages";
import type { ApiErrorPayload } from "@/types/chat";

type RouteContext = { params: Promise<{ id: string }> };

/** Edit the last user prompt in place. The client should follow up with a
 *  POST to /regenerate if it wants a fresh assistant reply for the edit. */
export async function PATCH(request: Request, { params }: RouteContext) {
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

  const lastUserMessage = await getLastUserMessage(id);
  if (!lastUserMessage) {
    const payload: ApiErrorPayload = { error: "There is no user prompt to edit.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }

  // Drop anything after the edited prompt (e.g. its stale assistant reply) since it no longer applies.
  await deleteMessageAndAfter(id, new Date(lastUserMessage.createdAt.getTime() + 1));
  const updated = await updateMessageContent(lastUserMessage.id, content);
  await touchConversation(id);

  return NextResponse.json({ message: updated });
}

/** Delete the last user prompt and any assistant reply that followed it. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const conversation = await getConversationWithMessages(id);
  if (!conversation) {
    const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }

  const lastUserMessage = await getLastUserMessage(id);
  if (!lastUserMessage) {
    const payload: ApiErrorPayload = { error: "There is no user prompt to delete.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }

  await deleteMessageAndAfter(id, lastUserMessage.createdAt);
  await touchConversation(id);

  return new NextResponse(null, { status: 204 });
}
