import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
];

export default function SettingsPage({ currentUser, language, onSave, onLogout }) {
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
    <div className="p-6 animate-fade-in bg-background text-foreground min-h-screen">
      <h2 className="text-2xl font-bold tracking-tight mb-8">{copy.title}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
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
          <p className="text-xs text-muted-foreground">{copy.avatarHint}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{copy.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder={copy.namePlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{copy.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{copy.appLanguage}</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-6 font-semibold rounded-2xl"
        >
          {copy.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onLogout}
          className="w-full py-6 text-red-500 hover:text-red-600 hover:bg-red-950/20 rounded-2xl"
        >
          {copy.logout}
        </Button>
      </form>

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
  );
}
