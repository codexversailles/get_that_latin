import type { ReactNode } from 'react';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Panel({
  step,
  title,
  subtitle,
  meta,
  children,
  className,
}: {
  step?: string;
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('border border-navy-800 bg-obsidian-soft p-5', className)}>
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-navy-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            {step && (
              <span className="inline-flex h-5 w-5 items-center justify-center bg-gold-400 font-mono text-[11px] font-bold text-obsidian">
                {step}
              </span>
            )}
            <h2 className="font-mono text-xs font-semibold tracking-wider text-white uppercase">{title}</h2>
          </div>
          {subtitle && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{subtitle}</p>}
        </div>
        {meta && <div className="shrink-0 font-mono text-[11px] whitespace-nowrap text-gold-400 tabular">{meta}</div>}
      </header>
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] font-semibold tracking-widest text-gold-400 uppercase">{children}</div>;
}

export function Button({
  children,
  onClick,
  title,
  danger,
  active,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  danger?: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cx(
        'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-gold-400 bg-gold-400 font-semibold text-obsidian'
          : 'border-navy-800 bg-navy-950 text-slate-200 hover:border-gold-400/60 hover:text-gold-400',
        danger && 'hover:border-rose-500/60 hover:text-rose-400',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  fullWidth,
}: {
  value: T;
  options: Array<{ value: T; label: string; title?: string }>;
  onChange: (v: T) => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cx('inline-flex h-9 border border-navy-800 bg-navy-950 p-0.5', fullWidth && 'flex w-full')}
      role="radiogroup"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx(
            'cursor-pointer px-3 text-xs font-medium transition-colors',
            fullWidth && 'flex-1',
            value === o.value
              ? 'bg-gold-400 font-semibold text-obsidian'
              : 'text-slate-300 hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function pct(p: number): string {
  if (!Number.isFinite(p)) return '—';
  if (p > 0 && p < 0.001) return '<0.1%';
  if (p < 1 && p > 0.999) return '>99.9%';
  return `${(p * 100).toFixed(1)}%`;
}
