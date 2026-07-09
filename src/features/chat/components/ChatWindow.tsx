"use client";

import { useEffect, useRef } from "react";
import { Download, PanelLeft } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ErrorBanner } from "@/components/ErrorBanner";
import { exportConversationAsJson } from "@/lib/export-conversation";
import { DocumentPanel } from "./DocumentPanel";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ModelSelector } from "./ModelSelector";

export function ChatWindow({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { messages, status, streamingText, error, regenerate, editLastUserMessage, deleteLastUserMessage, clearError } =
    useChat();
  const { conversations, activeId } = useConversations();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const lastUserIndex = [...messages].map((m) => m.role).lastIndexOf("user");
  const lastAssistantIndex = [...messages].map((m) => m.role).lastIndexOf("assistant");
  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-dvh flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-hover md:hidden"
            aria-label="Open sidebar"
          >
            <PanelLeft size={18} />
          </button>
          <ModelSelector disabled={isStreaming} />
          <DocumentPanel disabled={isStreaming || !activeConversation} />
        </div>
        {activeConversation && (
          <button
            type="button"
            onClick={() => exportConversationAsJson(activeConversation, messages)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-hover"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center text-muted">
              <p className="text-lg font-medium text-foreground">How can I help you today?</p>
              <p className="text-sm">Start typing below to begin a new conversation.</p>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLastUserMessage={message.role === "user" && index === lastUserIndex}
              isLastAssistantMessage={message.role === "assistant" && index === lastAssistantIndex && !isStreaming}
              onEdit={editLastUserMessage}
              onDelete={deleteLastUserMessage}
              onRegenerate={regenerate}
            />
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed">
                {streamingText ? <MarkdownRenderer content={streamingText} /> : <LoadingIndicator label="Generating response" />}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <div className="px-4 pb-2">
          <ErrorBanner error={error} onDismiss={clearError} />
        </div>
      )}

      <MessageInput />
    </div>
  );
}
