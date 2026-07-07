import React from 'react';

const SEG_CSS = `
.fico-seg{display:inline-flex;background:var(--ink-100);border-radius:var(--radius-md);padding:3px;gap:2px}
.fico-seg--full{display:flex;width:100%}
.fico-seg__btn{
  flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;cursor:pointer;
  background:transparent;font-family:var(--font-sans);font-weight:600;color:var(--ink-600);
  border-radius:calc(var(--radius-md) - 3px);white-space:nowrap;
  transition:color var(--dur-fast),background var(--dur-fast),box-shadow var(--dur-fast);
}
.fico-seg--sm .fico-seg__btn{font-size:13px;padding:6px 12px}
.fico-seg--md .fico-seg__btn{font-size:14px;padding:8px 16px}
.fico-seg__btn:hover:not(.is-active){color:var(--ink-900)}
.fico-seg__btn.is-active{background:var(--white);color:var(--ink-900);box-shadow:var(--shadow-sm)}
.fico-seg__btn:focus-visible{outline:none;box-shadow:var(--ring)}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-seg-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-seg-styles';
  s.textContent = SEG_CSS;
  document.head.appendChild(s);
}

export function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
  style,
  ...rest
}) {
  return (
    <div
      className={`fico-seg fico-seg--${size} ${fullWidth ? 'fico-seg--full' : ''} ${className}`}
      role="group"
      style={style}
      {...rest}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            className={`fico-seg__btn ${active ? 'is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange && onChange(o.value)}
          >
            {o.icon && <span style={{ display: 'inline-flex' }}>{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
