import type { ModelOption } from "@/types/chat";

export const PROVIDER_LABELS: Record<string, string> = {
  huggingface: "Hugging Face",
  iti: "ITI proxy",
  ollama: "Ollama (local)",
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-oss-120b:cerebras",
    label: "GPT-OSS 120B (Cerebras)",
    description: "Open-weight 120B model served on Cerebras hardware — fast, strong general reasoning.",
    providerId: "huggingface",
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    label: "Llama 3.1 8B Instruct",
    description: "Meta's compact instruction-tuned model — good balance of speed and quality.",
    providerId: "huggingface",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    label: "Qwen 2.5 7B Instruct",
    description: "Alibaba's multilingual instruction-tuned model.",
    providerId: "huggingface",
  },
  {
    id: "Qwen/Qwen3-4B-Thinking-2507",
    label: "Qwen 3 4B (Thinking)",
    description: "Small reasoning-focused model that thinks step by step before answering.",
    providerId: "huggingface",
  },
  {
    id: "google/gemma-3-4b-it",
    label: "Gemma 3 4B IT",
    description: "Google's lightweight instruction-tuned model with vision support.",
    supportsVision: true,
    providerId: "huggingface",
  },
  {
    id: "anthropic.claude-sonnet-4-6",
    label: "Claude Sonnet 4.6 (ITI proxy)",
    description: "Strong general-purpose reasoning, served through the ITI student API proxy.",
    providerId: "iti",
  },
  {
    id: "anthropic.claude-haiku-4-5-20251001-v1:0",
    label: "Claude Haiku 4.5 (ITI proxy)",
    description: "Fast, cheaper Claude model, served through the ITI student API proxy.",
    providerId: "iti",
  },
  {
    id: "anthropic.claude-opus-4-7",
    label: "Claude Opus 4.7 (ITI proxy)",
    description: "Most capable Claude model, served through the ITI student API proxy.",
    providerId: "iti",
  },
  {
    id: "openai.gpt-oss-120b-1:0",
    label: "GPT-OSS 120B (ITI proxy)",
    description: "Open-weight 120B model, served through the ITI student API proxy.",
    providerId: "iti",
  },
  {
    id: "deepseek.v3.2",
    label: "DeepSeek V3.2 (ITI proxy)",
    description: "Strong open-weight general model, served through the ITI student API proxy.",
    providerId: "iti",
  },
  {
    id: "deepseek.r1-v1:0",
    label: "DeepSeek R1 (ITI proxy)",
    description: "Reasoning-focused model that thinks step by step, served through the ITI student API proxy.",
    providerId: "iti",
  },
  {
    id: "us.meta.llama3-3-70b-instruct-v1:0",
    label: "Llama 3.3 70B (ITI proxy)",
    description: "Meta's large instruction-tuned model, served through the ITI student API proxy.",
    providerId: "iti",
  },
  {
    id: "qwen.qwen3-vl-235b-a22b",
    label: "Qwen 3 VL 235B (ITI proxy)",
    description: "Vision-language model, served through the ITI student API proxy.",
    supportsVision: true,
    providerId: "iti",
  },
  {
    id: "llama3.2",
    label: "Llama 3.2 (local — requires Ollama running)",
    description: "Local model served by Ollama. Run `ollama pull llama3.2` first.",
    providerId: "ollama",
  },
  {
    id: "qwen2.5:7b",
    label: "Qwen 2.5 7B (local — requires Ollama running)",
    description: "Local model served by Ollama. Run `ollama pull qwen2.5:7b` first.",
    providerId: "ollama",
  },
];

export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;

export function isSupportedModel(modelId: string): boolean {
  return AVAILABLE_MODELS.some((model) => model.id === modelId);
}

export function listAvailableModels(): ModelOption[] {
  return AVAILABLE_MODELS;
}

export function getProviderIdForModel(modelId: string): string {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Unknown model "${modelId}".`);
  }
  return model.providerId;
}
