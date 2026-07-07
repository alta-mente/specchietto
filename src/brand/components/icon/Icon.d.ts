import * as React from 'react';

export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'name'> {
  /** Lucide icon name in kebab-case (e.g. "calendar-days") or PascalCase. */
  name: string;
  /** Width & height in px. Default 20. */
  size?: number;
  /** Stroke width. Default 2. */
  strokeWidth?: number;
  /** Stroke color. Default "currentColor" (inherits text color). */
  color?: string;
  /** Accessible label. Omit for purely decorative icons (rendered aria-hidden). */
  label?: string;
}

/**
 * Inline SVG icon backed by the Lucide set. Inherits color via currentColor.
 * Requires the Lucide UMD script to be present on the page.
 */
export function Icon(props: IconProps): JSX.Element;
