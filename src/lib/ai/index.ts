import { AiServiceError } from "./errors";
import { getProviderIdForModel, isSupportedModel } from "./models";
import { getProviderAdapter } from "./providers.config";
import type { GenerateOptions } from "./types";

function assertSupportedModel(model: string) {
  if (!isSupportedModel(model)) {
    throw new AiServiceError("UNSUPPORTED_MODEL", `Model "${model}" is not supported.`, 400);
  }
}

export function generateResponse(options: GenerateOptions): Promise<string> {
  assertSupportedModel(options.model);
  const adapter = getProviderAdapter(getProviderIdForModel(options.model));
  return adapter.generateResponse(options);
}

export function streamResponse(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
  assertSupportedModel(options.model);
  const adapter = getProviderAdapter(getProviderIdForModel(options.model));
  return adapter.streamResponse(options);
}

export { listAvailableModels, isSupportedModel, DEFAULT_MODEL_ID, AVAILABLE_MODELS, PROVIDER_LABELS } from "./models";
export { AiServiceError } from "./errors";
export type { AiChatMessage, AiContentPart, GenerateOptions } from "./types";
