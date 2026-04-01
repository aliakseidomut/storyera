import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

const LANGUAGES_EN = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
];
const LANGUAGES_RU = [
  { code: 'en', label: 'Английский' },
  { code: 'ru', label: 'Русский' },
];

export default function SettingsPage({ currentUser, language, theme, onThemeChange, onLanguageChange, onAvatarChange, onLogout }) {
  const isRu = language === 'ru';
  const copy = isRu
    ? {
        title: 'Настройки профиля',
        theme: 'Тема оформления',
        themeDark: 'Тёмная',
        themeLight: 'Светлая',
        avatarHint: 'Нажмите на аватар, чтобы изменить.',
        avatarDropTitle: 'Перетащите изображение сюда',
        avatarDropSubtitle: 'или выберите файл с устройства',
        avatarUpload: 'Загрузить аватар',
        avatarInvalid: 'Можно загружать только изображения.',
        avatarReadError: 'Не удалось прочитать файл.',
        avatarClose: 'Закрыть',
        email: 'Email',
        appLanguage: 'Язык приложения',
        logout: 'Выйти из аккаунта',
      }
    : {
        title: 'Profile Settings',
        theme: 'Theme',
        themeDark: 'Dark',
        themeLight: 'Light',
        avatarHint: 'Click avatar to change it.',
        avatarDropTitle: 'Drop image here',
        avatarDropSubtitle: 'or choose a file from your device',
        avatarUpload: 'Upload avatar',
        avatarInvalid: 'Only image files are allowed.',
        avatarReadError: 'Failed to read file.',
        avatarClose: 'Close',
        email: 'Email',
        appLanguage: 'App language',
        logout: 'Log out',
      };

  const [picture, setPicture] = useState(currentUser?.picture || '');
  const [avatarError, setAvatarError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPicture(currentUser?.picture || '');
    setAvatarError('');
    setIsDragging(false);
    setShowAvatarPicker(false);
  }, [currentUser]);

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError(copy.avatarInvalid);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setPicture(result);
      setAvatarError('');
      onAvatarChange(result);
    };
    reader.onerror = () => {
      setAvatarError(copy.avatarReadError);
    };
    reader.readAsDataURL(file);
  };

  const email = currentUser?.email || '';
  const avatarLetter = email.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="p-6 animate-fade-in bg-background text-foreground min-h-screen flex justify-center">
      <div className="w-full max-w-[600px]">
        <h2 className="text-2xl font-bold mb-6 text-foreground uppercase tracking-wider">{copy.title}</h2>

        {/* Avatar + Email */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="w-20 h-20 rounded-full bg-muted border border-border/80 overflow-hidden shrink-0 flex items-center justify-center text-xl font-semibold text-foreground hover:border-primary transition"
          >
            {picture ? (
              <img src={picture} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span>{avatarLetter}</span>
            )}
          </button>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-foreground">{email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{copy.avatarHint}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Language selector — instant switch */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{copy.appLanguage}</label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 appearance-none"
              >
                {(isRu ? LANGUAGES_RU : LANGUAGES_EN).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Theme toggle — instant switch */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">{copy.theme}</label>
            <button
              type="button"
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground hover:border-primary transition"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span className="flex-1 text-left">{theme === 'dark' ? copy.themeDark : copy.themeLight}</span>
              <div className={`relative w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary/80' : 'bg-muted-foreground/30'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onLogout}
            className="w-full py-6 text-red-500 hover:text-red-600 hover:bg-red-950/20 rounded-2xl"
          >
            {copy.logout}
          </Button>
        </div>

        {/* Avatar picker modal */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-2xl">
              <div
                className={`rounded-xl border-2 border-dashed p-8 text-center transition ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  processImageFile(file);
                  setShowAvatarPicker(false);
                }}
              >
                <p className="text-sm font-semibold text-foreground">{copy.avatarDropTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">{copy.avatarDropSubtitle}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {copy.avatarUpload}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    processImageFile(e.target.files?.[0]);
                    setShowAvatarPicker(false);
                  }}
                />
              </div>
              {avatarError && <p className="mt-3 text-xs text-destructive">{avatarError}</p>}
              <Button
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => setShowAvatarPicker(false)}
              >
                {copy.avatarClose}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
