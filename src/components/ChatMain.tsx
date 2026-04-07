"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, ChatSession } from "@/app/page";
import { skills, stageIcons } from "@/lib/skills";

const STAGE_ORDER = ["research", "content", "blog", "landing", "distribution", "analytics", "automation", "meta"];

const STAGE_LABELS: Record<string, string> = {
  research: "Nghiên cứu",
  content: "Nội dung",
  blog: "Blog & SEO",
  landing: "Landing Page",
  distribution: "Phân phối",
  analytics: "Phân tích",
  automation: "Tự động hóa",
  meta: "Meta",
};

const SUGGESTIONS = [
  "Tìm affiliate program AI tools hoa hồng cao",
  "Viết thread Twitter về HeyGen bằng tiếng Việt",
  "Tính thu nhập nếu promote Jasper với 30% recurring",
  "Audit SEO bài blog review phần mềm AI",
  "Lên kế hoạch funnel affiliate cho người mới",
  "Viết bài so sánh HeyGen vs Synthesia",
];

interface Props {
  session: ChatSession | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onUpdateSession: (id: string, messages: Message[]) => void;
  onStartNewSession: (first: Message, assistant: Message) => string;
}

export default function ChatMain({
  session,
  sidebarOpen,
  onToggleSidebar,
  onUpdateSession,
  onStartNewSession,
}: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingSkill, setStreamingSkill] = useState<{ slug: string; title: string } | undefined>();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  const messages = session?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);
    setStreamingContent("");
    setStreamingSkill(undefined);

    const userMsg: Message = { role: "user", content: trimmed };
    const currentMessages = [...messages, userMsg];

    try {
      const history = currentMessages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: trimmed, history }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Lỗi HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Không có response body");

      const decoder = new TextDecoder();
      let accumulated = "";
      let skillMeta: { slug: string; title: string } | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.meta) {
              skillMeta = parsed.meta.skill;
              setStreamingSkill(skillMeta);
            } else if (parsed.text) {
              accumulated += parsed.text;
              setStreamingContent(accumulated);
            }
          } catch { /* skip */ }
        }
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: accumulated,
        skill: skillMeta,
      };

      const finalMessages = [...currentMessages, assistantMsg];

      if (session) {
        onUpdateSession(session.id, finalMessages);
      } else {
        const newId = onStartNewSession(userMsg, assistantMsg);
        currentSessionIdRef.current = newId;
      }
    } catch (err) {
      const errMsg: Message = {
        role: "assistant",
        content: `❌ Lỗi: ${err instanceof Error ? err.message : "Đã xảy ra lỗi"}`,
      };
      const finalMessages = [...currentMessages, errMsg];
      if (session) {
        onUpdateSession(session.id, finalMessages);
      } else {
        onStartNewSession(userMsg, errMsg);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent("");
      setStreamingSkill(undefined);
    }
  }

  async function handleCopy(text: string, index: number) {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // ── Empty state (no session selected) ──
  if (!session && !isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1a]">
        {/* Topbar */}
        <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} title={null} />

        {/* Welcome */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pt-16 pb-8">
            <div className="text-center mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                A
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Chào mừng đến Affitor Skills
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                52 AI skills cho affiliate marketing · Trả lời tiếng Việt
              </p>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Skills by stage */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-2 mb-4 select-none">
                <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Xem tất cả 52 skills
              </summary>
              <div className="space-y-4 mt-2">
                {STAGE_ORDER.map((stage) => {
                  const stageSkills = skills.filter((s) => s.stage === stage);
                  if (!stageSkills.length) return null;
                  return (
                    <div key={stage}>
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
                        <span>{stageIcons[stage]}</span>
                        <span>{STAGE_LABELS[stage] || stage}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {stageSkills.map((sk) => (
                          <button
                            key={sk.slug}
                            onClick={() => { setInput(sk.title); textareaRef.current?.focus(); }}
                            className="px-2.5 py-1 rounded-full text-xs border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                          >
                            {sk.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        </div>

        {/* Input */}
        <ChatInput
          input={input}
          isLoading={isLoading}
          textareaRef={textareaRef}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // ── Active chat ──
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1a]">
      <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} title={session?.title ?? null} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {msg.role === "user" ? (
                <div className="max-w-[80%] bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full">
                  {msg.skill && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs text-gray-400">Skill:</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        {msg.skill.title}
                      </span>
                    </div>
                  )}
                  <div className="prose-dark text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => handleCopy(msg.content, i)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                        copiedIndex === i
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {copiedIndex === i ? (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Đã sao chép</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Sao chép</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-full">
                {streamingSkill && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs text-gray-400">Skill:</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      {streamingSkill.title}
                    </span>
                  </div>
                )}
                {streamingContent ? (
                  <div className="prose-dark text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                    <span className="inline-block w-0.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        input={input}
        isLoading={isLoading}
        textareaRef={textareaRef}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// ── Sub-components ──

function Topbar({ sidebarOpen, onToggleSidebar, title }: { sidebarOpen: boolean; onToggleSidebar: () => void; title: string | null }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
      {!sidebarOpen && (
        <button onClick={onToggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
        {title ?? "Affitor Skills"}
      </span>
    </div>
  );
}

function ChatInput({
  input, isLoading, textareaRef, onChange, onKeyDown, onSubmit,
}: {
  input: string;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={onSubmit}>
          <div className="relative flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder="Nhập yêu cầu... (Enter gửi, Shift+Enter xuống dòng)"
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none leading-relaxed disabled:opacity-50 max-h-[200px] overflow-y-auto"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-200 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white dark:text-gray-900 disabled:text-gray-400 transition-all"
            >
              {isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2">
          Sonnet 4.6 · AI có thể mắc lỗi, hãy kiểm tra thông tin quan trọng
        </p>
      </div>
    </div>
  );
}
