export default function Header({ currentUser, onLogout, isPremium }) {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-stone-800 z-20">
      <h1 className="text-xl font-bold tracking-wider text-brand">STORIERA</h1>
      <div className="flex gap-3 items-center">
        {currentUser && (
          <>
            {isPremium && <span className="text-[10px] bg-brand text-white px-2 py-0.5 rounded-full font-bold">PRO</span>}
            {currentUser.picture && <img src={currentUser.picture} className="w-8 h-8 rounded-full border border-brand" alt="Avatar" />}
            <span className="text-xs text-stone-400 max-w-[80px] truncate">
              {currentUser.email}
            </span>
            <button
              onClick={onLogout}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-800 text-stone-400 hover:bg-stone-900 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
