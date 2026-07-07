A compact pill toggle for switching between 2–4 views — perfect for the floor/list/timeline view switch.

```jsx
<SegmentedControl value={view} onChange={setView} options={[
  { value: 'sala', label: 'Sala', icon: <Icon name="layout-grid" size={16} /> },
  { value: 'lista', label: 'Lista', icon: <Icon name="list" size={16} /> },
  { value: 'timeline', label: 'Timeline', icon: <Icon name="clock" size={16} /> },
]} />
```
