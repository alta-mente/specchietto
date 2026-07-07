import * as React from 'react';

export interface StatDelta {
  /** Display text, e.g. "12%". */
  value: string;
  /** Trend direction — colors the chip. */
  direction?: 'up' | 'down' | 'flat';
}

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric caption under the value. */
  label?: string;
  /** The big number/value. */
  value: React.ReactNode;
  /** Icon node shown in the tinted chip. */
  icon?: React.ReactNode;
  /** Chip color. Default "green". */
  tone?: 'green' | 'orange' | 'lavender' | 'blue' | 'red' | 'yellow' | 'neutral';
  /** Optional trend chip. */
  delta?: StatDelta;
  /** Small muted hint under the label. */
  hint?: string;
}

/**
 * A dashboard metric tile: icon chip, big display value, label and trend.
 * @startingPoint section="Components" subtitle="KPI metric tile with icon, value and trend delta" viewport="700x180"
 */
export function StatTile(props: StatTileProps): JSX.Element;
