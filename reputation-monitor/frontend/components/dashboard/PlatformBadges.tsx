const PLATFORM_CONFIG: Record<string, { label: string; icon: string; tone: string }> = {
  twitter: { label: "Twitter/X", icon: "𝕏", tone: "bg-slate-100 text-slate-700" },
  youtube: { label: "YouTube", icon: "▶", tone: "bg-rose-50 text-rose-700" },
  instagram: { label: "Instagram", icon: "◎", tone: "bg-fuchsia-50 text-fuchsia-700" },
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
          tone: "bg-slate-100 text-slate-600",
        };
        return (
          <span key={`${platform}-${cfg.label}`} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${cfg.tone}`}>
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </span>
        );
      })}
    </div>
  );
}
