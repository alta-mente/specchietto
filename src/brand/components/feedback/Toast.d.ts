import * as React from 'react';

export interface ToastAction {
  label: string;
  onClick?: (e: React.MouseEvent) => void;
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Intent — sets the accent bar and default icon. Default "success". */
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  /** Bold title line. */
  title?: string;
  /** Secondary description. */
  description?: string;
  /** Custom icon node. Pass `null` to hide the icon chip. */
  icon?: React.ReactNode;
  /** Optional inline text action. */
  action?: ToastAction;
  /** Show a close (×) button and call this on click. */
  onClose?: (e: React.MouseEvent) => void;
}

/** A notification toast with accent bar, icon, and optional action — e.g. "Prenotazione confermata". */
export function Toast(props: ToastProps): JSX.Element;
