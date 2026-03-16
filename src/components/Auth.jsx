import { useState } from 'react';
import { authService } from '../services/authService.js';

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    try {
      const fn = mode === 'login' ? authService.login : authService.register;
      const user = await fn(email, password);
      localStorage.setItem('storyera_user', JSON.stringify(user));
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in bg-stone-50">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-stone-900">Welcome to STORIERA</h2>
        <p className="text-xs text-stone-500 mt-1">Sign in to start your interactive stories</p>
      </div>

      <div className="flex mb-6 bg-stone-100 rounded-full p-1">
        <button
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            mode === 'login'
              ? 'bg-white text-stone-900 shadow'
              : 'text-stone-500'
          }`}
          onClick={() => setMode('login')}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            mode === 'register'
              ? 'bg-white text-stone-900 shadow'
              : 'text-stone-500'
          }`}
          onClick={() => setMode('register')}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full mt-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

