// Small animated SVG charts used in dashboard stat cards.
import { useId } from "react";

// Line + soft area that draws itself in. `values` are plotted left to right.
export function Sparkline({ values, color = "#5B3DF5", height = 44 }: { values: number[]; color?: string; height?: number }) {
  const id = useId();
  const max = Math.max(...values, 1);
  const step = 200 / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)} ${(height - 4 - (v / max) * (height - 10)).toFixed(1)}`);
  const line = `M${points.join(" L")}`;

  return (
    <svg viewBox={`0 0 200 ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true" className="mt-2.5 block">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L200 ${height} L0 ${height}z`} fill={`url(#${id})`}>
        <animate attributeName="opacity" values="0;1" dur="1.4s" fill="freeze" />
      </path>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1">
        <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.4s" fill="freeze" />
      </path>
    </svg>
  );
}

// Ring that fills to `percent`.
export function Ring({ percent, color = "#1A9F5B", label }: { percent: number; color?: string; label?: string }) {
  const c = 2 * Math.PI * 24;
  const target = c - (Math.min(Math.max(percent, 0), 100) / 100) * c;
  return (
    <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" className="shrink-0">
      <circle cx="30" cy="30" r="24" fill="none" stroke="#EEF0F5" strokeWidth="8" />
      <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={target} transform="rotate(-90 30 30)">
        <animate attributeName="stroke-dashoffset" from={c} to={target} dur="1.2s" fill="freeze" />
      </circle>
      <text x="30" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#146C3E">
        {label ?? `${Math.round(percent)}%`}
      </text>
    </svg>
  );
}

// Counts per day for the last `days` days, oldest first.
export function dailyCounts(dates: (Date | null)[], days = 14) {
  const counts = Array<number>(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const d of dates) {
    if (!d) continue;
    const diff = Math.floor((today.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
    if (diff >= 0 && diff < days) counts[days - 1 - diff] += 1;
  }
  return counts;
}
