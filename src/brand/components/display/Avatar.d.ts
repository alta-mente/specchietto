import * as React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Full name — used for initials and to derive a stable color. */
  name?: string;
  /** Image URL; falls back to initials when absent. */
  src?: string;
  /** Size. Default "md". */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Shape. Default "circle". */
  shape?: 'circle' | 'rounded';
  /** Show a brand-green focus ring (e.g. active guest). */
  ring?: boolean;
}

/** A guest avatar: photo, or auto-colored initials derived from the name. */
export function Avatar(props: AvatarProps): JSX.Element;
