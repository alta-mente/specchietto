import * as React from 'react';

export type BadgeTone =
  | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'special'
  /** reservation-status aliases */
  | 'confirmed' | 'pending' | 'seated' | 'vip' | 'cancelled' | 'note';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color/intent. Reservation aliases map to the status palette. Default "neutral". */
  tone?: BadgeTone;
  /** Fill style. Default "soft". */
  variant?: 'soft' | 'solid' | 'outline';
  /** Size. Default "md". */
  size?: 'sm' | 'md';
  /** Show a leading status dot. */
  dot?: boolean;
  /** Icon node before the label. */
  iconLeft?: React.ReactNode;
  children?: React.ReactNode;
}

/** A small status pill. Use reservation tones (confirmed/pending/seated/vip/cancelled) for booking states. */
export function Badge(props: BadgeProps): JSX.Element;
