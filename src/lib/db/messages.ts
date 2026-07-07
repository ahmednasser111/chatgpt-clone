import { prisma } from "./prisma";
import type { MessageRole } from "@/types/chat";

export function listMessages(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export function addMessage(conversationId: string, role: MessageRole, content: string) {
  return prisma.message.create({
    data: { conversationId, role, content },
  });
}

export function getLastMessage(conversationId: string) {
  return prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
}

export function getLastUserMessage(conversationId: string) {
  return prisma.message.findFirst({
    where: { conversationId, role: "user" },
    orderBy: { createdAt: "desc" },
  });
}

/** Deletes a message and any messages created at/after it, so a forked reply chain doesn't linger. */
export function deleteMessageAndAfter(conversationId: string, fromCreatedAt: Date) {
  return prisma.message.deleteMany({
    where: { conversationId, createdAt: { gte: fromCreatedAt } },
  });
}

export function deleteMessage(id: string) {
  return prisma.message.delete({ where: { id } });
}

export function updateMessageContent(id: string, content: string) {
  return prisma.message.update({
    where: { id },
    data: { content },
  });
}
