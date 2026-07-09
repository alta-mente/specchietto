const fs = require('fs');
const path = require('path');

const hookFile = path.join(__dirname, 'src/hooks/useSpecchiettoSync.js');
let code = fs.readFileSync(hookFile, 'utf8');

if (!code.includes('const [transactions, setTransactions] = useState')) {
  code = code.replace(
    /const \[reviews, setReviews\] = useState\(\[\]\);/,
    `$&
  const [transactions, setTransactions] = useState([]);`
  );
  
  code = code.replace(
    /const refreshReviews = useCallback\(async \(\) => \{/,
    `const refreshTransactions = useCallback(async () => {
    if (!restaurantId || !token) return;
    try {
      const res = await fetch(\`\${backendUrl}/api/transactions?restaurant_id=\${restaurantId}\`, { headers: authHeaders() });
      if (res.ok) setTransactions(await res.json());
    } catch(e) {}
  }, [restaurantId, token, authHeaders]);
  
  const checkoutAppointment = useCallback(async (appointmentId, totalAmount, paymentMethod, items, discountCode) => {
    try {
      const res = await fetch(\`\${backendUrl}/api/transactions\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ restaurant_id: restaurantId, appointment_id: appointmentId, total_amount: totalAmount, payment_method: paymentMethod, items, discount_code: discountCode })
      });
      if (res.ok) {
        await refreshTransactions();
        await refreshAppointments();
        await refreshCustomers(); // to update loyalty points
      }
    } catch(e) {}
  }, [restaurantId, authHeaders, refreshTransactions, refreshAppointments, refreshCustomers]);
  
  $&`
  );
  
  code = code.replace(
    /refreshReviews,/,
    `$&
    refreshTransactions,`
  );

  code = code.replace(
    /replyReview,/,
    `$&
    transactions,
    checkoutAppointment,`
  );

  fs.writeFileSync(hookFile, code);
}
console.log('Done injecting POS into useSpecchiettoSync.js');
