import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. primary = charcoal, accent = brand green, secondary = outline, ghost = bare, danger = red. */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  /** Size. Default "md". */
  size?: 'sm' | 'md' | 'lg';
  /** Icon node rendered before the label (use the Icon component). */
  iconLeft?: React.ReactNode;
  /** Icon node rendered after the label. */
  iconRight?: React.ReactNode;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Render as a different element/component (e.g. "a"). Default "button". */
  as?: any;
  children?: React.ReactNode;
}

/**
 * The primary action control. Pill-shaped, on-brand.
 * @startingPoint section="Components" subtitle="Pill buttons — primary, accent, secondary, ghost, danger" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
