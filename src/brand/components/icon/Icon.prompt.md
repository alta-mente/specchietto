Renders a [Lucide](https://lucide.dev) icon as an inline SVG that inherits the current text color — use it for all iconography across Ficodindia surfaces.

```jsx
<Icon name="calendar-days" size={18} />
<Icon name="users" size={20} color="var(--green-600)" />
<button><Icon name="x" size={16} label="Chiudi" /></button>
```

- `name` is the Lucide name in **kebab-case** (`calendar-days`, `map-pin`, `user-plus`).
- Common sizes: 16 (inline/dense), 18–20 (buttons, UI), 24 (headers).
- Decorative icons are `aria-hidden` automatically; pass `label` when the icon is the only meaning.
- Requires the Lucide UMD script on the page (loaded by the design system's cards & UI kits).
