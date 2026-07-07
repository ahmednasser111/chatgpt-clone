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

export function errorFromHfResponse(status: number, body: string): AiServiceError {
  if (status === 401 || status === 403) {
    return new AiServiceError(
      "INVALID_API_KEY",
      "Hugging Face rejected the API key. Check HF_API_KEY in your .env file.",
      status,
    );
  }
  if (status === 429) {
    return new AiServiceError(
      "RATE_LIMITED",
      "Hugging Face rate limit reached. Wait a moment and try again.",
      status,
    );
  }
  if (status === 404) {
    return new AiServiceError(
      "UNSUPPORTED_MODEL",
      "The selected model is not available on Hugging Face Inference Providers.",
      status,
    );
  }
  return new AiServiceError(
    "UNKNOWN",
    `Hugging Face API error (${status}): ${body.slice(0, 300)}`,
    status,
  );
}
