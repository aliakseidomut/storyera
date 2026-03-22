const API_BASE = import.meta.env.VITE_AUTH_API_BASE || '';

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function createAuthError(code, fallbackMessage, serverMessage) {
  const err = new Error(serverMessage || fallbackMessage);
  err.code = code;
  err.serverMessage = serverMessage || '';
  return err;
}

function mapAuthError(status, serverMessage, action) {
  const msg = (serverMessage || '').toLowerCase();

  if (action === 'login') {
    if (status === 401 || msg.includes('unauthorized') || msg.includes('invalid')) {
      return createAuthError('INVALID_CREDENTIALS', 'Invalid email or password', serverMessage);
    }
    if (status === 404 || msg.includes('not found') || msg.includes('user')) {
      return createAuthError('ACCOUNT_NOT_FOUND', 'Account not found', serverMessage);
    }
  }

  if (action === 'register') {
    if (status === 409 || msg.includes('already') || msg.includes('exists')) {
      return createAuthError('EMAIL_EXISTS', 'An account with this email already exists', serverMessage);
    }
    if (status === 400) {
      return createAuthError('INVALID_REGISTER_DATA', 'Please check your registration data', serverMessage);
    }
  }

  if (status === 429) {
    return createAuthError('TOO_MANY_REQUESTS', 'Too many attempts. Try again later', serverMessage);
  }
  if (status >= 500) {
    return createAuthError('SERVER_ERROR', 'Server error. Please try again later', serverMessage);
  }

  return createAuthError('AUTH_ERROR', action === 'login' ? 'Login failed' : 'Registration failed', serverMessage);
}

export const authService = {
  async register(email, password, confirmPassword, agreed) {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, confirmPassword, agreed })
    });

    const data = await parseJsonSafe(res);
    if (!res.ok) {
      throw mapAuthError(res.status, data?.error, 'register');
    }
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await parseJsonSafe(res);
    if (!res.ok) {
      throw mapAuthError(res.status, data?.error, 'login');
    }
    return data;
  }
};

