const TOKEN_KEY = 'tropilot.auth.token';
const USER_KEY = 'tropilot.auth.user';

export function getStoredAuth() {
  if (typeof window === 'undefined') {
    return {
      token: null,
      user: null
    };
  }

  const rawUser = window.localStorage.getItem(USER_KEY);
  let user = null;

  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return {
    token: window.localStorage.getItem(TOKEN_KEY),
    user
  };
}

export function setStoredAuth(token, user) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
