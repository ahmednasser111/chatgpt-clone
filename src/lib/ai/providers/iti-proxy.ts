import { AiServiceError, errorFromProviderResponse } from "../errors";
import type { AiChatMessage, GenerateOptions } from "../types";
import type { ProviderAdapter } from "./types";

export interface ItiProxyConfig {
  label: string;
  baseUrl: string;
  chatPath: string;
  apiKey?: string;
  keyEnvVar: string;
  maxTokens?: number;
}

function textOf(content: AiChatMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

/** Digs an assistant reply out of an unknown proxy response shape. */
function extractContent(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const candidates = [
    record.output_text,
    (record.choices as { message?: { content?: unknown } }[] | undefined)?.[0]?.message?.content,
    record.response,
    record.output,
    record.answer,
    record.content,
    record.text,
  ];
  return candidates.find((value): value is string => typeof value === "string");
}

/**
 * Client for the custom ITI student-proxy shape: { model_id, messages,
 * system_prompt, max_tokens } posted to a single non-streaming endpoint.
 * There's no SSE support, so streamResponse fakes it by chunking the full
 * reply once it comes back.
 */
export function createItiProxyAdapter(config: ItiProxyConfig): ProviderAdapter {
  const chatUrl = `${config.baseUrl}${config.chatPath}`;

  async function generateResponse({ model, messages, signal }: GenerateOptions): Promise<string> {
    const systemPrompt = messages
      .filter((m) => m.role === "system")
      .map((m) => textOf(m.content))
      .join("\n\n");
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: textOf(m.content) }));

    let response: Response;
    try {
      response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: model,
          messages: conversation,
          ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
          max_tokens: config.maxTokens ?? 1024,
        }),
        signal,
      });
    } catch (cause) {
      if (cause instanceof AiServiceError) throw cause;
      throw new AiServiceError(
        "NETWORK_ERROR",
        `Could not reach ${config.label}. Check your network connection and ITI_BASE_URL.`,
        0,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw errorFromProviderResponse(config.label, response.status, body, config.keyEnvVar);
    }

    const data = await response.json().catch(() => undefined);
    const content = extractContent(data);
    if (content === undefined) {
      throw new AiServiceError(
        "UNKNOWN",
        `${config.label} returned an unrecognized response shape: ${JSON.stringify(data).slice(0, 300)}`,
        502,
      );
    }
    return content;
  }

  async function* streamResponse(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    const full = await generateResponse(options);
    const words = full.split(/(?<=\s)/);
    for (const word of words) {
      yield word;
    }
  }

  return { generateResponse, streamResponse };
}
