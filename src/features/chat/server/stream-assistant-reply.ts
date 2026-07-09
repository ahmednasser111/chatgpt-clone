import { AiServiceError, streamResponse } from "@/lib/ai";
import type { AiChatMessage } from "@/lib/ai";
import { encodeSseEvent } from "@/lib/ai/sse";
import { addMessage } from "@/lib/db/messages";
import { touchConversation } from "@/lib/db/conversations";
import { hasDocuments } from "@/lib/db/documents";
import { embed } from "@/lib/ai/providers/ollama-embeddings";
import { retrieveContext } from "@/lib/rag/retrieve";

function lastUserText(history: AiChatMessage[]): string | undefined {
  const message = [...history].reverse().find((m) => m.role === "user");
  if (!message) return undefined;
  return typeof message.content === "string"
    ? message.content
    : message.content
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("\n");
}

/**
 * If the conversation has attached documents, embeds the latest user turn,
 * retrieves the most relevant chunks, and splices them in as a system
 * message right before that turn. Non-fatal on failure (e.g. Ollama down) —
 * falls back to the unmodified history so RAG never breaks plain chat.
 */
async function withRetrievedContext(conversationId: string, history: AiChatMessage[]): Promise<AiChatMessage[]> {
  if (!(await hasDocuments(conversationId))) return history;

  const query = lastUserText(history);
  if (!query) return history;

  try {
    const queryEmbedding = await embed(query);
    const matches = await retrieveContext(conversationId, queryEmbedding);
    if (matches.length === 0) return history;

    const contextBlock = matches
      .map((m) => `From ${m.filename}:\n${m.content}`)
      .join("\n\n---\n\n");
    const contextMessage: AiChatMessage = {
      role: "system",
      content: `Use the following context from attached documents if relevant to the user's question:\n\n${contextBlock}`,
    };

    const lastUserIndex = history.map((m) => m.role).lastIndexOf("user");
    return [...history.slice(0, lastUserIndex), contextMessage, ...history.slice(lastUserIndex)];
  } catch (err) {
    console.error("RAG retrieval failed, continuing without context:", err);
    return history;
  }
}

/**
 * Streams an assistant reply as SSE bytes and persists the final message once
 * the model finishes. Errors mid-stream are sent as an `error` SSE event
 * rather than an HTTP error, since headers are already committed by then.
 */
export function streamAssistantReply(
  conversationId: string,
  model: string,
  history: AiChatMessage[],
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const augmentedHistory = await withRetrievedContext(conversationId, history);
        for await (const delta of streamResponse({ model, messages: augmentedHistory })) {
          full += delta;
          controller.enqueue(encodeSseEvent({ type: "delta", content: delta }));
        }

        const saved = await addMessage(conversationId, "assistant", full);
        await touchConversation(conversationId);

        controller.enqueue(
          encodeSseEvent({
            type: "done",
            messageId: saved.id,
            content: saved.content,
            createdAt: saved.createdAt.toISOString(),
          }),
        );
      } catch (err) {
        const payload =
          err instanceof AiServiceError
            ? { error: err.message, code: err.code }
            : { error: "Unexpected error while generating a response.", code: "UNKNOWN" };

        // Persist whatever partial content we got so history stays consistent, if any.
        if (full) {
          await addMessage(conversationId, "assistant", full).catch(() => {});
          await touchConversation(conversationId).catch(() => {});
        }

        controller.enqueue(encodeSseEvent({ type: "error", ...payload }));
      } finally {
        controller.close();
      }
    },
  });
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
