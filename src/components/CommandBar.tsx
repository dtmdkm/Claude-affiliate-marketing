"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  skill?: { slug: string; title: string };
}

export default function CommandBar() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const examples = [
    "Tìm affiliate program cho AI tools, hoa hồng cao",
    "Viết thread Twitter về HeyGen bằng tiếng Việt",
    "Tính thu nhập nếu promote Jasper với 30% recurring",
    "Audit SEO bài blog review phần mềm AI",
    "Lên kế hoạch funnel affiliate cho người mới",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setError(null);

    const newUserMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Placeholder for streaming assistant response
    const assistantIndex = updatedMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      // Build history for API (only role+content, no skill metadata)
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

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
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.meta) {
              skillMeta = parsed.meta.skill;
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === assistantIndex ? { ...m, skill: skillMeta } : m
                )
              );
            } else if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === assistantIndex ? { ...m, content: accumulated } : m
                )
              );
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      // Remove empty assistant placeholder on error
      setMessages((prev) => prev.filter((_, i) => i !== assistantIndex));
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleClear() {
    setMessages([]);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Chat history */}
      {messages.length > 0 && (
        <div className="mb-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/60 bg-slate-800/40">
            <span className="text-xs text-slate-400 font-medium">Lịch sử hội thoại</span>
            <button
              onClick={handleClear}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Xóa hội thoại
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-[560px] overflow-y-auto p-4 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {msg.role === "user" ? (
                  /* User bubble */
                  <div className="max-w-[85%] bg-blue-600/20 border border-blue-700/40 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-slate-100 text-left whitespace-pre-wrap">
                    {msg.content}
                  </div>
                ) : (
                  /* Assistant bubble */
                  <div className="max-w-[95%] w-full">
                    {/* Skill badge */}
                    {msg.skill && (
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Claude →</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700/50">
                          {msg.skill.title}
                        </span>
                      </div>
                    )}
                    {!msg.skill && !msg.content && (
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                        <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                        Claude đang suy nghĩ...
                      </div>
                    )}
                    {msg.content && (
                      <div className="rounded-2xl rounded-tl-sm border border-slate-700/50 bg-slate-800/40 overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/40 bg-slate-800/60">
                          <span className="text-xs text-slate-500">{msg.content.length.toLocaleString()} ký tự</span>
                          <button
                            onClick={() => handleCopy(msg.content, i)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                              copiedIndex === i
                                ? "text-green-400"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {copiedIndex === i ? (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Đã sao chép</>
                            ) : (
                              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Sao chép</>
                            )}
                          </button>
                        </div>
                        {/* Content */}
                        <div className="prose-dark p-4 text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{ a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          {isLoading && i === messages.length - 1 && (
                            <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-950/40 border border-red-800/50 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/30 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              messages.length > 0
                ? "Tiếp tục hội thoại... (Enter để gửi)"
                : "Ra lệnh tự do... vd: Tìm affiliate program AI tools hoa hồng cao, viết review HeyGen bằng tiếng Việt..."
            }
            disabled={isLoading}
            rows={3}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm leading-relaxed px-5 pt-4 pb-14 resize-none focus:outline-none disabled:opacity-60"
          />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <p className="text-xs text-slate-600">Enter để gửi · Shift+Enter xuống dòng</p>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-blue-900/20"
            >
              {isLoading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang xử lý...</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Gửi</>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example prompts — only when no messages */}
      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => { setInput(ex); textareaRef.current?.focus(); }}
              className="px-3 py-1.5 rounded-full text-xs bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-800 hover:text-slate-200 transition-all max-w-xs truncate"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
