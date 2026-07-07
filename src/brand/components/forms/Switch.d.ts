import * as React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Controlled on/off state. */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  /** Optional text label rendered after the toggle. */
  label?: string;
  /** Size. Default "md". */
  size?: 'sm' | 'md';
}

/** An on/off toggle for settings and quick actions. */
export function Switch(props: SwitchProps): JSX.Element;
