"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { ImagePlus, Paperclip, Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";

const MAX_TEXTAREA_HEIGHT = 200;

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MessageInput() {
  const { sendMessage, isStreaming } = useChat();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }

  function handleSubmit() {
    if (isStreaming || !value.trim()) return;
    sendMessage(value);
    setValue("");
    requestAnimationFrame(autoResize);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setValue((prev) => `${prev}${prev ? "\n" : ""}![${file.name}](${dataUrl})\n`);
    requestAnimationFrame(autoResize);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      setValue((prev) => `${prev}${prev ? "\n" : ""}\n**Attached file: ${file.name}**\n\`\`\`\n${text}\n\`\`\`\n`);
    } catch {
      setValue((prev) => `${prev}${prev ? "\n" : ""}[Attached file: ${file.name} — could not be read as text]`);
    }
    requestAnimationFrame(autoResize);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2">
        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
        <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground"
          aria-label="Attach image"
          title="Attach image"
        >
          <ImagePlus size={18} />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT Clone..."
          rows={1}
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isStreaming || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="mt-1.5 text-center text-xs text-muted">
        AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
