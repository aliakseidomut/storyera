export default function ContinueReading({ stories, progress, bookmarks = {}, onStoryClick, language }) {
  const isRu = language === 'ru';
  const t = {
      title: isRu ? 'Мои книги' : 'My Books',
      noStories: isRu ? 'Пока нет начатых или добавленных книг.' : 'No started or bookmarked books yet.',
      started: isRu ? 'Начата' : 'Started',
      bookmarked: isRu ? 'В закладках' : 'Bookmarked',
  };

  const myBooks = stories.filter((s) => progress[s.id] || bookmarks[s.id]);
  
  return (
    <div className="p-6 space-y-6 pb-20 animate-fade-in bg-background min-h-screen text-foreground">
      <h2 className="text-2xl font-bold mb-6 text-foreground uppercase tracking-wider">{t.title}</h2>
      {myBooks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground italic">{t.noStories}</div>
      ) : (
        myBooks.map(story => (
          <div
            key={story.id}
            className="bg-card rounded-2xl p-4 flex gap-4 cursor-pointer hover:border-primary border border-border transition shadow-sm"
            onClick={() => onStoryClick(story)}
          >
            <img src={story.image} className="w-16 h-16 rounded-2xl object-cover" alt={story.title} />
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-sm">{story.title}</h4>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                {progress[story.id]?.last_scene_summary || story.description}
              </p>
              <div className="mt-2 flex gap-2 text-[10px]">
                {progress[story.id] && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">{t.started}</span>
                )}
                {bookmarks[story.id] && (
                  <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">{t.bookmarked}</span>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
