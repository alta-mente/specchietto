A dashboard KPI tile: tinted icon chip, big display value, label, and an optional trend delta.

```jsx
<StatTile label="Coperti oggi" value="142" tone="green"
  icon={<Icon name="users" size={20} />} delta={{ value: '12%', direction: 'up' }} />
```
`tone` colors the icon chip; `delta.direction` (up/down/flat) colors the trend chip green/red/neutral.
