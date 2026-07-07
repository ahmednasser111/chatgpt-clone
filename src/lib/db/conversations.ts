import { prisma } from "./prisma";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export function listConversations() {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export function getConversationWithMessages(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export function createConversation(data: { title?: string; model?: string }) {
  return prisma.conversation.create({
    data: {
      title: data.title?.trim() || "New conversation",
      model: data.model || DEFAULT_MODEL_ID,
    },
  });
}

export function renameConversation(id: string, title: string) {
  return prisma.conversation.update({
    where: { id },
    data: { title: title.trim() || "Untitled conversation" },
  });
}

export function updateConversationModel(id: string, model: string) {
  return prisma.conversation.update({
    where: { id },
    data: { model },
  });
}

export function touchConversation(id: string) {
  return prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
}

export function deleteConversation(id: string) {
  return prisma.conversation.delete({ where: { id } });
}
