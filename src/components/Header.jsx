import { Settings } from 'lucide-react';

export default function Header({ currentUser, onLogoClick }) {
  const identityLabel = currentUser?.name?.trim() || currentUser?.email || '';

  return (
    <header className="px-5 py-4 flex justify-between items-center bg-card/90 backdrop-blur-md border-b border-border/70 z-20">
      <button
        type="button"
        onClick={onLogoClick}
        className="text-lg font-bold tracking-[0.12em] text-foreground hover:text-primary transition-colors"
      >
        STORIERA
      </button>
      <div className="flex items-center">
        {currentUser && (
          <>
            <div className="flex items-center gap-1.5 ml-2">
              {currentUser.picture && <img src={currentUser.picture} className="w-8 h-8 rounded-full border border-border" alt="Avatar" />}
              <span className="text-xs text-muted-foreground max-w-[110px] truncate">
                {identityLabel}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
