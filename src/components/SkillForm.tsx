"use client";

import { useState, FormEvent } from "react";
import { Skill, SkillField } from "@/lib/skills";

interface Props {
  skill: Skill;
  onResult: (result: string) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

function buildUserMessage(skill: Skill, values: Record<string, string>): string {
  const lines: string[] = [`Run the **${skill.title}** skill with the following inputs:\n`];
  for (const field of skill.fields) {
    const value = values[field.key];
    if (value && value.trim()) {
      lines.push(`**${field.label}:** ${value.trim()}`);
    }
  }
  if (lines.length === 1) {
    lines.push("(No specific inputs provided — use sensible defaults and run the skill.)");
  }
  return lines.join("\n");
}

export default function SkillForm({ skill, onResult, onLoading, isLoading }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const requiredFields = skill.fields.filter((f) => f.required);
  const optionalFields = skill.fields.filter((f) => !f.required);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate required fields
    for (const field of requiredFields) {
      if (!values[field.key]?.trim()) {
        setError(`"${field.label}" is required.`);
        return;
      }
    }

    const userMessage = buildUserMessage(skill, values);
    onLoading(true);

    try {
      const res = await fetch("/api/skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: skill.slug, userMessage }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                result += parsed.text;
                onResult(result);
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Required fields */}
      {requiredFields.length > 0 && (
        <div className="space-y-4">
          {requiredFields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] || ""}
              onChange={(v) => handleChange(field.key, v)}
              disabled={isLoading}
            />
          ))}
        </div>
      )}

      {/* Optional fields */}
      {optionalFields.length > 0 && (
        <details className="group" open={requiredFields.length === 0}>
          <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300 transition-colors select-none flex items-center gap-2">
            <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Optional inputs ({optionalFields.length})
          </summary>
          <div className="mt-4 space-y-4">
            {optionalFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={values[field.key] || ""}
                onChange={(v) => handleChange(field.key, v)}
                disabled={isLoading}
              />
            ))}
          </div>
        </details>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/50 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
      >
        {isLoading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Skill
          </>
        )}
      </button>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: SkillField;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const base =
    "w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={4}
          className={`${base} resize-y min-h-[100px]`}
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${base} cursor-pointer`}
        >
          <option value="">{field.placeholder || "Select..."}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          min={0}
          className={base}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={base}
        />
      )}

      {field.description && (
        <p className="mt-1 text-xs text-slate-500">{field.description}</p>
      )}
    </div>
  );
}
