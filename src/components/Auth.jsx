import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService.js';

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!validateEmail(email)) return setError('Invalid email format');
      if (!validatePassword(password)) return setError('Password must be at least 8 chars, including a digit and special char');
      if (password !== confirmPassword) return setError('Passwords do not match');
      if (!agreed) return setError('You must agree to the Terms of Service');
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await authService.register(email, password, confirmPassword, agreed);
        setMode('verify');
        setError('Verification code sent to your email.');
      } else if (mode === 'login') {
        const user = await authService.login(email, password);
        localStorage.setItem('storyera_user', JSON.stringify(user));
        onAuthSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: verificationCode })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Invalid code');
        
        // Auto-login after verification
        const user = await authService.login(email, password);
        localStorage.setItem('storyera_user', JSON.stringify(user));
        onAuthSuccess(user);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();
        const user = { email: userInfo.email, name: userInfo.name, picture: userInfo.picture };
        localStorage.setItem('storyera_user', JSON.stringify(user));
        onAuthSuccess(user);
      } catch (err) {
        setError('Failed to fetch user info');
      }
    },
    onError: () => setError('Google login failed'),
  });

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in bg-black overflow-y-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-stone-900">Welcome to STORIERA</h2>
        <p className="text-xs text-stone-400 mt-1">
          {mode === 'login' ? 'Sign in to continue' : mode === 'register' ? 'Create an account to start' : 'Verify your email'}
        </p>
      </div>

      {mode !== 'verify' && (
      <div className="flex mb-6 bg-stone-900 rounded-full p-1">
        <button
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            mode === 'login' ? 'bg-white text-stone-900 shadow' : 'text-stone-400'
          }`}
          onClick={() => { setMode('login'); setError(''); }}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            mode === 'register' ? 'bg-white text-stone-900 shadow' : 'text-stone-400'
          }`}
          onClick={() => { setMode('register'); setError(''); }}
        >
          Register
        </button>
      </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'verify' ? (
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Verification Code</label>
            <input
              type="text"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full bg-white border border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
              placeholder="000000"
            />
             <button
              type="button"
              onClick={handleVerify}
              className="w-full mt-4 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-transform active:scale-95"
            >
              Verify Email
            </button>
          </div>
        ) : (
        <>
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
            placeholder="••••••••"
          />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
              placeholder="••••••••"
            />
          </div>
        )}

        {mode === 'register' && (
          <label className="flex items-start gap-2 text-xs text-stone-600">
            <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
                className="mt-0.5"
            />
            <span>I agree to the <a href="#" className="underline text-orange-600">Terms of Service</a> and <a href="#" className="underline text-orange-600">Privacy Policy</a></span>
          </label>
        )}
        </>
        )}

        {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

        {mode !== 'verify' && (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-transform active:scale-95"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
        )}

        {mode === 'login' && (
            <>
                <div className="flex justify-center my-2">
                    <span className="text-xs text-stone-400 uppercase">Or</span>
                </div>
                <button
                type="button"
                onClick={() => login()}
                className="w-full py-3.5 bg-white border border-stone-800 hover:bg-black text-stone-300 rounded-xl font-semibold transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                    fill="#EA4335"
                    d="M12 7.08c1.57 0 2.98.54 4.09 1.6l3.07-3.07C17.45 3.61 14.96 2 12 2c-4.3 0-8.01 2.47-9.82 6.09l2.85 2.84C5.84 8.78 8.28 7.08 11.2 7.08z"
                    />
                </svg>
                Sign in with Google
                </button>
            </>
        )}
      </form>
    </div>
  );
}
