"use client";

import { useState, useMemo } from "react";
import { skills, stages, stageIcons, stageColors } from "@/lib/skills";
import SkillCard from "@/components/SkillCard";
import CommandBar from "@/components/CommandBar";

const stageOrder = ["research", "content", "blog", "landing", "distribution", "analytics", "automation", "meta"];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const matchesStage = !activeStage || s.stage === activeStage;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q));
      return matchesStage && matchesSearch;
    });
  }, [search, activeStage]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    for (const s of filtered) {
      if (!g[s.stage]) g[s.stage] = [];
      g[s.stage].push(s);
    }
    return g;
  }, [filtered]);

  const orderedStages = stageOrder.filter((s) => grouped[s]?.length);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-[#0a0a0f]/95 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="text-white font-semibold text-base leading-tight">
                Affitor Skills
              </h1>
              <p className="text-slate-400 text-xs hidden sm:block">
                AI-powered affiliate marketing tools
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <a
            href="https://github.com/Affitor/affiliate-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors hidden sm:flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Source
          </a>
        </div>
      </header>

      {/* Hero + Command Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            52 AI Skills cho{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Affiliate Marketing
            </span>
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mb-8">
            Ra lệnh tự do — AI tự chọn skill phù hợp và trả lời bằng tiếng Việt.
            Hoặc chọn skill thủ công bên dưới.
          </p>
          <CommandBar />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 border-t border-slate-800/60" />
          <span className="text-slate-500 text-sm px-2">hoặc chọn skill thủ công</span>
          <div className="flex-1 border-t border-slate-800/60" />
        </div>

        {/* Stage filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => setActiveStage(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !activeStage
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All ({skills.length})
          </button>
          {stageOrder.map((stageKey) => {
            const stage = stages[stageKey];
            if (!stage) return null;
            const count = skills.filter((s) => s.stage === stageKey).length;
            const colors = stageColors[stageKey];
            return (
              <button
                key={stageKey}
                onClick={() => setActiveStage(activeStage === stageKey ? null : stageKey)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeStage === stageKey
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800"
                }`}
              >
                {stageIcons[stageKey]} {stage.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {search || activeStage ? (
          <p className="text-slate-500 text-sm mb-6 text-center">
            Showing {filtered.length} skill{filtered.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
            {activeStage ? ` in ${stages[activeStage]?.label}` : ""}
          </p>
        ) : null}
      </div>

      {/* Skills Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No skills found.</p>
            <button
              onClick={() => { setSearch(""); setActiveStage(null); }}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {orderedStages.map((stageKey) => {
              const stage = stages[stageKey];
              const stageSkills = grouped[stageKey];
              if (!stageSkills?.length) return null;
              return (
                <section key={stageKey}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">{stageIcons[stageKey]}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {stage.label}
                      </h3>
                      <p className="text-slate-400 text-sm">{stage.description}</p>
                    </div>
                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${stageColors[stageKey].bg} ${stageColors[stageKey].text} ${stageColors[stageKey].border} border`}>
                      {stageSkills.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {stageSkills.map((skill) => (
                      <SkillCard key={skill.slug} skill={skill} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 py-8 text-center text-slate-500 text-sm">
        <p>
          Built with{" "}
          <a href="https://github.com/Affitor/affiliate-skills" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            Affitor Skills
          </a>{" "}
          ·{" "}
          <a href="https://anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            Powered by Claude
          </a>
        </p>
      </footer>
    </div>
  );
}
