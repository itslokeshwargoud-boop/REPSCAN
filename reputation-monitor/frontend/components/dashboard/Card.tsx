import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export default function Card({ title, subtitle, action, className = "", children }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/70 hover:shadow-[0_0_24px_rgba(244,63,94,0.04)] ${className}`}
    >
      {(title || subtitle || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && (
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
