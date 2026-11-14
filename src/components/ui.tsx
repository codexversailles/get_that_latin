import { useEffect, type ReactNode } from 'react';

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
    <section className={cx('neu-card rounded-3xl p-5 sm:p-6', className)}>
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--neu-border)] pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            {step && (
              <span className="neu-recessed inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold text-[var(--neu-accent)]">
                {step}
              </span>
            )}
            <h2 className="text-sm font-bold tracking-tight text-[var(--neu-ink)]">{title}</h2>
          </div>
          {subtitle && (
            <p className="mt-1 hidden text-xs leading-relaxed text-[var(--neu-ink-muted)] sm:block">
              {subtitle}
            </p>
          )}
        </div>
        {meta && (
          <div className="shrink-0 font-mono text-xs whitespace-nowrap text-[var(--neu-accent)] tabular">
            {meta}
          </div>
        )}
      </header>
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold text-[var(--neu-accent)]">{children}</div>;
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
        'inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold',
        active ? 'neu-btn-accent' : 'neu-btn text-[var(--neu-ink)]',
        danger && !active && 'hover:text-[var(--neu-danger)]',
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
      className={cx('neu-recessed inline-flex h-10 rounded-full p-1', fullWidth && 'flex w-full')}
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
            'rounded-full px-3.5 text-xs font-semibold transition-colors',
            fullWidth && 'flex-1',
            value === o.value
              ? 'neu-btn-accent'
              : 'text-[var(--neu-ink-muted)] hover:text-[var(--neu-ink)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function pct(p: number): string {
  if (!Number.isFinite(p)) return '-';
  if (p > 0 && p < 0.001) return '<0.1%';
  if (p < 1 && p > 0.999) return '>99.9%';
  return `${(p * 100).toFixed(1)}%`;
}

let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    if (lockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      }
    };
  }, [locked]);
}

export function useEscapeKey(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}
