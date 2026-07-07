import { NextResponse } from "next/server";
import {
  deleteConversation,
  getConversationWithMessages,
  renameConversation,
  updateConversationModel,
} from "@/lib/db/conversations";
import { isSupportedModel } from "@/lib/ai";
import type { ApiErrorPayload } from "@/types/chat";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const conversation = await getConversationWithMessages(id);
  if (!conversation) {
    const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    let conversation = await getConversationWithMessages(id);
    if (!conversation) {
      const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
      return NextResponse.json(payload, { status: 404 });
    }

    if (typeof body.title === "string") {
      conversation = { ...conversation, ...(await renameConversation(id, body.title)) };
    }

    if (typeof body.model === "string") {
      if (!isSupportedModel(body.model)) {
        const payload: ApiErrorPayload = { error: `Model "${body.model}" is not supported.`, code: "UNSUPPORTED_MODEL" };
        return NextResponse.json(payload, { status: 400 });
      }
      conversation = { ...conversation, ...(await updateConversationModel(id, body.model)) };
    }

    return NextResponse.json({ conversation });
  } catch {
    const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    await deleteConversation(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }
}
