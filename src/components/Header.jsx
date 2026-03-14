export default function Header() {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-stone-100 z-20">
      <h1 className="text-xl font-bold tracking-wider text-stone-800">STORIERA</h1>
      <div className="flex gap-4">
        <button className="text-stone-400 hover:text-stone-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
