import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Field label rendered above the control. */
  label?: string;
  /** Helper text (hidden when `error` is set). */
  hint?: string;
  /** Error message; turns the field red. */
  error?: string;
  /** Options array. Alternatively pass <option> children. */
  options?: SelectOption[];
  /** Disabled placeholder shown when no value is selected. */
  placeholder?: string;
  /** Height. Default "md". */
  size?: 'sm' | 'md';
}

/** A styled native select with chevron, hint and error states. */
export function Select(props: SelectProps): JSX.Element;
