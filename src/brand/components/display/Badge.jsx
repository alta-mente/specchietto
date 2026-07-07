import React from 'react';

const BADGE_CSS = `
.fico-badge{
  display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-weight:600;line-height:1;border-radius:var(--radius-pill);border:1.5px solid transparent;
  white-space:nowrap;
}
.fico-badge--sm{font-size:11.5px;padding:3px 9px}
.fico-badge--md{font-size:12.5px;padding:5px 11px}
.fico-badge__dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-badge-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-badge-styles';
  s.textContent = BADGE_CSS;
  document.head.appendChild(s);
}

const BADGE_TONES = {
  neutral: { solid: 'var(--ink-700)', soft: 'var(--ink-100)', text: 'var(--ink-700)', border: 'var(--ink-300)', onSolid: '#fff' },
  success: { solid: 'var(--green-500)', soft: 'var(--green-100)', text: 'var(--green-700)', border: 'var(--green-300)', onSolid: '#fff' },
  warning: { solid: 'var(--yellow-500)', soft: 'var(--yellow-100)', text: 'var(--yellow-700)', border: 'var(--yellow-300)', onSolid: 'var(--ink-900)' },
  danger: { solid: 'var(--red-500)', soft: 'var(--red-100)', text: 'var(--red-700)', border: 'var(--red-300)', onSolid: '#fff' },
  info: { solid: 'var(--blue-500)', soft: 'var(--blue-100)', text: 'var(--blue-700)', border: 'var(--blue-300)', onSolid: '#fff' },
  accent: { solid: 'var(--orange-500)', soft: 'var(--orange-100)', text: 'var(--orange-700)', border: 'var(--orange-300)', onSolid: '#fff' },
  special: { solid: 'var(--lavender-400)', soft: 'var(--lavender-100)', text: 'var(--lavender-700)', border: 'var(--lavender-300)', onSolid: 'var(--ink-900)' },
};

/* Reservation-status aliases → tone */
const STATUS = {
  confirmed: 'success',
  pending: 'warning',
  seated: 'accent',
  vip: 'special',
  cancelled: 'danger',
  note: 'info',
};

export function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  dot = false,
  iconLeft,
  className = '',
  style,
  ...rest
}) {
  const resolvedTone = STATUS[tone] || tone;
  const t = BADGE_TONES[resolvedTone] || BADGE_TONES.neutral;

  let colors;
  if (variant === 'solid') colors = { background: t.solid, color: t.onSolid, borderColor: 'transparent' };
  else if (variant === 'outline') colors = { background: 'transparent', color: t.text, borderColor: t.border };
  else colors = { background: t.soft, color: t.text, borderColor: 'transparent' };

  return (
    <span className={`fico-badge fico-badge--${size} ${className}`} style={{ ...colors, ...style }} {...rest}>
      {dot && <span className="fico-badge__dot" style={{ background: variant === 'solid' ? t.onSolid : t.solid }} />}
      {iconLeft && <span style={{ display: 'inline-flex' }}>{iconLeft}</span>}
      {children}
    </span>
  );
}
