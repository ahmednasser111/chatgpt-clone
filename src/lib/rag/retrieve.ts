import { prisma } from "@/lib/db/prisma";

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface RetrievedChunk {
  filename: string;
  content: string;
  score: number;
}

/** Ranks every chunk attached to a conversation by similarity to the query embedding and returns the top matches. */
export async function retrieveContext(
  conversationId: string,
  queryEmbedding: number[],
  topK = 4,
): Promise<RetrievedChunk[]> {
  const chunks = await prisma.documentChunk.findMany({
    where: { document: { conversationId } },
    include: { document: { select: { filename: true } } },
  });

  return chunks
    .map((chunk) => ({
      filename: chunk.document.filename,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, JSON.parse(chunk.embedding) as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
