"use client";

import { useState, useRef, FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MatchedSkill {
  slug: string;
  title: string;
}

export default function CommandBar() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [matchedSkill, setMatchedSkill] = useState<MatchedSkill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"rendered" | "raw">("rendered");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const examples = [
    "Tìm affiliate program cho AI tools, hoa hồng cao",
    "Viết thread Twitter về HeyGen để kiếm affiliate",
    "Tính thu nhập nếu tôi promote Jasper với 30% recurring",
    "Audit SEO bài blog review phần mềm video AI",
    "Lên kế hoạch funnel affiliate cho người mới bắt đầu",
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setResult("");
    setMatchedSkill(null);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Lỗi HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Không có response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.meta) {
              setMatchedSkill(parsed.meta.skill);
            } else if (parsed.text) {
              accumulated += parsed.text;
              setResult(accumulated);
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "JSON") {
              // ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = result;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleReset() {
    setResult("");
    setMatchedSkill(null);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Main input box */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/30 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ra lệnh tự do... vd: Tìm affiliate program AI tools hoa hồng cao, viết review HeyGen bằng tiếng Việt, tính thu nhập nếu tôi promote Jasper..."
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
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Gửi
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example prompts */}
      {!result && !isLoading && (
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => { setInput(ex); textareaRef.current?.focus(); }}
              className="px-3 py-1.5 rounded-full text-xs bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-800 hover:text-slate-200 transition-all truncate max-w-xs"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-950/40 border border-red-800/50 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {(result || isLoading) && (
        <div className="mt-5 rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
          {/* Result header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-800/40 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-blue-400 animate-pulse" : "bg-green-400"}`} />
              <span className="text-slate-300 text-sm font-medium">
                {isLoading ? "Đang tạo nội dung..." : "Kết quả"}
              </span>
              {matchedSkill && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/60 text-slate-300 border border-slate-600/50">
                  Skill: {matchedSkill.title}
                </span>
              )}
              {result && (
                <span className="text-slate-600 text-xs">{result.length.toLocaleString()} ký tự</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {result && (
                <div className="flex rounded-lg overflow-hidden border border-slate-700/60">
                  <button
                    onClick={() => setView("rendered")}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${view === "rendered" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-300"}`}
                  >
                    Xem trước
                  </button>
                  <button
                    onClick={() => setView("raw")}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${view === "raw" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-300"}`}
                  >
                    Raw
                  </button>
                </div>
              )}
              {result && (
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied ? "bg-green-900/40 text-green-400 border border-green-800/50" : "bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600/50"}`}
                >
                  {copied ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Đã sao chép</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Sao chép</>
                  )}
                </button>
              )}
              {!isLoading && result && (
                <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[600px] overflow-y-auto">
            {isLoading && !result && (
              <div className="flex items-center gap-3 text-slate-400">
                <span className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-sm">Claude đang suy nghĩ...</span>
              </div>
            )}
            {result && view === "rendered" && (
              <div className="prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                  {result}
                </ReactMarkdown>
                {isLoading && <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />}
              </div>
            )}
            {result && view === "raw" && (
              <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                {result}
                {isLoading && <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
