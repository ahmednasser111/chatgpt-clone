import type { ApiErrorPayload } from "@/types/chat";

export class AiServiceError extends Error {
  code: ApiErrorPayload["code"];
  status: number;

  constructor(code: ApiErrorPayload["code"], message: string, status = 500) {
    super(message);
    this.name = "AiServiceError";
    this.code = code;
    this.status = status;
  }

  toPayload(): ApiErrorPayload {
    return { error: this.message, code: this.code };
  }
}

/**
 * Maps a raw HTTP failure from any provider to an AiServiceError with a
 * provider-labelled message, so 401/429/404 map to the same ApiErrorPayload
 * codes regardless of which backend rejected the request.
 */
export function errorFromProviderResponse(
  providerLabel: string,
  status: number,
  body: string,
  keyEnvVar: string,
): AiServiceError {
  if (status === 401 || status === 403) {
    return new AiServiceError(
      "INVALID_API_KEY",
      `${providerLabel} rejected the API key. Check ${keyEnvVar} in your .env file.`,
      status,
    );
  }
  if (status === 429) {
    return new AiServiceError(
      "RATE_LIMITED",
      `${providerLabel} rate limit reached. Wait a moment and try again.`,
      status,
    );
  }
  if (status === 404) {
    return new AiServiceError(
      "UNSUPPORTED_MODEL",
      `The selected model is not available on ${providerLabel}.`,
      status,
    );
  }
  return new AiServiceError(
    "UNKNOWN",
    `${providerLabel} API error (${status}): ${body.slice(0, 300)}`,
    status,
  );
}
