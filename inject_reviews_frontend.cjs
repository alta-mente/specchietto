const fs = require('fs');
const path = require('path');

const hookFile = path.join(__dirname, 'src/hooks/useSpecchiettoSync.js');
let code = fs.readFileSync(hookFile, 'utf8');

if (!code.includes('const [reviews, setReviews] = useState')) {
  code = code.replace(
    /const \[waitlist, setWaitlist\] = useState\(\[\]\);/,
    `$&
  const [reviews, setReviews] = useState([]);`
  );
  
  code = code.replace(
    /const refreshWaitlist = useCallback\(async \(\) => \{/,
    `const refreshReviews = useCallback(async () => {
    if (!restaurantId || !token) return;
    try {
      const res = await fetch(\`\${backendUrl}/api/reviews?restaurant_id=\${restaurantId}\`, { headers: authHeaders() });
      if (res.ok) setReviews(await res.json());
    } catch(e) {}
  }, [restaurantId, token, authHeaders]);
  
  const replyReview = useCallback(async (id, response) => {
    try {
      const res = await fetch(\`\${backendUrl}/api/reviews/\${id}/reply\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ response })
      });
      if (res.ok) await refreshReviews();
    } catch(e) {}
  }, [authHeaders, refreshReviews]);
  
  $&`
  );
  
  code = code.replace(
    /refreshWaitlist,/,
    `$&
    reviews,
    refreshReviews,
    replyReview,`
  );
  
  fs.writeFileSync(hookFile, code);
}
console.log('Done injecting reviews into useSpecchiettoSync.js');
