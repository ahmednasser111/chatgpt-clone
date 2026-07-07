"use client";

import { PanelLeftClose, Plus } from "lucide-react";
import clsx from "clsx";
import { useConversations } from "@/hooks/useConversations";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConversationList } from "./ConversationList";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { conversations, activeId, selectConversation, startNewConversation, renameConversation, deleteConversation } =
    useConversations();

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} />}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-sidebar-bg transition-transform md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 p-3">
          <button
            type="button"
            onClick={() => {
              startNewConversation();
              onClose();
            }}
            className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-hover"
          >
            <Plus size={16} />
            New chat
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-hover md:hidden"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              selectConversation(id);
              onClose();
            }}
            onRename={renameConversation}
            onDelete={deleteConversation}
          />
        </nav>

        <div className="flex items-center justify-between border-t border-border p-3">
          <span className="text-xs text-muted">ChatGPT Clone</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
