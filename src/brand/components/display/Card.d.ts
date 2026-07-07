import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Inner padding. Default "md". */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Drop shadow depth. Default "sm". */
  elevation?: 'flat' | 'sm' | 'md' | 'lg';
  /** Add hover lift + pointer for clickable cards. */
  interactive?: boolean;
  /** Render as a different element (e.g. "a", "button"). */
  as?: any;
  children?: React.ReactNode;
}

/**
 * The base surface container — white, rounded, soft shadow.
 * @startingPoint section="Components" subtitle="Surface container with padding, elevation & interactive lift" viewport="700x220"
 */
export function Card(props: CardProps): JSX.Element;
