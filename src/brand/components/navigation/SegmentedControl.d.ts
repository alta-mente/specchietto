import * as React from 'react';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The segment options. */
  options: SegmentOption[];
  /** Selected value (controlled). */
  value: string;
  /** Called with the new value. */
  onChange?: (value: string) => void;
  /** Size. Default "md". */
  size?: 'sm' | 'md';
  /** Stretch segments to fill the width. */
  fullWidth?: boolean;
}

/** A compact pill toggle for switching between 2–4 views (e.g. Sala / Lista / Timeline). */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
