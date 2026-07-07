Styled native select with a chevron, hint and error states.

```jsx
<Select label="Coperti" placeholder="Seleziona"
  options={[{value:'2',label:'2 persone'},{value:'4',label:'4 persone'}]}
  value={v} onChange={e=>setV(e.target.value)} />
```
Pass `options` or `<option>` children. `placeholder` renders a disabled first option.
