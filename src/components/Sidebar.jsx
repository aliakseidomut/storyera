import { useState } from 'react';

export default function Sidebar({ currentView, onViewChange, language }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isRu = language === 'ru';
  const t = {
    library: isRu ? 'Библиотека' : 'Library',
    continue: isRu ? 'Мои книги' : 'My Books',
    settings: isRu ? 'Настройки' : 'Settings',
    collapse: isRu ? 'Свернуть' : 'Collapse'
  };

  const navClass = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full";
  const activeClass = "bg-primary text-primary-foreground";
  const inactiveClass = "text-muted-foreground hover:bg-card hover:text-foreground";

  return (
    <div className={`hidden md:flex flex-col border-r border-border h-full bg-background p-4 gap-6 flex-none transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Logo Area */}
      <div className="flex items-center px-4 pt-2">
        <button 
            onClick={() => onViewChange('library')} 
            className={`text-xl font-bold tracking-[0.12em] text-foreground hover:text-primary transition-colors flex items-center justify-center w-full`}
        >
          {isCollapsed ? <span className="tracking-widest">S</span> : <span className="tracking-widest">STORIERA</span>}
        </button>
      </div>

      {/* Nav Area */}
      <div className="flex flex-col gap-2 flex-1">
        <button onClick={() => onViewChange('library')} className={`${navClass} ${currentView === 'library' ? activeClass : inactiveClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          {!isCollapsed && t.library}
        </button>
        <button onClick={() => onViewChange('continue')} className={`${navClass} ${currentView === 'continue' ? activeClass : inactiveClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          {!isCollapsed && t.continue}
        </button>
        <button onClick={() => onViewChange('settings')} className={`${navClass} ${currentView === 'settings' ? activeClass : inactiveClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          {!isCollapsed && t.settings}
        </button>
      </div>

      {/* Toggle Button at bottom */}
      <div className="border-t border-border pt-4">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors w-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
          {!isCollapsed && <span className="text-sm font-medium">{t.collapse}</span>}
        </button>
      </div>
    </div>
  );
}
