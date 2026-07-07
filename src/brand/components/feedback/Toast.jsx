import React from 'react';

const TOAST_CSS = `
.fico-toast{
  display:flex;align-items:flex-start;gap:12px;background:var(--white);
  border:1px solid var(--border-subtle);border-radius:var(--radius-lg);
  box-shadow:var(--shadow-lg);padding:14px 14px 14px 16px;max-width:420px;
  position:relative;overflow:clip;
}
.fico-toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--toast-accent,var(--ink-500))}
.fico-toast__icon{
  display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;flex-shrink:0;
  border-radius:var(--radius-md);background:var(--toast-soft,var(--ink-100));color:var(--toast-accent,var(--ink-600));
}
.fico-toast__body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;padding-top:2px}
.fico-toast__title{font-size:14px;font-weight:700;color:var(--ink-900);line-height:1.3}
.fico-toast__desc{font-size:13px;color:var(--ink-600);line-height:1.45}
.fico-toast__action{margin-top:8px}
.fico-toast__action button{
  border:0;background:transparent;font-family:var(--font-sans);font-weight:700;font-size:13px;
  color:var(--toast-accent,var(--ink-700));cursor:pointer;padding:0;
}
.fico-toast__action button:hover{text-decoration:underline}
.fico-toast__close{
  border:0;background:transparent;color:var(--ink-400);cursor:pointer;padding:4px;margin:-4px -2px 0 0;
  border-radius:var(--radius-sm);display:inline-flex;flex-shrink:0;transition:color var(--dur-fast),background var(--dur-fast);
}
.fico-toast__close:hover{color:var(--ink-700);background:var(--ink-100)}
`;

if (typeof document !== 'undefined' && !document.getElementById('fico-toast-styles')) {
  const s = document.createElement('style');
  s.id = 'fico-toast-styles';
  s.textContent = TOAST_CSS;
  document.head.appendChild(s);
}

const TOAST_TONES = {
  success: { accent: 'var(--green-600)', soft: 'var(--green-100)', icon: 'circle-check' },
  warning: { accent: 'var(--yellow-700)', soft: 'var(--yellow-100)', icon: 'triangle-alert' },
  danger: { accent: 'var(--red-600)', soft: 'var(--red-100)', icon: 'circle-x' },
  info: { accent: 'var(--blue-600)', soft: 'var(--blue-100)', icon: 'info' },
  neutral: { accent: 'var(--ink-700)', soft: 'var(--ink-100)', icon: 'bell' },
};

export function Toast({
  tone = 'success',
  title,
  description,
  icon,
  action,
  onClose,
  className = '',
  style,
  ...rest
}) {
  const t = TOAST_TONES[tone] || TOAST_TONES.neutral;
  return (
    <div
      className={`fico-toast ${className}`}
      role="status"
      style={{ '--toast-accent': t.accent, '--toast-soft': t.soft, ...style }}
      {...rest}
    >
      {icon !== null && <span className="fico-toast__icon">{icon || <DefaultIcon name={t.icon} />}</span>}
      <div className="fico-toast__body">
        {title && <div className="fico-toast__title">{title}</div>}
        {description && <div className="fico-toast__desc">{description}</div>}
        {action && (
          <div className="fico-toast__action">
            <button type="button" onClick={action.onClick}>
              {action.label}
            </button>
          </div>
        )}
      </div>
      {onClose && (
        <button type="button" className="fico-toast__close" aria-label="Chiudi" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

/* Tiny fallback icon when the Icon component / Lucide isn't passed in */
function DefaultIcon({ name }) {
  const paths = {
    'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'circle-x': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: paths[name] || paths.bell }} />
  );
}
