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
      className={`rounded-[18px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${className}`}
    >
      {(title || subtitle || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && (
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
