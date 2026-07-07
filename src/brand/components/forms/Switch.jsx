import React from 'react';

const SWITCH_CSS = `
.fico-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
.fico-switch.is-disabled{opacity:.5;cursor:not-allowed}
.fico-switch__track{
  position:relative;flex-shrink:0;background:var(--ink-300);border-radius:var(--radius-pill);
  transition:background var(--dur-base) var(--ease-out);
}
.fico-switch__track.is-on{background:var(--green-500)}
.fico-switch__thumb{
  position:absolute;top:2px;left:2px;background:#fff;border-radius:50%;
  box-shadow:var(--shadow-sm);transition:transform var(--dur-base) var(--ease-spring);
}
.fico-switch--md .fico-switch__track{width:42px;height:24px}
.fico-switch--md .fico-switch__thumb{width:20px;height:20px}
.fico-switch--md .fico-switch__track.is-on .fico-switch__thumb{transform:translateX(18px)}
.fico-switch--sm .fico-switch__track{width:34px;height:20px}
.fico-switch--sm .fico-switch__thumb{width:16px;height:16px}
.fico-switch--sm .fico-switch__track.is-on .fico-switch__thumb{transform:translateX(14px)}
.fico-switch input{position:absolute;opacity:0;width:0;height:0}
.fico-switch input:focus-visible + .fico-switch__track{box-shadow:var(--ring)}
.fico-switch__label{font-size:14px;color:var(--ink-800);font-weight:500}
@media (prefers-reduced-motion:reduce){.fico-switch__thumb,.fico-switch__track{transition:none}}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-switch-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-switch-styles';
  s.textContent = SWITCH_CSS;
  document.head.appendChild(s);
}

export function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  id,
  className = '',
  ...rest
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;

  const handle = (e) => {
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };

  return (
    <label className={`fico-switch fico-switch--${size} ${disabled ? 'is-disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        disabled={disabled}
        onChange={handle}
        id={id}
        {...rest}
      />
      <span className={`fico-switch__track ${on ? 'is-on' : ''}`}>
        <span className="fico-switch__thumb" />
      </span>
      {label && <span className="fico-switch__label">{label}</span>}
    </label>
  );
}
