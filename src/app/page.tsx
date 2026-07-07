"use client";

import { useState } from "react";
import { Sidebar } from "@/features/conversations/components/Sidebar";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useInitApp } from "@/hooks/useInitApp";

export default function Home() {
  useInitApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ChatWindow onOpenSidebar={() => setIsSidebarOpen(true)} />
    </div>
  );
}
