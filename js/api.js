/**
 * Dopami Admin API client.
 * Stores token + API URL in localStorage.
 */
const Api = (() => {
  const STORAGE_KEY = 'dopami_admin';

  function _getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function _setState(patch) {
    const state = { ..._getState(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getBaseUrl() {
    return (_getState().apiUrl || 'http://localhost:8000').replace(/\/+$/, '');
  }

  function getToken() { return _getState().token || null; }

  function isLoggedIn() { return !!getToken(); }

  function saveAuth(apiUrl, token) {
    _setState({ apiUrl: apiUrl.replace(/\/+$/, ''), token });
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
  }

  async function request(method, path, body) {
    const url = getBaseUrl() + path;
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const opts = { method, headers };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);

    if (res.status === 401) {
      logout();
      location.hash = '#login';
      throw new Error('Session expired');
    }

    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    return data;
  }

  return {
    getBaseUrl,
    getToken,
    isLoggedIn,
    saveAuth,
    logout,
    get:    (path) => request('GET', path),
    post:   (path, body) => request('POST', path, body),
    put:    (path, body) => request('PUT', path, body),
    del:    (path) => request('DELETE', path),
  };
})();
