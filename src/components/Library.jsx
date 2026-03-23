import { CATEGORIES } from '../constants/modes.js';

export default function Library({ 
  stories, 
  loading, 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
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
    all: isRu ? 'Все' : 'All',
    mystery: isRu ? 'Детектив' : 'Mystery',
    fantasy: isRu ? 'Фэнтези' : 'Fantasy',
    romance: isRu ? 'Романтика' : 'Romance',
    thriller: isRu ? 'Триллер' : 'Thriller',
    custom: isRu ? 'Свое' : 'Custom',
    buyPremium: isRu ? 'Купить Premium' : 'Buy Premium',
    goPremium: isRu ? 'Premium' : 'Go Premium',
     unlock: isRu ? 'Открой безлимит' : 'Unlock unlimited stories',
     start: isRu ? 'Начать' : 'Start',
     continue: isRu ? 'Продолжить' : 'Continue'
  };

  const getCategoryName = (cat) => {
    switch(cat) {
        case 'All': return t.all;
        case 'Mystery': return t.mystery;
        case 'Fantasy': return t.fantasy;
        case 'Romance': return t.romance;
        case 'Thriller': return t.thriller;
        case 'Custom': return t.custom;
        default: return cat;
    }
  };
  
  return (
    <div className="h-full flex flex-col animate-fade-in bg-background text-foreground">
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
      
      <div className="px-6 py-4 bg-background/90 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
        <input
          type="text"
          placeholder={isRu ? "Поиск..." : "Search stories..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-input border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="flex px-6 pt-4 gap-2 overflow-x-auto pb-4">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition ${
              selectedCategory === category 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            {getCategoryName(category)}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6 pb-20">
        {loading ? (
          <div className="flex justify-center py-20 text-primary">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {stories.map(story => (
              <div 
                key={story.id} 
                className="overflow-hidden cursor-pointer hover:border-primary transition-all bg-card border border-border rounded-2xl"
                onClick={() => onStoryClick(story)}
              >
                <div className="h-32 relative overflow-hidden">
                  <img src={story.image} className="w-full h-full object-cover rounded-t-2xl" alt={story.title} />
                  <div className="absolute inset-0 bg-black/40" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark?.(story);
                    }}
                    aria-label={isRu ? 'Закладка' : 'Bookmark'}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full border backdrop-blur-md flex items-center justify-center transition ${
                      bookmarks[story.id]
                        ? 'bg-primary/90 text-primary-foreground border-primary/80'
                        : 'bg-card/80 text-card-foreground border-border/80 hover:bg-muted'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={bookmarks[story.id] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm text-foreground">{story.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{story.description}</p>
                   <button
                     className="mt-3 w-full py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
                     onClick={(e) => {
                       e.stopPropagation();
                       onStoryClick(story);
                     }}
                   >
                     {progress[story.id] ? t.continue : t.start}
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
