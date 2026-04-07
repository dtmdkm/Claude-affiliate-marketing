"use client";

import { useState, useEffect, useCallback } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMain from "@/components/ChatMain";

export interface Message {
  role: "user" | "assistant";
  content: string;
  skill?: { slug: string; title: string };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("affitor_sessions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem("affitor_sessions", JSON.stringify(sessions));
  } catch {}
}

export default function HomePage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadSessions();
    setSessions(saved);
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  function createNewChat() {
    setActiveId(null);
  }

  const updateSession = useCallback((id: string, messages: Message[]) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, messages } : s
      );
      saveSessions(updated);
      return updated;
    });
  }, []);

  function startNewSession(firstMessage: Message, assistantMessage: Message) {
    const id = generateId();
    const title = firstMessage.content.slice(0, 60) + (firstMessage.content.length > 60 ? "..." : "");
    const newSession: ChatSession = {
      id,
      title,
      messages: [firstMessage, assistantMessage],
      createdAt: Date.now(),
    };
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveId(id);
    return id;
  }

  function deleteSession(id: string) {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
    if (activeId === id) setActiveId(null);
  }

  function selectSession(id: string) {
    setActiveId(id);
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#1a1a1a] overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeId={activeId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewChat={createNewChat}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
      />

      {/* Main chat area */}
      <ChatMain
        session={activeSession}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onUpdateSession={updateSession}
        onStartNewSession={startNewSession}
      />
    </div>
  );
}
