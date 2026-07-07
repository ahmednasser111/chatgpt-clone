import type { ModelOption } from "@/types/chat";

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-oss-120b:cerebras",
    label: "GPT-OSS 120B (Cerebras)",
    description: "Open-weight 120B model served on Cerebras hardware — fast, strong general reasoning.",
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    label: "Llama 3.1 8B Instruct",
    description: "Meta's compact instruction-tuned model — good balance of speed and quality.",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    label: "Qwen 2.5 7B Instruct",
    description: "Alibaba's multilingual instruction-tuned model.",
  },
  {
    id: "Qwen/Qwen3-4B-Thinking-2507",
    label: "Qwen 3 4B (Thinking)",
    description: "Small reasoning-focused model that thinks step by step before answering.",
  },
  {
    id: "google/gemma-3-4b-it",
    label: "Gemma 3 4B IT",
    description: "Google's lightweight instruction-tuned model with vision support.",
    supportsVision: true,
  },
];

export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;

export function isSupportedModel(modelId: string): boolean {
  return AVAILABLE_MODELS.some((model) => model.id === modelId);
}

export function listAvailableModels(): ModelOption[] {
  return AVAILABLE_MODELS;
}
