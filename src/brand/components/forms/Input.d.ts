import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the input. */
  label?: string;
  /** Helper text shown below (hidden when `error` is set). */
  hint?: string;
  /** Error message; turns the field red and overrides `hint`. */
  error?: string;
  /** Icon node rendered inside, before the text (use the Icon component). */
  iconLeft?: React.ReactNode;
  /** Node rendered inside, after the text (icon, unit, button…). */
  suffix?: React.ReactNode;
  /** Height. Default "md". */
  size?: 'sm' | 'md';
}

/** A labelled text field with icon, hint and error states. */
export function Input(props: InputProps): JSX.Element;
