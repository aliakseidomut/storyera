export default function Header({ currentUser, onLogout }) {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-stone-100 z-20">
      <h1 className="text-xl font-bold tracking-wider text-stone-800">STORIERA</h1>
      <div className="flex gap-3 items-center">
        {currentUser && (
          <>
            <span className="text-xs text-stone-500 max-w-[120px] truncate">
              {currentUser.email}
            </span>
            <button
              onClick={onLogout}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
