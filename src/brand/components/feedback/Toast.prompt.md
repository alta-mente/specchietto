A notification toast with a colored accent bar, icon chip, and optional action.

```jsx
<Toast tone="success" title="Prenotazione confermata"
  description="Giulia Rossi · 4 coperti · 20:30" onClose={dismiss} />
<Toast tone="warning" title="Overbooking" action={{ label: 'Rivedi', onClick: review }} />
```
Tones: success·warning·danger·info·neutral. Provide your own `icon` or pass `icon={null}` to hide it. Stack toasts in a fixed corner container.
