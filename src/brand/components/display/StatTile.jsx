import React from 'react';

const STAT_CSS = `
.fico-stat{
  background:var(--surface-card);border:1px solid var(--border-subtle);
  border-radius:var(--radius-xl);padding:20px;display:flex;flex-direction:column;gap:14px;
  box-shadow:var(--shadow-sm);
}
.fico-stat__top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.fico-stat__chip{
  display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:var(--radius-md);flex-shrink:0;
}
.fico-stat__delta{
  display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:700;
  padding:3px 8px;border-radius:var(--radius-pill);
}
.fico-stat__delta--up{background:var(--green-100);color:var(--green-700)}
.fico-stat__delta--down{background:var(--red-100);color:var(--red-700)}
.fico-stat__delta--flat{background:var(--ink-100);color:var(--ink-600)}
.fico-stat__value{font-family:var(--font-display);font-weight:600;font-size:34px;line-height:1;color:var(--ink-900);letter-spacing:-.02em}
.fico-stat__label{font-size:13px;color:var(--ink-600);font-weight:500;margin-top:4px}
.fico-stat__hint{font-size:12px;color:var(--ink-500);margin-top:2px}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-stat-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-stat-styles';
  s.textContent = STAT_CSS;
  document.head.appendChild(s);
}

const CHIP_TONES = {
  green: { bg: 'var(--green-100)', fg: 'var(--green-600)' },
  orange: { bg: 'var(--orange-100)', fg: 'var(--orange-600)' },
  lavender: { bg: 'var(--lavender-100)', fg: 'var(--lavender-600)' },
  blue: { bg: 'var(--blue-100)', fg: 'var(--blue-600)' },
  red: { bg: 'var(--red-100)', fg: 'var(--red-600)' },
  yellow: { bg: 'var(--yellow-100)', fg: 'var(--yellow-700)' },
  neutral: { bg: 'var(--ink-100)', fg: 'var(--ink-700)' },
};

export function StatTile({
  label,
  value,
  icon,
  tone = 'green',
  delta,
  hint,
  className = '',
  style,
  ...rest
}) {
  const c = CHIP_TONES[tone] || CHIP_TONES.neutral;
  const dir = delta && delta.direction ? delta.direction : 'flat';
  const arrow = dir === 'up' ? 'M7 17 17 7M9 7h8v8' : dir === 'down' ? 'M7 7l10 10M17 9v8H9' : 'M5 12h14';

  return (
    <div className={`fico-stat ${className}`} style={style} {...rest}>
      <div className="fico-stat__top">
        {icon && (
          <span className="fico-stat__chip" style={{ background: c.bg, color: c.fg }}>
            {icon}
          </span>
        )}
        {delta && (
          <span className={`fico-stat__delta fico-stat__delta--${dir}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={arrow} /></svg>
            {delta.value}
          </span>
        )}
      </div>
      <div>
        <div className="fico-stat__value tnum">{value}</div>
        {label && <div className="fico-stat__label">{label}</div>}
        {hint && <div className="fico-stat__hint">{hint}</div>}
      </div>
    </div>
  );
}
