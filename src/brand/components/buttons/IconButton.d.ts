import * as React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon node (use the Icon component). */
  children: React.ReactNode;
  /** Visual style. Default "ghost". */
  variant?: 'ghost' | 'soft' | 'solid' | 'outline';
  /** Size. Default "md". */
  size?: 'sm' | 'md' | 'lg';
  /** Fully rounded (circular) instead of squircle. */
  round?: boolean;
  /** Required accessible label (also used as the title tooltip). */
  label: string;
}

/** A square/round icon-only button for toolbars, table rows and dense actions. */
export function IconButton(props: IconButtonProps): JSX.Element;
