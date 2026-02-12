/**
 * Login page — uses POST /auth/dev-login
 */
const LoginPage = (() => {
  function render(container) {
    // Login form is in index.html; just attach handler
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');

    // Remove old handler by cloning
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const apiUrl = document.getElementById('api-url').value.trim();
      const secret = document.getElementById('jwt-secret').value.trim();
      const errorEl = document.getElementById('login-error');
      const btn = newForm.querySelector('button[type="submit"]');

      errorEl.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        // Dev-login: POST /auth/dev-login with secret as body
        const url = apiUrl.replace(/\/+$/, '') + '/auth/dev-login';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Login failed');

        // Check admin status
        Api.saveAuth(apiUrl, data.access_token);

        const me = await Api.get('/me');
        if (!me.is_admin) {
          Api.logout();
          throw new Error('Account is not an admin. Run: UPDATE users SET is_admin=true WHERE id=\'...\' in the DB.');
        }

        location.hash = '#dashboard';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        Api.logout();
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  return { render };
})();
