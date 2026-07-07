import { AiServiceError, streamResponse } from "@/lib/ai";
import type { AiChatMessage } from "@/lib/ai";
import { encodeSseEvent } from "@/lib/ai/sse";
import { addMessage } from "@/lib/db/messages";
import { touchConversation } from "@/lib/db/conversations";

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
        for await (const delta of streamResponse({ model, messages: history })) {
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
