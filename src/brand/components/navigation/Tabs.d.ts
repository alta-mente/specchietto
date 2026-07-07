import * as React from 'react';

export interface TabItem {
  /** Unique id, matched against `value`. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional icon node. */
  icon?: React.ReactNode;
  /** Optional count shown as a pill. */
  count?: number;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The tab definitions. */
  tabs: TabItem[];
  /** Currently-selected tab id (controlled). */
  value: string;
  /** Called with the new tab id. */
  onChange?: (id: string) => void;
}

/** Underlined content tabs with optional icons and count pills. */
export function Tabs(props: TabsProps): JSX.Element;
