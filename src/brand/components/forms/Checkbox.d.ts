import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  /** Mixed/indeterminate visual state. */
  indeterminate?: boolean;
  /** Label text. */
  label?: string;
  /** Secondary description under the label. */
  description?: string;
}

/** A checkbox with optional label, description and indeterminate state. */
export function Checkbox(props: CheckboxProps): JSX.Element;
