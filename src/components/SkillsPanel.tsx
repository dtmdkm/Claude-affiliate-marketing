"use client";

import { useState, useMemo } from "react";
import { skills, stages, stageIcons } from "@/lib/skills";

const STAGE_ORDER = ["research", "content", "blog", "landing", "distribution", "analytics", "automation", "meta"];

const STAGE_COLORS: Record<string, { dot: string; badge: string }> = {
  research:     { dot: "bg-blue-500",   badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800/50" },
  content:      { dot: "bg-purple-500", badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800/50" },
  blog:         { dot: "bg-green-500",  badge: "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800/50" },
  landing:      { dot: "bg-orange-500", badge: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800/50" },
  distribution: { dot: "bg-cyan-500",   badge: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50" },
  analytics:    { dot: "bg-yellow-500", badge: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50" },
  automation:   { dot: "bg-pink-500",   badge: "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800/50" },
  meta:         { dot: "bg-slate-500",  badge: "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/50" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skillTitle: string) => void;
}

export default function SkillsPanel({ isOpen, onClose, onSelectSkill }: Props) {
  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return skills.filter((s) => {
      const matchStage = !activeStage || s.stage === activeStage;
      const matchSearch = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
      return matchStage && matchSearch;
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full z-40 w-80 flex flex-col bg-white dark:bg-[#111] border-l border-gray-200 dark:border-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Thư viện Skills</h2>
            <p className="text-xs text-gray-400 mt-0.5">{skills.length} skills · 8 danh mục</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats bar */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/60">
          <div className="grid grid-cols-4 gap-1.5">
            {STAGE_ORDER.map((stage) => {
              const count = skills.filter((s) => s.stage === stage).length;
              const colors = STAGE_COLORS[stage];
              const stageLabel = stages[stage]?.label || stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(activeStage === stage ? null : stage)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all text-center ${
                    activeStage === stage
                      ? `${colors.badge} border-current`
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  title={stageLabel}
                >
                  <span className="text-base leading-none">{stageIcons[stage]}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{count}</span>
                </button>
              );
            })}
          </div>
          {activeStage && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stageIcons[activeStage]} {stages[activeStage]?.label}
              </span>
              <button onClick={() => setActiveStage(null)} className="text-xs text-blue-500 hover:text-blue-600">
                Xóa lọc
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800/60">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {search && (
            <p className="text-xs text-gray-400 mt-1.5">
              {filtered.length} kết quả
            </p>
          )}
        </div>

        {/* Skill list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Không tìm thấy skill nào</div>
          ) : (
            STAGE_ORDER.map((stage) => {
              const stageSkills = grouped[stage];
              if (!stageSkills?.length) return null;
              const colors = STAGE_COLORS[stage];
              return (
                <div key={stage} className="mb-1">
                  {/* Stage header */}
                  <div className="flex items-center gap-2 px-4 py-1.5 sticky top-0 bg-white dark:bg-[#111] z-10">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {stageIcons[stage]} {stages[stage]?.label}
                    </span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-xs font-medium border ${colors.badge}`}>
                      {stageSkills.length}
                    </span>
                  </div>

                  {/* Skills */}
                  {stageSkills.map((skill) => (
                    <button
                      key={skill.slug}
                      onClick={() => {
                        onSelectSkill(skill.title);
                        onClose();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-gray-800 dark:text-gray-200 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {skill.title}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug line-clamp-2">
                        {skill.description}
                      </p>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
