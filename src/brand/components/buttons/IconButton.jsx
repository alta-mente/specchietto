import React from 'react';

const IB_CSS = `
.fico-iconbtn{
  display:inline-flex;align-items:center;justify-content:center;
  border:1.5px solid transparent;border-radius:var(--radius-md);cursor:pointer;
  background:transparent;color:var(--ink-700);padding:0;
  transition:background var(--dur-fast) var(--ease-out),color var(--dur-fast),
             border-color var(--dur-fast),box-shadow var(--dur-fast),transform var(--dur-fast) var(--ease-out);
}
.fico-iconbtn:active:not(:disabled){transform:translateY(1px)}
.fico-iconbtn:focus-visible{outline:none;box-shadow:var(--ring)}
.fico-iconbtn:disabled{opacity:.45;cursor:not-allowed}
.fico-iconbtn--sm{width:32px;height:32px}
.fico-iconbtn--md{width:40px;height:40px}
.fico-iconbtn--lg{width:48px;height:48px}
.fico-iconbtn--round{border-radius:var(--radius-pill)}
.fico-iconbtn--ghost:hover:not(:disabled){background:var(--ink-100);color:var(--ink-900)}
.fico-iconbtn--soft{background:var(--ink-100);color:var(--ink-800)}
.fico-iconbtn--soft:hover:not(:disabled){background:var(--ink-200)}
.fico-iconbtn--solid{background:var(--ink-800);color:#fff}
.fico-iconbtn--solid:hover:not(:disabled){background:var(--ink-950)}
.fico-iconbtn--outline{border-color:var(--ink-300);color:var(--ink-700);background:var(--white)}
.fico-iconbtn--outline:hover:not(:disabled){background:var(--ink-50);border-color:var(--ink-400)}
@media (prefers-reduced-motion:reduce){.fico-iconbtn{transition:none}}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-iconbtn-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-iconbtn-styles';
  s.textContent = IB_CSS;
  document.head.appendChild(s);
}

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  round = false,
  label,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const cls = [
    'fico-iconbtn',
    `fico-iconbtn--${variant}`,
    `fico-iconbtn--${size}`,
    round ? 'fico-iconbtn--round' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} type={type} disabled={disabled} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
