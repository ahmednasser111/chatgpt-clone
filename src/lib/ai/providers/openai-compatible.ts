import { AiServiceError, errorFromProviderResponse } from "../errors";
import type { GenerateOptions } from "../types";
import type { ProviderAdapter } from "./types";

export interface OpenAiCompatibleConfig {
  label: string;
  baseUrl: string;
  apiKey?: string;
  keyEnvVar: string;
  chatPath?: string;
}

/**
 * Client for any backend that speaks the OpenAI chat-completions shape
 * (Hugging Face's router, Ollama's /v1 endpoint, etc). Config differs only
 * in base URL and whether an API key is required.
 */
export function createOpenAiCompatibleAdapter(config: OpenAiCompatibleConfig): ProviderAdapter {
  const chatUrl = `${config.baseUrl}${config.chatPath ?? "/chat/completions"}`;

  async function call({ model, messages, signal }: GenerateOptions, stream: boolean): Promise<Response> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

    let response: Response;
    try {
      response = await fetch(chatUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages, stream }),
        signal,
      });
    } catch (cause) {
      if (cause instanceof AiServiceError) throw cause;
      throw new AiServiceError(
        "NETWORK_ERROR",
        `Could not reach ${config.label}. Check your network connection and that its base URL is correct.`,
        0,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw errorFromProviderResponse(config.label, response.status, body, config.keyEnvVar);
    }

    return response;
  }

  async function generateResponse(options: GenerateOptions): Promise<string> {
    const response = await call(options, false);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new AiServiceError("UNKNOWN", `${config.label} returned an unexpected response shape.`, 502);
    }
    return content;
  }

  async function* streamResponse(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    const response = await call(options, true);
    const body = response.body;
    if (!body) {
      throw new AiServiceError("UNKNOWN", `${config.label} response had no body to stream.`, 502);
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

  return { generateResponse, streamResponse };
}
