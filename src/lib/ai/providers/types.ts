import type { GenerateOptions } from "../types";

export interface ProviderAdapter {
  generateResponse(options: GenerateOptions): Promise<string>;
  streamResponse(options: GenerateOptions): AsyncGenerator<string, void, unknown>;
}
