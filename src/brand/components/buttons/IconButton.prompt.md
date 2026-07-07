An icon-only button for toolbars, table-row actions, and dense UI. Always pass a `label` for accessibility (it also becomes the hover tooltip).

```jsx
<IconButton label="Modifica"><Icon name="pencil" size={18} /></IconButton>
<IconButton variant="soft" round label="Aggiungi"><Icon name="plus" size={18} /></IconButton>
<IconButton variant="solid" label="Conferma"><Icon name="check" size={18} /></IconButton>
```

Variants: `ghost` (default, transparent), `soft` (tinted fill), `solid` (charcoal), `outline`. Set `round` for circular.
