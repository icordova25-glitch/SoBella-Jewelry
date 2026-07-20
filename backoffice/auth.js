const BACKOFFICE_AUTH_KEY = 'sobella-backoffice-auth';

function toBasicAuthToken(username, password) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function getCredentials() {
  try {
    const raw = localStorage.getItem(BACKOFFICE_AUTH_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.username || !parsed.password) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function setCredentials(username, password) {
  localStorage.setItem(BACKOFFICE_AUTH_KEY, JSON.stringify({ username, password }));
}

function clearCredentials() {
  localStorage.removeItem(BACKOFFICE_AUTH_KEY);
}

function getAuthHeader() {
  const credentials = getCredentials();
  if (!credentials) {
    return '';
  }
  return toBasicAuthToken(credentials.username, credentials.password);
}

async function backofficeFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const authHeader = getAuthHeader();
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearCredentials();
  }
  return response;
}

window.sobellaBackofficeAuth = {
  getCredentials,
  setCredentials,
  clearCredentials,
  getAuthHeader,
  fetch: backofficeFetch,
};