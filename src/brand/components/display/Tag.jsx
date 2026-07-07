import React from 'react';

const TAG_CSS = `
.fico-tag{
  display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-weight:600;font-size:12.5px;line-height:1;padding:5px 10px;border-radius:var(--radius-sm);
  border:1px solid transparent;white-space:nowrap;
}
.fico-tag__dot{width:7px;height:7px;border-radius:2px;flex-shrink:0}
.fico-tag__x{
  display:inline-flex;align-items:center;justify-content:center;margin:-2px -4px -2px 0;
  width:18px;height:18px;border-radius:5px;cursor:pointer;border:0;background:transparent;
  color:inherit;opacity:.65;transition:opacity var(--dur-fast),background var(--dur-fast);
}
.fico-tag__x:hover{opacity:1;background:rgba(0,0,0,.08)}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-tag-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-tag-styles';
  s.textContent = TAG_CSS;
  document.head.appendChild(s);
}

const COLORS = {
  neutral: { bg: 'var(--ink-100)', fg: 'var(--ink-700)', dot: 'var(--ink-500)', bd: 'var(--ink-200)' },
  green: { bg: 'var(--green-100)', fg: 'var(--green-700)', dot: 'var(--green-500)', bd: 'var(--green-200)' },
  red: { bg: 'var(--red-100)', fg: 'var(--red-700)', dot: 'var(--red-500)', bd: 'var(--red-200)' },
  yellow: { bg: 'var(--yellow-100)', fg: 'var(--yellow-700)', dot: 'var(--yellow-500)', bd: 'var(--yellow-200)' },
  orange: { bg: 'var(--orange-100)', fg: 'var(--orange-700)', dot: 'var(--orange-500)', bd: 'var(--orange-200)' },
  lavender: { bg: 'var(--lavender-100)', fg: 'var(--lavender-700)', dot: 'var(--lavender-400)', bd: 'var(--lavender-200)' },
  blue: { bg: 'var(--blue-100)', fg: 'var(--blue-700)', dot: 'var(--blue-500)', bd: 'var(--blue-200)' },
};

export function Tag({
  children,
  color = 'neutral',
  dot = false,
  iconLeft,
  onRemove,
  className = '',
  style,
  ...rest
}) {
  const c = COLORS[color] || COLORS.neutral;
  return (
    <span
      className={`fico-tag ${className}`}
      style={{ background: c.bg, color: c.fg, borderColor: c.bd, ...style }}
      {...rest}
    >
      {dot && <span className="fico-tag__dot" style={{ background: c.dot }} />}
      {iconLeft && <span style={{ display: 'inline-flex' }}>{iconLeft}</span>}
      {children}
      {onRemove && (
        <button type="button" className="fico-tag__x" aria-label="Rimuovi" onClick={onRemove}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </span>
  );
}
