import React from 'react';

const CHECK_CSS = `
.fico-check{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;user-select:none}
.fico-check.is-disabled{opacity:.5;cursor:not-allowed}
.fico-check input{position:absolute;opacity:0;width:0;height:0}
.fico-check__box{
  flex-shrink:0;width:20px;height:20px;border:1.5px solid var(--ink-300);
  border-radius:7px;background:#fff;display:flex;align-items:center;justify-content:center;
  transition:background var(--dur-fast) var(--ease-out),border-color var(--dur-fast),box-shadow var(--dur-fast);
  margin-top:1px;color:#fff;
}
.fico-check:hover:not(.is-disabled) .fico-check__box{border-color:var(--green-500)}
.fico-check input:checked + .fico-check__box{background:var(--green-500);border-color:var(--green-500)}
.fico-check input:indeterminate + .fico-check__box{background:var(--green-500);border-color:var(--green-500)}
.fico-check input:focus-visible + .fico-check__box{box-shadow:var(--ring)}
.fico-check__box svg{opacity:0;transition:opacity var(--dur-fast)}
.fico-check input:checked + .fico-check__box svg.tick,
.fico-check input:indeterminate + .fico-check__box svg.dash{opacity:1}
.fico-check__text{display:flex;flex-direction:column;gap:2px}
.fico-check__label{font-size:14px;color:var(--ink-800);font-weight:500;line-height:1.35}
.fico-check__desc{font-size:12.5px;color:var(--ink-500);line-height:1.4}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-check-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-check-styles';
  s.textContent = CHECK_CSS;
  document.head.appendChild(s);
}

export function Checkbox({
  checked,
  defaultChecked,
  indeterminate = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
  ...rest
}) {
  const ref = React.useRef(null);
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handle = (e) => {
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };

  return (
    <label className={`fico-check ${disabled ? 'is-disabled' : ''} ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={handle}
        id={id}
        {...rest}
      />
      <span className="fico-check__box">
        <svg className="tick" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        <svg className="dash" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" style={{ position: 'absolute' }}><path d="M5 12h14" /></svg>
      </span>
      {(label || description) && (
        <span className="fico-check__text">
          {label && <span className="fico-check__label">{label}</span>}
          {description && <span className="fico-check__desc">{description}</span>}
        </span>
      )}
    </label>
  );
}
