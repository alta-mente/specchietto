import React from 'react';

const CARD_CSS = `
.fico-card{
  background:var(--surface-card);border:1px solid var(--border-subtle);
  border-radius:var(--radius-card);overflow:clip;
  transition:box-shadow var(--dur-base) var(--ease-out),transform var(--dur-base) var(--ease-out),border-color var(--dur-base);
}
.fico-card--flat{box-shadow:none}
.fico-card--sm{box-shadow:var(--shadow-sm)}
.fico-card--md{box-shadow:var(--shadow-md)}
.fico-card--lg{box-shadow:var(--shadow-lg)}
.fico-card--pad-none{padding:0}
.fico-card--pad-sm{padding:16px}
.fico-card--pad-md{padding:22px}
.fico-card--pad-lg{padding:30px}
.fico-card--interactive{cursor:pointer}
.fico-card--interactive:hover{box-shadow:var(--shadow-lg);transform:translateY(-2px);border-color:var(--ink-200)}
.fico-card--interactive:active{transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.fico-card{transition:none}.fico-card--interactive:hover{transform:none}}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-card-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-card-styles';
  s.textContent = CARD_CSS;
  document.head.appendChild(s);
}

export function Card({
  children,
  padding = 'md',
  elevation = 'sm',
  interactive = false,
  as,
  className = '',
  ...rest
}) {
  const Tag = as || 'div';
  const cls = [
    'fico-card',
    `fico-card--${elevation}`,
    `fico-card--pad-${padding}`,
    interactive ? 'fico-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
