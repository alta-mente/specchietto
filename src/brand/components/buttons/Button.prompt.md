The primary action control — pill-shaped, on-brand. Use `primary` (charcoal) for the main action on a view, `accent` (green) for positive/confirming actions, `secondary` for lower-emphasis, `ghost` for tertiary, `danger` for destructive.

```jsx
<Button variant="accent" iconLeft={<Icon name="check" size={18} />}>Conferma prenotazione</Button>
<Button variant="secondary">Annulla</Button>
<Button variant="primary" size="lg" fullWidth loading>Invio…</Button>
```

- Only **one** primary/accent button per view; pair with `secondary`/`ghost`.
- `loading` swaps in a spinner and disables the button.
- Pass `as="a"` (plus `href`) to render a link that looks like a button.
