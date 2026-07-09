import { prisma } from "./prisma";

export function listDocuments(conversationId: string) {
  return prisma.document.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function hasDocuments(conversationId: string): Promise<boolean> {
  const count = await prisma.document.count({ where: { conversationId } });
  return count > 0;
}

export async function createDocumentWithChunks(
  conversationId: string,
  filename: string,
  chunks: { content: string; embedding: number[] }[],
) {
  return prisma.document.create({
    data: {
      conversationId,
      filename,
      chunks: {
        create: chunks.map((chunk, index) => ({
          chunkIndex: index,
          content: chunk.content,
          embedding: JSON.stringify(chunk.embedding),
        })),
      },
    },
    include: { _count: { select: { chunks: true } } },
  });
}

export function deleteDocument(id: string) {
  return prisma.document.delete({ where: { id } });
}
