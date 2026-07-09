import { AiServiceError } from "./errors";
import { createItiProxyAdapter } from "./providers/iti-proxy";
import { createOpenAiCompatibleAdapter } from "./providers/openai-compatible";
import type { ProviderAdapter } from "./providers/types";

function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AiServiceError("INVALID_API_KEY", `${name} is not set. ${hint}`, 401);
  }
  return value;
}

const adapters: Record<string, () => ProviderAdapter> = {
  huggingface: () =>
    createOpenAiCompatibleAdapter({
      label: "Hugging Face",
      baseUrl: "https://router.huggingface.co/v1",
      apiKey: requireEnv("HF_API_KEY", "Add it to your .env file."),
      keyEnvVar: "HF_API_KEY",
    }),

  ollama: () =>
    createOpenAiCompatibleAdapter({
      label: "Ollama",
      baseUrl: `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/v1`,
      keyEnvVar: "OLLAMA_BASE_URL",
    }),

  iti: () =>
    createItiProxyAdapter({
      label: "ITI proxy",
      baseUrl: requireEnv("ITI_BASE_URL", "Add it to your .env file."),
      chatPath: process.env.ITI_CHAT_PATH ?? "/student/chat",
      apiKey: requireEnv("ITI_API_KEY", "Add it to your .env file."),
      keyEnvVar: "ITI_API_KEY",
    }),
};

/** Adapters are built per-call (not cached at module scope) so missing env vars surface as request errors, not import-time crashes. */
export function getProviderAdapter(providerId: string): ProviderAdapter {
  const factory = adapters[providerId];
  if (!factory) {
    throw new AiServiceError("UNSUPPORTED_MODEL", `Unknown provider "${providerId}".`, 400);
  }
  return factory();
}
