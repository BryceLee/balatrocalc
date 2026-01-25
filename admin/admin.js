(function () {
  const searchEmail = document.getElementById('searchEmail');
  const searchBtn = document.getElementById('searchBtn');
  const searchResult = document.getElementById('searchResult');

  const paymentEmail = document.getElementById('paymentEmail');
  const paymentPlan = document.getElementById('paymentPlan');
  const paymentAmount = document.getElementById('paymentAmount');
  const paymentTxn = document.getElementById('paymentTxn');
  const paymentBtn = document.getElementById('paymentBtn');
  const paymentStatus = document.getElementById('paymentStatus');

  const revokeEmail = document.getElementById('revokeEmail');
  const revokeBtn = document.getElementById('revokeBtn');
  const revokeStatus = document.getElementById('revokeStatus');

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  async function getJson(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  searchBtn.addEventListener('click', async () => {
    searchResult.textContent = 'Loading...';
    const email = normalizeEmail(searchEmail.value);
    if (!email) {
      searchResult.textContent = 'Missing email';
      return;
    }
    try {
      const data = await getJson(`/api/admin/search?email=${encodeURIComponent(email)}`);
      searchResult.textContent = JSON.stringify(data.results || [], null, 2);
    } catch (error) {
      searchResult.textContent = error.message || 'Search failed';
    }
  });

  paymentBtn.addEventListener('click', async () => {
    paymentStatus.textContent = '';
    const email = normalizeEmail(paymentEmail.value);
    const plan = paymentPlan.value;
    const amount = paymentAmount.value;
    const txnId = paymentTxn.value;
    if (!email) {
      paymentStatus.textContent = 'Missing email';
      return;
    }
    try {
      const data = await postJson('/api/admin/payment', {
        email,
        plan,
        amount,
        txn_id: txnId
      });
      paymentStatus.textContent = `Added payment. Expires: ${data.expiresAt || 'lifetime'}`;
    } catch (error) {
      paymentStatus.textContent = error.message || 'Payment add failed';
    }
  });

  revokeBtn.addEventListener('click', async () => {
    revokeStatus.textContent = '';
    const email = normalizeEmail(revokeEmail.value);
    if (!email) {
      revokeStatus.textContent = 'Missing email';
      return;
    }
    try {
      await postJson('/api/admin/revoke', { email });
      revokeStatus.textContent = 'Revoked active payments';
    } catch (error) {
      revokeStatus.textContent = error.message || 'Revoke failed';
    }
  });
})();
