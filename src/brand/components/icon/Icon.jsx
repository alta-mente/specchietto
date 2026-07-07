import React from 'react';

/* Icon — thin React wrapper over the Lucide icon set (ISC licensed).
   Requires the Lucide UMD script on the page:
   <script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
   Reads window.lucide.icons[Name] and renders an inline <svg> that
   inherits color via currentColor. */

function toPascal(name) {
  if (!name) return '';
  if (/^[A-Z]/.test(name) && !name.includes('-')) return name;
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('');
}

function attrsToStr(attrs) {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
  label,
  className = '',
  style = {},
  ...rest
}) {
  const [, force] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.lucide && window.lucide.icons) return undefined;
    const t = setInterval(() => {
      if (window.lucide && window.lucide.icons) {
        clearInterval(t);
        force();
      }
    }, 60);
    return () => clearInterval(t);
  }, []);

  const node =
    typeof window !== 'undefined' && window.lucide && window.lucide.icons
      ? window.lucide.icons[toPascal(name)]
      : null;
  const inner =
    node && node[2]
      ? node[2].map(([tag, attrs]) => `<${tag} ${attrsToStr(attrs)} />`).join('')
      : '';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: inner }}
      {...rest}
    />
  );
}
