import { Settings } from 'lucide-react';

export default function Header({ currentUser, isPremium, onOpenSettings, onLogoClick }) {
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
            {isPremium && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold shadow-md shadow-[hsl(var(--primary)/0.35)]">PRO</span>}
            <div className="flex items-center gap-1.5 ml-2">
              {currentUser.picture && <img src={currentUser.picture} className="w-8 h-8 rounded-full border border-border" alt="Avatar" />}
              <span className="text-xs text-muted-foreground max-w-[110px] truncate">
                {identityLabel}
              </span>
            </div>
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 ml-3 rounded-full border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
