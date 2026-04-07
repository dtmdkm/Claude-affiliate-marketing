"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  result: string;
  isLoading: boolean;
}

export default function ResultDisplay({ result, isLoading }: Props) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"rendered" | "raw">("rendered");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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

  if (!result && !isLoading) return null;

  return (
    <div className="mt-6 rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
      {/* Result header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationPlayState: isLoading ? 'running' : 'paused' }} />
          <span className="text-slate-300 text-sm font-medium">
            {isLoading ? "Generating..." : "Result"}
          </span>
          {result && (
            <span className="text-slate-500 text-xs">
              {result.length.toLocaleString()} chars
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          {result && (
            <div className="flex rounded-lg overflow-hidden border border-slate-700/60">
              <button
                onClick={() => setView("rendered")}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === "rendered"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setView("raw")}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === "raw"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Raw
              </button>
            </div>
          )}

          {/* Copy button */}
          {result && (
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? "bg-green-900/40 text-green-400 border border-green-800/50"
                  : "bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600/50"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 max-h-[600px] overflow-y-auto">
        {isLoading && !result && (
          <div className="flex items-center gap-3 text-slate-400">
            <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-sm">Claude is thinking...</span>
          </div>
        )}

        {result && view === "rendered" && (
          <div className="prose-dark">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Open links in new tab
                a: ({ ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
              }}
            >
              {result}
            </ReactMarkdown>
            {isLoading && (
              <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}

        {result && view === "raw" && (
          <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
            {result}
            {isLoading && (
              <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
