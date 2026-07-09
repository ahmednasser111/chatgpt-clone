import { NextResponse } from "next/server";
import { deleteDocument } from "@/lib/db/documents";
import type { ApiErrorPayload } from "@/types/chat";

type RouteContext = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { docId } = await params;
  try {
    await deleteDocument(docId);
    return new NextResponse(null, { status: 204 });
  } catch {
    const payload: ApiErrorPayload = { error: "Document not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }
}
