import React from 'react';

const SELECT_CSS = `
.fico-sel{display:flex;flex-direction:column;gap:6px}
.fico-sel__label{font-size:13px;font-weight:600;color:var(--ink-800)}
.fico-sel__req{color:var(--red-500);margin-left:2px}
.fico-sel__hint{font-size:12px;color:var(--ink-500)}
.fico-sel__err{font-size:12px;color:var(--red-600);font-weight:500}
.fico-sel-shell{
  position:relative;display:flex;align-items:center;background:var(--white);
  border:1.5px solid var(--ink-300);border-radius:var(--radius-md);
  transition:border-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast);
}
.fico-sel-shell:hover:not(.is-disabled){border-color:var(--ink-400)}
.fico-sel-shell:focus-within{border-color:var(--green-500);box-shadow:var(--ring)}
.fico-sel-shell.is-error{border-color:var(--red-500)}
.fico-sel-shell.is-disabled{background:var(--ink-50);opacity:.7}
.fico-sel-shell--sm{min-height:36px}
.fico-sel-shell--md{min-height:44px}
.fico-select{
  appearance:none;-webkit-appearance:none;border:0;outline:0;background:transparent;
  font-family:var(--font-sans);color:var(--ink-900);font-size:15px;width:100%;
  padding:9px 40px 9px 14px;cursor:pointer;border-radius:var(--radius-md);
}
.fico-sel-shell--sm .fico-select{font-size:14px;padding:7px 38px 7px 12px}
.fico-select.is-placeholder{color:var(--ink-400)}
.fico-sel-chev{position:absolute;right:12px;color:var(--ink-500);pointer-events:none;display:inline-flex}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-select-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-select-styles';
  s.textContent = SELECT_CSS;
  document.head.appendChild(s);
}

let _suid = 0;

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  value,
  size = 'md',
  required = false,
  disabled = false,
  id,
  className = '',
  style,
  children,
  ...rest
}) {
  const selId = React.useMemo(() => id || `fico-select-${++_suid}`, [id]);
  const isPlaceholder = (value === undefined || value === '' || value == null) && placeholder;
  const shellCls = [
    'fico-sel-shell',
    `fico-sel-shell--${size}`,
    error ? 'is-error' : '',
    disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`fico-sel ${className}`} style={style}>
      {label && (
        <label className="fico-sel__label" htmlFor={selId}>
          {label}
          {required && <span className="fico-sel__req">*</span>}
        </label>
      )}
      <div className={shellCls}>
        <select
          id={selId}
          className={`fico-select${isPlaceholder ? ' is-placeholder' : ''}`}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          {...rest}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <span className="fico-sel-chev">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </div>
      {error ? (
        <span className="fico-sel__err">{error}</span>
      ) : (
        hint && <span className="fico-sel__hint">{hint}</span>
      )}
    </div>
  );
}
