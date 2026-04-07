const PLATFORM_CONFIG: Record<string, { label: string; icon: string; tone: string }> = {
  twitter: { label: "Twitter/X", icon: "𝕏", tone: "bg-slate-800/60 text-slate-300 border border-slate-700/40" },
  youtube: { label: "YouTube", icon: "▶", tone: "bg-rose-900/30 text-rose-400 border border-rose-700/40" },
  instagram: { label: "Instagram", icon: "◎", tone: "bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-700/40" },
};

interface PlatformBadgesProps {
  platforms: string[];
}

export default function PlatformBadges({ platforms }: PlatformBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {platforms.map((platform) => {
        const cfg = PLATFORM_CONFIG[platform] ?? {
          label: platform,
          icon: "•",
          tone: "bg-slate-800/60 text-slate-400 border border-slate-700/40",
        };
        return (
          <span key={platform} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${cfg.tone}`}>
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </span>
        );
      })}
    </div>
  );
}
