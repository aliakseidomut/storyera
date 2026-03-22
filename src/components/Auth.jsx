import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService.js';
import { AGREEMENTS } from '../constants/agreements.js';

export default function Auth({ onAuthSuccess, language = 'en' }) {
  const isRu = language === 'ru';
  const t = {
    welcome: isRu ? 'Добро пожаловать в STORIERA' : 'Welcome to STORIERA',
    signInToContinue: isRu ? 'Войдите, чтобы продолжить' : 'Sign in to continue',
    createAccountToStart: isRu ? 'Создайте аккаунт, чтобы начать' : 'Create an account to start',
    verifyEmailText: isRu ? 'Подтвердите ваш email' : 'Verify your email',
    login: isRu ? 'Вход' : 'Login',
    register: isRu ? 'Регистрация' : 'Register',
    verificationCode: isRu ? 'Код подтверждения' : 'Verification Code',
    verifyEmail: isRu ? 'Подтвердить Email' : 'Verify Email',
    email: 'Email',
    password: isRu ? 'Пароль' : 'Password',
    confirmPassword: isRu ? 'Подтверждение пароля' : 'Confirm Password',
    agreeText: isRu ? 'Я принимаю' : 'I agree to the',
    tos: isRu ? 'Условия использования' : 'Terms of Service',
    privacy: isRu ? 'Политику конфиденциальности' : 'Privacy Policy',
    and: isRu ? 'и' : 'and',
    pleaseWait: isRu ? 'Подождите…' : 'Please wait…',
    createAccount: isRu ? 'Создать аккаунт' : 'Create account',
    or: isRu ? 'или' : 'Or',
    google: isRu ? 'Войти через Google' : 'Sign in with Google',
    openTerms: isRu ? 'Открыть условия' : 'Open Terms',
    openPrivacy: isRu ? 'Открыть политику' : 'Open Privacy',
    closeDoc: isRu ? 'Закрыть' : 'Close',
  };
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDoc, setOpenDoc] = useState(null); // 'terms' | 'privacy' | null
  const docs = AGREEMENTS[isRu ? 'ru' : 'en'];

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/.test(password);

  const getFriendlyAuthError = (err, fallback) => {
    const code = err?.code;
    const mapRu = {
      INVALID_CREDENTIALS: 'Неверный email или пароль.',
      ACCOUNT_NOT_FOUND: 'Аккаунт не найден.',
      EMAIL_EXISTS: 'Аккаунт с таким email уже существует.',
      INVALID_REGISTER_DATA: 'Проверьте корректность данных регистрации.',
      TOO_MANY_REQUESTS: 'Слишком много попыток. Попробуйте позже.',
      SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
      AUTH_ERROR: 'Ошибка авторизации. Попробуйте снова.',
      INVALID_CODE: 'Неверный или просроченный код подтверждения.',
    };
    const mapEn = {
      INVALID_CREDENTIALS: 'Invalid email or password.',
      ACCOUNT_NOT_FOUND: 'Account not found.',
      EMAIL_EXISTS: 'An account with this email already exists.',
      INVALID_REGISTER_DATA: 'Please check your registration data.',
      TOO_MANY_REQUESTS: 'Too many attempts. Try again later.',
      SERVER_ERROR: 'Server error. Please try again later.',
      AUTH_ERROR: 'Authorization failed. Please try again.',
      INVALID_CODE: 'Invalid or expired verification code.',
    };
    if (code) return isRu ? (mapRu[code] || fallback) : (mapEn[code] || fallback);
    return fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!validateEmail(email)) return setError(isRu ? 'Неверный формат email' : 'Invalid email format');
      if (!validatePassword(password)) return setError(isRu ? 'Пароль должен быть не менее 8 символов, с цифрой и спецсимволом' : 'Password must be at least 8 chars, including a digit and special char');
      if (password !== confirmPassword) return setError(isRu ? 'Пароли не совпадают' : 'Passwords do not match');
      if (!agreed) return setError(isRu ? 'Необходимо принять Условия использования' : 'You must agree to the Terms of Service');
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await authService.register(email, password, confirmPassword, agreed);
        setMode('verify');
        setError(isRu ? 'Код подтверждения отправлен на ваш email.' : 'Verification code sent to your email.');
      } else if (mode === 'login') {
        const user = await authService.login(email, password);
        localStorage.setItem('storyera_user', JSON.stringify(user));
        onAuthSuccess(user);
      }
    } catch (err) {
      const fallback = isRu ? 'Что-то пошло не так' : 'Something went wrong';
      setError(getFriendlyAuthError(err, fallback));
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
        if (!response.ok) {
          const apiErr = new Error(data.error || (isRu ? 'Неверный код' : 'Invalid code'));
          if (response.status === 401) apiErr.code = 'INVALID_CODE';
          if (response.status === 404) apiErr.code = 'ACCOUNT_NOT_FOUND';
          if (response.status >= 500) apiErr.code = 'SERVER_ERROR';
          throw apiErr;
        }
        
        // Auto-login after verification
        const user = await authService.login(email, password);
        localStorage.setItem('storyera_user', JSON.stringify(user));
        onAuthSuccess(user);
    } catch (err) {
        const fallback = isRu ? 'Неверный или просроченный код подтверждения.' : 'Invalid or expired verification code.';
        setError(getFriendlyAuthError(err, fallback));
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
        setError(isRu ? 'Не удалось получить данные пользователя' : 'Failed to fetch user info');
      }
    },
    onError: () => setError(isRu ? 'Ошибка входа через Google' : 'Google login failed'),
  });

  if (openDoc) {
    return (
      <div className="p-6 h-full animate-fade-in bg-background text-foreground overflow-y-auto">
        <div className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-2xl shadow-[hsl(var(--background)/0.55)]">
          <div className="px-5 py-4 border-b border-border/70 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {openDoc === 'terms' ? docs.termsTitle : docs.privacyTitle}
            </h3>
            <button
              type="button"
              onClick={() => setOpenDoc(null)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {t.closeDoc}
            </button>
          </div>
          <div className="p-5">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground font-sans">
              {openDoc === 'terms' ? docs.terms : docs.privacy}
            </pre>
            <a href="mailto:support@yourapp.com" className="mt-4 inline-block text-xs underline text-primary">
              support@yourapp.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in bg-background text-foreground overflow-y-auto">
      <div className="text-center mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.welcome}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === 'login' ? t.signInToContinue : mode === 'register' ? t.createAccountToStart : t.verifyEmailText}
        </p>
      </div>

      {mode !== 'verify' && (
      <div className="flex mb-6 bg-muted/80 rounded-full p-1 border border-border/80">
        <button
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            mode === 'login' ? 'bg-card text-foreground shadow-md shadow-[hsl(var(--background)/0.35)]' : 'text-muted-foreground'
          }`}
          onClick={() => { setMode('login'); setError(''); }}
        >
          {t.login}
        </button>
        <button
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            mode === 'register' ? 'bg-card text-foreground shadow-md shadow-[hsl(var(--background)/0.35)]' : 'text-muted-foreground'
          }`}
          onClick={() => { setMode('register'); setError(''); }}
        >
          {t.register}
        </button>
      </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'verify' ? (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{t.verificationCode}</label>
            <input
              type="text"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full bg-card border border-border/80 rounded-xl px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="000000"
            />
             <button
              type="button"
              onClick={handleVerify}
              className="w-full mt-4 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold transition active:scale-[0.99] hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)/0.35)] hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.45)]"
            >
              {t.verifyEmail}
            </button>
          </div>
        ) : (
        <>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border/80 rounded-xl px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{t.password}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card border border-border/80 rounded-xl px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            placeholder="••••••••"
          />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{t.confirmPassword}</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-card border border-border/80 rounded-xl px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="••••••••"
            />
          </div>
        )}

        {mode === 'register' && (
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
                className="mt-0.5"
            />
            <span>
              {t.agreeText}{' '}
              <button type="button" onClick={() => setOpenDoc('terms')} className="underline text-foreground">
                {t.tos}
              </button>{' '}
              {t.and}{' '}
              <button type="button" onClick={() => setOpenDoc('privacy')} className="underline text-foreground">
                {t.privacy}
              </button>
            </span>
          </label>
        )}
        </>
        )}

        {error && <div className="text-xs text-primary bg-primary/10 p-3 rounded-xl border border-primary/20">{error}</div>}

        {mode !== 'verify' && (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold transition active:scale-[0.99] hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)/0.35)] hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.45)]"
        >
          {loading ? t.pleaseWait : mode === 'login' ? t.login : t.createAccount}
        </button>
        )}

        {mode === 'login' && (
            <>
                <div className="flex justify-center my-2">
                    <span className="text-xs text-muted-foreground uppercase">{t.or}</span>
                </div>
                <button
                type="button"
                onClick={() => login()}
                className="w-full py-3.5 bg-card border border-border/80 hover:bg-muted text-card-foreground rounded-xl font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2"
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
                {t.google}
                </button>
            </>
        )}
      </form>

    </div>
  );
}
