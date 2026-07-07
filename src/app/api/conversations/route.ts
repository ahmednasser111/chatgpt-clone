import { NextResponse } from "next/server";
import { createConversation, listConversations } from "@/lib/db/conversations";
import { isSupportedModel, DEFAULT_MODEL_ID } from "@/lib/ai";
import type { ApiErrorPayload } from "@/types/chat";

export async function GET() {
  const conversations = await listConversations();
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const model = typeof body.model === "string" ? body.model : DEFAULT_MODEL_ID;

  if (!isSupportedModel(model)) {
    const payload: ApiErrorPayload = { error: `Model "${model}" is not supported.`, code: "UNSUPPORTED_MODEL" };
    return NextResponse.json(payload, { status: 400 });
  }

  const conversation = await createConversation({
    title: typeof body.title === "string" ? body.title : undefined,
    model,
  });
  return NextResponse.json({ conversation }, { status: 201 });
}
