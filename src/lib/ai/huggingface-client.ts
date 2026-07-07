import { AiServiceError, errorFromHfResponse } from "./errors";
import { isSupportedModel } from "./models";
import type { GenerateOptions } from "./types";

const HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions";

function getApiKey(): string {
  const key = process.env.HF_API_KEY;
  if (!key) {
    throw new AiServiceError(
      "INVALID_API_KEY",
      "HF_API_KEY is not set. Add it to your .env file.",
      401,
    );
  }
  return key;
}

function assertSupportedModel(model: string) {
  if (!isSupportedModel(model)) {
    throw new AiServiceError("UNSUPPORTED_MODEL", `Model "${model}" is not supported.`, 400);
  }
}

async function callHuggingFace(
  { model, messages, signal }: GenerateOptions,
  stream: boolean,
): Promise<Response> {
  assertSupportedModel(model);

  let response: Response;
  try {
    response = await fetch(HF_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, stream }),
      signal,
    });
  } catch (cause) {
    if (cause instanceof AiServiceError) throw cause;
    throw new AiServiceError(
      "NETWORK_ERROR",
      "Could not reach Hugging Face. Check your network connection.",
      0,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw errorFromHfResponse(response.status, body);
  }

  return response;
}

/** Non-streaming completion — returns the full assistant message text. */
export async function generateResponse(options: GenerateOptions): Promise<string> {
  const response = await callHuggingFace(options, false);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AiServiceError("UNKNOWN", "Hugging Face returned an unexpected response shape.", 502);
  }
  return content;
}

/** Streaming completion — yields text deltas as they arrive over SSE. */
export async function* streamResponse(
  options: GenerateOptions,
): AsyncGenerator<string, void, unknown> {
  const response = await callHuggingFace(options, true);
  const body = response.body;
  if (!body) {
    throw new AiServiceError("UNKNOWN", "Hugging Face response had no body to stream.", 502);
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;

        try {
          const json = JSON.parse(payload);
          const delta: string | undefined = json?.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore malformed keep-alive/partial chunks.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
