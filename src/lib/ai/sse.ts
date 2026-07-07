export type SseEvent =
  | { type: "delta"; content: string }
  | { type: "done"; messageId: string; content: string; createdAt: string }
  | { type: "error"; error: string; code: string };

export function encodeSseEvent(event: SseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}
