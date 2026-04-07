"use client";

import { useState, use } from "react";
import Link from "next/link";
import { skills, stages, stageIcons, stageColors } from "@/lib/skills";
import SkillForm from "@/components/SkillForm";
import ResultDisplay from "@/components/ResultDisplay";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function SkillPage({ params }: Props) {
  const { slug } = use(params);
  const skill = skills.find((s) => s.slug === slug);

  if (!skill) {
    notFound();
  }

  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const colors = stageColors[skill.stage] || stageColors.meta;
  const stage = stages[skill.stage];

  function handleResult(text: string) {
    setResult(text);
  }

  function handleReset() {
    setResult("");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-[#0a0a0f]/95 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Skills
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300 text-sm truncate">{skill.title}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Skill info + Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skill header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                >
                  <span>{stageIcons[skill.stage]}</span>
                  <span className="capitalize">{stage?.label || skill.stage}</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{skill.title}</h1>
              <p className="text-slate-400 text-sm leading-relaxed">{skill.description}</p>

              {/* Tags */}
              {skill.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skill.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-xs bg-slate-800/60 text-slate-500 border border-slate-700/40"
                    >
                      {tag.replace(/affiliate-marketing-?/, "").replace(/-/g, " ").trim() || tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/40" />

            {/* Form */}
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Inputs
              </h2>
              <SkillForm
                skill={skill}
                onResult={handleResult}
                onLoading={setIsLoading}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Right: Result */}
          <div className="lg:col-span-3">
            {result || isLoading ? (
              <div className="sticky top-24">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Output
                  </h2>
                  {result && !isLoading && (
                    <button
                      onClick={handleReset}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ResultDisplay result={result} isLoading={isLoading} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-16">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-3xl mx-auto mb-4">
                    {stageIcons[skill.stage]}
                  </div>
                  <p className="text-slate-400 text-sm max-w-xs">
                    Fill in the form and click <strong className="text-slate-300">Run Skill</strong> to generate output with Claude AI.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
