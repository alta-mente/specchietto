import React from 'react';

const TABS_CSS = `
.fico-tabs{display:flex;gap:4px;border-bottom:1.5px solid var(--border-subtle);overflow-x:auto;scrollbar-width:none}
.fico-tabs::-webkit-scrollbar{display:none}
.fico-tab{
  position:relative;display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;
  font-family:var(--font-sans);font-size:14.5px;font-weight:600;color:var(--ink-500);cursor:pointer;
  padding:12px 14px;white-space:nowrap;transition:color var(--dur-fast);
}
.fico-tab:hover{color:var(--ink-800)}
.fico-tab.is-active{color:var(--ink-900)}
.fico-tab::after{
  content:"";position:absolute;left:10px;right:10px;bottom:-1.5px;height:3px;border-radius:3px 3px 0 0;
  background:var(--green-500);transform:scaleX(0);transition:transform var(--dur-base) var(--ease-out);
}
.fico-tab.is-active::after{transform:scaleX(1)}
.fico-tab:focus-visible{outline:none;box-shadow:var(--ring);border-radius:var(--radius-sm)}
.fico-tab__count{
  font-family:var(--font-mono);font-size:11px;font-weight:600;background:var(--ink-100);color:var(--ink-600);
  border-radius:var(--radius-pill);padding:1px 7px;min-width:20px;text-align:center;
}
.fico-tab.is-active .fico-tab__count{background:var(--green-100);color:var(--green-700)}
@media (prefers-reduced-motion:reduce){.fico-tab::after{transition:none}}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-tabs-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-tabs-styles';
  s.textContent = TABS_CSS;
  document.head.appendChild(s);
}

export function Tabs({ tabs = [], value, onChange, className = '', style, ...rest }) {
  return (
    <div className={`fico-tabs ${className}`} role="tablist" style={style} {...rest}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            className={`fico-tab ${active ? 'is-active' : ''}`}
            onClick={() => onChange && onChange(t.id)}
          >
            {t.icon && <span style={{ display: 'inline-flex' }}>{t.icon}</span>}
            {t.label}
            {t.count != null && <span className="fico-tab__count tnum">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
