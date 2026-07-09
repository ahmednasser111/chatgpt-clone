"use client";

import { ChevronDown } from "lucide-react";
import { useModels } from "@/hooks/useModels";
import { PROVIDER_LABELS } from "@/lib/ai/models";

function groupByProvider<T extends { providerId: string }>(models: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const model of models) {
    const group = groups.get(model.providerId) ?? [];
    group.push(model);
    groups.set(model.providerId, group);
  }
  return [...groups.entries()];
}

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
        {groupByProvider(models).map(([providerId, group]) => (
          <optgroup key={providerId} label={PROVIDER_LABELS[providerId] ?? providerId}>
            {group.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-muted" />
    </div>
  );
}
