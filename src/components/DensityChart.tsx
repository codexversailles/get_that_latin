import { useMemo } from 'react';
import { HONOR_TIERS, type SimResult } from '../engine';

const W = 360;
const H = 150;
const PAD = { l: 14, r: 14, t: 14, b: 20 };

/** SVG density curve of simulated graduation GWAs with Latin-honors bands in 60/30/10 Gold & Navy. */
export function DensityChart({ result, marker }: { result: SimResult | null; marker: number | null }) {
  const geo = useMemo(() => {
    if (!result || result.runs === 0) return null;
    const { histogram, histMin, binWidth } = result;
    const lo = 1.0;
    const p99 = Number.isFinite(result.p95) ? result.p95 + 0.15 : 2.0;
    const hi = Math.min(3, Math.max(1.85, Math.ceil(p99 * 20) / 20));

    const k = [0.054, 0.242, 0.399, 0.242, 0.054];
    const sm = histogram.map((_, i) => {
      let v = 0;
      for (let j = -2; j <= 2; j++) v += (histogram[i + j] ?? 0) * k[j + 2];
      return v;
    });

    const i0 = Math.max(0, Math.floor((lo - histMin) / binWidth));
    const i1 = Math.min(sm.length - 1, Math.ceil((hi - histMin) / binWidth));
    let max = 0;
    for (let i = i0; i <= i1; i++) max = Math.max(max, sm[i]);
    if (max === 0) return null;

    const x = (g: number) => PAD.l + ((g - lo) / (hi - lo)) * (W - PAD.l - PAD.r);
    const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
    const base = H - PAD.b;

    const pts: Array<[number, number, number]> = [];
    for (let i = i0; i <= i1; i++) {
      const g = histMin + (i + 0.5) * binWidth;
      pts.push([x(g), y(sm[i]), g]);
    }
    const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('');
    const area = `${line}L${pts[pts.length - 1][0].toFixed(1)},${base}L${pts[0][0].toFixed(1)},${base}Z`;

    const ticks: number[] = [];
    for (let t = lo; t <= hi + 1e-9; t += hi - lo > 1 ? 0.25 : 0.125) ticks.push(Math.round(t * 1000) / 1000);

    return { x, base, line, area, ticks, hi, lo, honorsX: x(Math.min(hi, 1.75)) };
  }, [result]);

  if (!geo) {
    return <div className="flex h-[150px] items-center justify-center font-mono text-[11px] text-slate-500">no distribution</div>;
  }

  const { x, base, line, area, ticks, hi, honorsX } = geo;
  const clipId = 'honors-clip';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Simulated graduation GWA density">
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={honorsX} height={H} />
        </clipPath>
      </defs>

      {HONOR_TIERS.map((t, i) => {
        const a = x(i === 0 ? 1 : HONOR_TIERS[i - 1].max);
        const b = x(t.max);
        return (
          <g key={t.id}>
            <rect x={a} y={PAD.t} width={b - a} height={base - PAD.t} fill="#191851" opacity={0.55 - i * 0.12} />
            <text x={(a + b) / 2} y={10} textAnchor="middle" className="fill-gold-400 font-mono" fontSize={8} letterSpacing={0.5}>
              {t.short.toUpperCase()}
            </text>
          </g>
        );
      })}

      <path d={area} fill="#191851" opacity={0.5} />
      <path d={area} fill="#f4b52a" opacity={0.28} clipPath={`url(#${clipId})`} />
      <path d={line} fill="none" stroke="#f4b52a" strokeWidth={1.25} />

      {HONOR_TIERS.map((t) => (
        <line key={t.id} x1={x(t.max)} x2={x(t.max)} y1={PAD.t} y2={base} stroke="#2f2e85" strokeWidth={0.75} strokeDasharray="2 2" />
      ))}

      {marker !== null && marker >= 1 && marker <= hi && (
        <g>
          <line x1={x(marker)} x2={x(marker)} y1={PAD.t - 2} y2={base} stroke="#f4b52a" strokeWidth={1.25} />
          <rect x={x(marker) - 2} y={PAD.t - 4} width={4} height={4} fill="#f4b52a" />
        </g>
      )}

      <line x1={PAD.l} x2={W - PAD.r} y1={base} y2={base} stroke="#2f2e85" strokeWidth={0.75} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={base} y2={base + 3} stroke="#2f2e85" strokeWidth={0.75} />
          <text x={x(t)} y={H - 6} textAnchor="middle" className="fill-slate-400 font-mono" fontSize={8}>
            {t.toFixed(2)}
          </text>
        </g>
      ))}
    </svg>
  );
}
