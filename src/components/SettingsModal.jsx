import { useEffect, useRef, useState } from 'react';

const LANGUAGES_EN = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
];
const LANGUAGES_RU = [
  { code: 'en', label: 'Английский' },
  { code: 'ru', label: 'Русский' },
];

export default function SettingsModal({ currentUser, language, onSave, onClose, onLogout }) {
  const isRu = language === 'ru';
  const copy = isRu
    ? {
        title: 'Настройки профиля',
        avatarHint: 'Нажмите на аватар, чтобы изменить.',
        avatarDropTitle: 'Перетащите изображение сюда',
        avatarDropSubtitle: 'или выберите файл с устройства',
        avatarUpload: 'Загрузить аватар',
        avatarInvalid: 'Можно загружать только изображения.',
        avatarReadError: 'Не удалось прочитать файл.',
        avatarClose: 'Закрыть',
        name: 'Имя',
        namePlaceholder: 'Ваше имя',
        email: 'Email',
        appLanguage: 'Язык приложения',
        save: 'Сохранить настройки',
        logout: 'Выйти из аккаунта',
      }
    : {
        title: 'Profile Settings',
        avatarHint: 'Click avatar to change it.',
        avatarDropTitle: 'Drop image here',
        avatarDropSubtitle: 'or choose a file from your device',
        avatarUpload: 'Upload avatar',
        avatarInvalid: 'Only image files are allowed.',
        avatarReadError: 'Failed to read file.',
        avatarClose: 'Close',
        name: 'Name',
        namePlaceholder: 'Your name',
        email: 'Email',
        appLanguage: 'App language',
        save: 'Save Settings',
        logout: 'Log out',
      };

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [picture, setPicture] = useState(currentUser?.picture || '');
  const [selectedLanguage, setSelectedLanguage] = useState(language || 'en');
  const [avatarError, setAvatarError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setName(currentUser?.name || '');
    setEmail(currentUser?.email || '');
    setPicture(currentUser?.picture || '');
    setSelectedLanguage(language || 'en');
    setAvatarError('');
    setIsDragging(false);
    setShowAvatarPicker(false);
  }, [currentUser, language]);

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError(copy.avatarInvalid);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPicture(typeof reader.result === 'string' ? reader.result : '');
      setAvatarError('');
    };
    reader.onerror = () => {
      setAvatarError(copy.avatarReadError);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(
      {
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
        picture: picture.trim(),
      },
      selectedLanguage
    );
  };

  const avatarLetter = (email || currentUser?.email || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-2xl w-full max-w-md p-6 border border-border/80 shadow-2xl shadow-[hsl(var(--background)/0.55)] animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold tracking-tight mb-5">{copy.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="w-14 h-14 rounded-full bg-muted border border-border/80 overflow-hidden shrink-0 flex items-center justify-center text-sm font-semibold text-foreground hover:border-primary/40 transition"
            >
              {picture ? (
                <img src={picture} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <span>{avatarLetter}</span>
              )}
            </button>
            <p className="text-xs text-muted-foreground">{copy.avatarHint}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{copy.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muted/80 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder={copy.namePlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{copy.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-muted/80 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{copy.appLanguage}</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-muted/80 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              {(isRu ? LANGUAGES_RU : LANGUAGES_EN).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-[hsl(var(--primary)/0.36)] hover:opacity-90 transition"
          >
            {copy.save}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 border border-border/80 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {copy.logout}
          </button>
        </form>
      </div>

      {showAvatarPicker && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl border border-border/80 p-5 shadow-2xl shadow-[hsl(var(--background)/0.55)]">
            <div
              className={`rounded-xl border border-dashed p-6 text-center transition ${isDragging ? 'border-primary bg-primary/10' : 'border-border/80 bg-muted/40'}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 text-xs font-medium px-3 py-1.5 rounded-full border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {copy.avatarUpload}
              </button>
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
            {avatarError && <p className="mt-3 text-xs text-primary">{avatarError}</p>}
            <button
              type="button"
              onClick={() => setShowAvatarPicker(false)}
              className="mt-4 w-full py-2.5 border border-border/80 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {copy.avatarClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
