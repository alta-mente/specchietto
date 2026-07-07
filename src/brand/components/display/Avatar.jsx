import React from 'react';

const AV_CSS = `
.fico-avatar{
  display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;
  font-family:var(--font-display);font-weight:600;overflow:hidden;
  background:var(--ink-100);color:var(--ink-700);position:relative;line-height:1;
}
.fico-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.fico-avatar--circle{border-radius:50%}
.fico-avatar--rounded{border-radius:30%}
.fico-avatar--xs{width:26px;height:26px;font-size:10px}
.fico-avatar--sm{width:34px;height:34px;font-size:12px}
.fico-avatar--md{width:42px;height:42px;font-size:14.5px}
.fico-avatar--lg{width:56px;height:56px;font-size:19px}
.fico-avatar--xl{width:76px;height:76px;font-size:26px}
.fico-avatar__ring{box-shadow:0 0 0 2px var(--white),0 0 0 4px var(--green-400)}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-avatar-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-avatar-styles';
  s.textContent = AV_CSS;
  document.head.appendChild(s);
}

const PALETTE = [
  { bg: 'var(--green-100)', fg: 'var(--green-700)' },
  { bg: 'var(--orange-100)', fg: 'var(--orange-700)' },
  { bg: 'var(--lavender-100)', fg: 'var(--lavender-700)' },
  { bg: 'var(--blue-100)', fg: 'var(--blue-700)' },
  { bg: 'var(--red-100)', fg: 'var(--red-700)' },
  { bg: 'var(--yellow-100)', fg: 'var(--yellow-700)' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  name = '',
  src,
  size = 'md',
  shape = 'circle',
  ring = false,
  className = '',
  style,
  ...rest
}) {
  const c = hashColor(name);
  return (
    <span
      className={`fico-avatar fico-avatar--${size} fico-avatar--${shape} ${ring ? 'fico-avatar__ring' : ''} ${className}`}
      style={{ background: src ? 'var(--ink-100)' : c.bg, color: c.fg, ...style }}
      title={name || undefined}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}
