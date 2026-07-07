A label chip for categorising guests and tables — VIP, allergies, occasions, seating preferences.

```jsx
<Tag color="lavender" dot>VIP</Tag>
<Tag color="red" iconLeft={<Icon name="wine" size={14} />}>Allergia: frutta secca</Tag>
<Tag color="green" onRemove={() => remove(id)}>Cliente abituale</Tag>
```
Pass `onRemove` to show a × button. Colors: neutral·green·red·yellow·orange·lavender·blue.
