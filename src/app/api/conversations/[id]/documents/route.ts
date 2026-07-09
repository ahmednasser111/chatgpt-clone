import { NextResponse } from "next/server";
import { getConversationWithMessages } from "@/lib/db/conversations";
import { createDocumentWithChunks, listDocuments } from "@/lib/db/documents";
import { chunkText } from "@/lib/rag/chunk";
import { embed } from "@/lib/ai/providers/ollama-embeddings";
import { AiServiceError } from "@/lib/ai";
import type { ApiErrorPayload, DocumentMeta } from "@/types/chat";

type RouteContext = { params: Promise<{ id: string }> };

function toDocumentMeta(doc: { id: string; conversationId: string; filename: string; createdAt: Date; _count: { chunks: number } }): DocumentMeta {
  return {
    id: doc.id,
    conversationId: doc.conversationId,
    filename: doc.filename,
    chunkCount: doc._count.chunks,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const documents = await listDocuments(id);
  return NextResponse.json({ documents: documents.map(toDocumentMeta) });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const conversation = await getConversationWithMessages(id);
  if (!conversation) {
    const payload: ApiErrorPayload = { error: "Conversation not found.", code: "NOT_FOUND" };
    return NextResponse.json(payload, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    const payload: ApiErrorPayload = { error: "No file provided.", code: "INVALID_FILE_TYPE" };
    return NextResponse.json(payload, { status: 400 });
  }

  if (!/\.(txt|md)$/i.test(file.name)) {
    const payload: ApiErrorPayload = { error: "Only .txt and .md files are supported.", code: "INVALID_FILE_TYPE" };
    return NextResponse.json(payload, { status: 400 });
  }

  const text = await file.text();
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    const payload: ApiErrorPayload = { error: "The file appears to be empty.", code: "INVALID_FILE_TYPE" };
    return NextResponse.json(payload, { status: 400 });
  }

  try {
    const embedded = await Promise.all(
      chunks.map(async (content) => ({ content, embedding: await embed(content) })),
    );
    const document = await createDocumentWithChunks(id, file.name, embedded);
    return NextResponse.json({ document: toDocumentMeta(document) }, { status: 201 });
  } catch (err) {
    if (err instanceof AiServiceError) {
      return NextResponse.json(err.toPayload(), { status: err.status });
    }
    const payload: ApiErrorPayload = { error: "Failed to ingest document.", code: "UNKNOWN" };
    return NextResponse.json(payload, { status: 500 });
  }
}
