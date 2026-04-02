import { useState } from 'react';

export default function ContinueReading({
  stories,
  progress = {},
  bookmarks = {},
  completedStories = [],
  onStoryClick,
  onContinueWithLang,
  onReadCompleted,
  language
}) {
  const isRu = language === 'ru';
  const t = {
    title: isRu ? 'Мои книги' : 'My Books',
    tabBookmarks: isRu ? 'Закладки' : 'Bookmarks',
    tabInProgress: isRu ? 'Начатые' : 'In Progress',
    tabCompleted: isRu ? 'Завершённые' : 'Completed',
    noBookmarks: isRu ? 'Нет закладок.' : 'No bookmarks yet.',
    noInProgress: isRu ? 'Нет начатых книг.' : 'No books in progress.',
    noCompleted: isRu ? 'Нет завершённых книг.' : 'No completed books.',
    read: isRu ? 'Перечитать' : 'Re-read',
    continueReading: isRu ? 'Продолжить' : 'Continue',
  };

  const [activeTab, setActiveTab] = useState('in-progress');

  const tabs = [
    { id: 'bookmarks', label: t.tabBookmarks },
    { id: 'in-progress', label: t.tabInProgress },
    { id: 'completed', label: t.tabCompleted },
  ];

  /* ──── Bookmarked stories ──── */
  const bookmarkedStories = stories.filter(s => bookmarks[s.id] || bookmarks[String(s.id)]);

  /* ──── In-progress: flatten to per-language entries ──── */
  const inProgressEntries = [];
  stories.forEach(story => {
    const sid = String(story.id);
    const langMap = progress[sid] || progress[story.id];
    if (!langMap || typeof langMap !== 'object') return;
    Object.entries(langMap).forEach(([lang, prog]) => {
      if (prog && typeof prog === 'object') {
        inProgressEntries.push({ story, lang, prog });
      }
    });
  });

  const renderBookmarks = () => (
    bookmarkedStories.length === 0 ? (
      <div className="text-center py-20 text-muted-foreground italic">{t.noBookmarks}</div>
    ) : (
      bookmarkedStories.map(story => (
        <StoryCard key={`bm-${story.id}`} story={story} onClick={() => onStoryClick(story)} />
      ))
    )
  );

  const renderInProgress = () => (
    inProgressEntries.length === 0 ? (
      <div className="text-center py-20 text-muted-foreground italic">{t.noInProgress}</div>
    ) : (
      inProgressEntries.map(({ story, lang, prog }) => (
        <div
          key={`ip-${story.id}-${lang}`}
          className="bg-card rounded-2xl p-4 flex gap-4 cursor-pointer hover:border-primary border border-border transition shadow-sm"
          onClick={() => onContinueWithLang?.(story, lang)}
        >
          <img src={story.image} className="w-16 h-16 rounded-2xl object-cover" alt={story.title} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-sm truncate">{story.title}</h4>
            {prog?.last_scene_summary && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{prog.last_scene_summary}</p>
            )}
            <div className="mt-2 flex gap-1.5 items-center text-[10px]">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {lang.toUpperCase()}
              </span>
              {prog?.choices_count > 0 && (
                <span className="text-muted-foreground">
                  {isRu ? 'Выборов' : 'Choices'}: {prog.choices_count}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-medium whitespace-nowrap">{t.continueReading}</span>
          </div>
        </div>
      ))
    )
  );

  const renderCompleted = () => (
    completedStories.length === 0 ? (
      <div className="text-center py-20 text-muted-foreground italic">{t.noCompleted}</div>
    ) : (
      completedStories.map(item => (
        <div
          key={`comp-${item.id}`}
          className="bg-card rounded-2xl p-4 flex gap-4 cursor-pointer hover:border-primary border border-border transition shadow-sm"
          onClick={() => onReadCompleted?.(item)}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl">📖</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-sm truncate">{item.title}</h4>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(item.completed_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
            </p>
            <div className="mt-2 flex gap-2 text-[10px]">
              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">
                {isRu ? 'Завершено' : 'Completed'}
              </span>
              {item.language && (
                <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {item.language.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-primary font-medium">{t.read}</span>
          </div>
        </div>
      ))
    )
  );

  return (
    <div className="p-6 space-y-6 pb-20 animate-fade-in bg-background min-h-screen text-foreground">
      <h2 className="text-2xl font-bold mb-2 text-foreground uppercase tracking-wider">{t.title}</h2>

      {/* Tab bar */}
      <div className="flex bg-muted/80 rounded-full p-1 border border-border/80">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {activeTab === 'bookmarks' && renderBookmarks()}
        {activeTab === 'in-progress' && renderInProgress()}
        {activeTab === 'completed' && renderCompleted()}
      </div>
    </div>
  );
}

/* ──── Shared story card (bookmarks) ──── */
function StoryCard({ story, onClick }) {
  return (
    <div
      className="bg-card rounded-2xl p-4 flex gap-4 cursor-pointer hover:border-primary border border-border transition shadow-sm"
      onClick={onClick}
    >
      <img src={story.image} className="w-16 h-16 rounded-2xl object-cover" alt={story.title} />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-foreground text-sm truncate">{story.title}</h4>
      </div>
    </div>
  );
}
