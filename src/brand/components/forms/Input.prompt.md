Labelled text field with optional icon, hint and error states.

```jsx
<Input label="Nome ospite" placeholder="es. Giulia Rossi" iconLeft={<Icon name="user" size={18} />} />
<Input label="Telefono" error="Numero non valido" />
```
Set `error` to show the red invalid state; `hint` for helper text. `size="sm"` for dense rows.
