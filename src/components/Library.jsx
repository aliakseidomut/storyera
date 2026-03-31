export default function Library({ 
  stories, 
  loading, 
  onStoryClick,
  isPremium,
  onPayment,
  language,
  progress = {},
  bookmarks = {},
  onToggleBookmark,
}) {
  const isRu = language === 'ru';
  
  const t = {
    buyPremium: isRu ? 'Купить Premium' : 'Buy Premium',
    goPremium: isRu ? 'Premium' : 'Go Premium',
    unlock: isRu ? 'Открой безлимит' : 'Unlock unlimited stories',
  };
  
  return (
    <div className="min-h-full flex flex-col animate-fade-in bg-background text-foreground">
      {!isPremium && (
        <div className="px-6 pt-6">
          <div className="bg-primary text-primary-foreground p-5 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg">{t.goPremium}</h3>
            <p className="text-xs opacity-90 mb-4">{t.unlock}</p>
            <button 
              className="w-full py-2 bg-background text-foreground rounded-2xl text-sm font-bold shadow-md transition-colors"
              onClick={onPayment}
            >
              {t.buyPremium}
            </button>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6 pb-20">
        {loading ? (
          <div className="flex justify-center py-20 text-primary">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.filter(Boolean).map(story => (
              <div 
                key={story.id} 
                className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border border-border hover:scale-[1.03] hover:shadow-[0_0_12px_2px_rgba(239,68,68,0.15)]"
                onClick={() => onStoryClick(story)}
              >
                {/* Full image */}
                <img src={story.image} className="absolute inset-0 w-full h-full object-cover" alt={story.title} />
                
                {/* Gradient overlay for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Bookmark Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark?.(story);
                    }}
                    aria-label={isRu ? 'Закладка' : 'Bookmark'}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition ${
                        bookmarks[story.id]
                        ? 'bg-primary/90 text-primary-foreground border-primary/80'
                        : 'bg-black/30 text-white border-white/20 hover:bg-black/50'
                    }`}
                >
                    <svg className="w-5 h-5" fill={bookmarks[story.id] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                    </svg>
                </button>

                {/* Language Tag */}
                {progress[story.id]?.language && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 text-[10px] text-white rounded-md backdrop-blur-sm">
                        {progress[story.id].language.toUpperCase()}
                    </div>
                )}

                {/* Content at bottom */}
                <div className="absolute bottom-3 left-0 right-0 p-5 text-white text-center">
                    <h4 className="font-bold text-lg leading-tight">{story.title}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
