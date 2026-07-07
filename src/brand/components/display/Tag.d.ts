import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color family. Default "neutral". */
  color?: 'neutral' | 'green' | 'red' | 'yellow' | 'orange' | 'lavender' | 'blue';
  /** Show a leading square dot. */
  dot?: boolean;
  /** Icon node before the label. */
  iconLeft?: React.ReactNode;
  /** Show a remove (×) button and call this on click. */
  onRemove?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

/** A label chip for categorising guests/tables (VIP, allergies, occasions). Removable when onRemove is set. */
export function Tag(props: TagProps): JSX.Element;
