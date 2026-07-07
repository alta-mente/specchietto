import React from 'react';

const BTN_CSS = `
.fico-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.5em;
  font-family:var(--font-sans);font-weight:600;line-height:1;white-space:nowrap;
  border:1.5px solid transparent;border-radius:var(--radius-pill);cursor:pointer;
  text-decoration:none;user-select:none;-webkit-tap-highlight-color:transparent;
  transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out),
             color var(--dur-fast),transform var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast);
}
.fico-btn:active:not(:disabled){transform:translateY(1px)}
.fico-btn:focus-visible{outline:none;box-shadow:var(--ring)}
.fico-btn:disabled,.fico-btn[aria-disabled="true"]{opacity:.5;cursor:not-allowed;transform:none}
.fico-btn--sm{font-size:13px;padding:7px 14px;min-height:34px}
.fico-btn--md{font-size:14.5px;padding:10px 19px;min-height:42px}
.fico-btn--lg{font-size:16px;padding:13px 26px;min-height:52px}
.fico-btn--full{width:100%}
.fico-btn--primary{background:var(--ink-800);color:#fff}
.fico-btn--primary:hover:not(:disabled){background:var(--ink-950)}
.fico-btn--accent{background:var(--green-500);color:#fff}
.fico-btn--accent:hover:not(:disabled){background:var(--green-600)}
.fico-btn--danger{background:var(--red-500);color:#fff}
.fico-btn--danger:hover:not(:disabled){background:var(--red-600)}
.fico-btn--secondary{background:var(--white);color:var(--ink-800);border-color:var(--ink-300)}
.fico-btn--secondary:hover:not(:disabled){background:var(--ink-50);border-color:var(--ink-400)}
.fico-btn--ghost{background:transparent;color:var(--ink-700)}
.fico-btn--ghost:hover:not(:disabled){background:var(--ink-100)}
.fico-btn__spin{width:1em;height:1em;border-radius:50%;border:2px solid currentColor;
  border-top-color:transparent;animation:fico-btn-spin .7s linear infinite}
@keyframes fico-btn-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.fico-btn{transition:none}.fico-btn__spin{animation-duration:1.4s}}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-btn-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-btn-styles';
  s.textContent = BTN_CSS;
  document.head.appendChild(s);
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  as,
  className = '',
  ...rest
}) {
  const Tag = as || 'button';
  const cls = [
    'fico-btn',
    `fico-btn--${variant}`,
    `fico-btn--${size}`,
    fullWidth ? 'fico-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tagProps = Tag === 'button' ? { type, disabled: disabled || loading } : {};

  return (
    <Tag className={cls} aria-busy={loading || undefined} {...tagProps} {...rest}>
      {loading ? (
        <span className="fico-btn__spin" aria-hidden="true" />
      ) : (
        iconLeft && <span aria-hidden="true" style={{ display: 'inline-flex' }}>{iconLeft}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && (
        <span aria-hidden="true" style={{ display: 'inline-flex' }}>{iconRight}</span>
      )}
    </Tag>
  );
}
