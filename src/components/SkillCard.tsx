import Link from "next/link";
import { Skill, stageColors, stageIcons } from "@/lib/skills";

interface Props {
  skill: Skill;
}

export default function SkillCard({ skill }: Props) {
  const colors = stageColors[skill.stage] || stageColors.meta;

  return (
    <Link
      href={`/skill/${skill.slug}`}
      className="group block rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700/80 transition-all duration-200 p-4 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Stage badge */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border} shrink-0`}
        >
          <span>{stageIcons[skill.stage]}</span>
          <span className="capitalize">{skill.stage}</span>
        </span>
        <svg
          className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-blue-300 transition-colors leading-snug">
        {skill.title}
      </h3>

      {/* Description */}
      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
        {skill.description}
      </p>

      {/* Tags */}
      {skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {skill.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-xs bg-slate-800/60 text-slate-500 border border-slate-700/40"
            >
              {tag.replace("affiliate-marketing", "").replace(/-/g, " ").trim() || tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
