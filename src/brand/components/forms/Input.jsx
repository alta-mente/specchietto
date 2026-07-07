import React from 'react';

const INPUT_CSS = `
.fico-fld{display:flex;flex-direction:column;gap:6px}
.fico-fld__label{font-size:13px;font-weight:600;color:var(--ink-800)}
.fico-fld__req{color:var(--red-500);margin-left:2px}
.fico-fld__hint{font-size:12px;color:var(--ink-500)}
.fico-fld__err{font-size:12px;color:var(--red-600);font-weight:500}
.fico-input-shell{
  display:flex;align-items:center;gap:9px;background:var(--white);
  border:1.5px solid var(--ink-300);border-radius:var(--radius-md);
  padding:0 14px;transition:border-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast);
}
.fico-input-shell:hover:not(.is-disabled){border-color:var(--ink-400)}
.fico-input-shell:focus-within{border-color:var(--green-500);box-shadow:var(--ring)}
.fico-input-shell.is-error{border-color:var(--red-500)}
.fico-input-shell.is-error:focus-within{box-shadow:0 0 0 3px color-mix(in srgb,var(--red-500) 32%,transparent)}
.fico-input-shell.is-disabled{background:var(--ink-50);opacity:.7;cursor:not-allowed}
.fico-input-shell--sm{min-height:36px}
.fico-input-shell--md{min-height:44px}
.fico-input{
  flex:1;border:0;outline:0;background:transparent;width:100%;
  font-family:var(--font-sans);color:var(--ink-900);font-size:15px;padding:8px 0;
}
.fico-input-shell--sm .fico-input{font-size:14px;padding:6px 0}
.fico-input::placeholder{color:var(--ink-400)}
.fico-input-shell .fico-input-ico{color:var(--ink-500);display:inline-flex;flex-shrink:0}
.fico-input-shell:focus-within .fico-input-ico{color:var(--green-600)}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-input-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-input-styles';
  s.textContent = INPUT_CSS;
  document.head.appendChild(s);
}

let _uid = 0;

export function Input({
  label,
  hint,
  error,
  iconLeft,
  suffix,
  size = 'md',
  required = false,
  disabled = false,
  id,
  className = '',
  style,
  ...rest
}) {
  const inputId = React.useMemo(() => id || `fico-input-${++_uid}`, [id]);
  const shellCls = [
    'fico-input-shell',
    `fico-input-shell--${size}`,
    error ? 'is-error' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`fico-fld ${className}`} style={style}>
      {label && (
        <label className="fico-fld__label" htmlFor={inputId}>
          {label}
          {required && <span className="fico-fld__req">*</span>}
        </label>
      )}
      <div className={shellCls}>
        {iconLeft && <span className="fico-input-ico">{iconLeft}</span>}
        <input
          id={inputId}
          className="fico-input"
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {suffix && <span className="fico-input-ico">{suffix}</span>}
      </div>
      {error ? (
        <span className="fico-fld__err">{error}</span>
      ) : (
        hint && <span className="fico-fld__hint">{hint}</span>
      )}
    </div>
  );
}
