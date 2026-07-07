"use client";

import { ChevronDown } from "lucide-react";
import { useModels } from "@/hooks/useModels";

export function ModelSelector({ disabled }: { disabled?: boolean }) {
  const { models, activeModel, setActiveModel } = useModels();

  return (
    <div className="relative inline-flex items-center">
      <select
        value={activeModel}
        disabled={disabled}
        onChange={(e) => setActiveModel(e.target.value)}
        className="appearance-none rounded-lg border border-border bg-surface py-1.5 pl-3 pr-8 text-sm font-medium hover:bg-surface-hover disabled:opacity-60"
        aria-label="Select model"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-muted" />
    </div>
  );
}
