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
  language = 'en'
}) {
  const isRu = language === 'ru';
  const t = {
    goPremium: isRu ? 'Премиум' : 'Go Premium',
    premiumDesc: isRu ? 'Откройте безлимитные истории и расширенные функции' : 'Unlock unlimited stories and advanced features',
    buyPremium: isRu ? 'Купить Premium' : 'Buy Premium',
    searchStories: isRu ? 'Поиск историй...' : 'Search stories...',
    stories: isRu ? 'Истории' : 'Stories',
    start: isRu ? 'Начать' : 'Start',
  };
  const categoryLabel = (category) => {
    if (!isRu) return category;
    const map = {
      All: 'Все',
      Romance: 'Романтика',
      Mystery: 'Мистика',
      Thriller: 'Триллер',
      Fantasy: 'Фэнтези',
      Drama: 'Драма',
      Horror: 'Ужасы',
      SciFi: 'Научная фантастика',
      Adventure: 'Приключения',
      Custom: 'Пользовательское',
    };
    return map[category] || category;
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-background text-foreground">
      {!isPremium && (
        <div className="px-5 pt-5">
          <div className="rounded-2xl p-5 border border-border/80 bg-gradient-to-br from-[hsl(var(--primary)/0.24)] via-card to-card shadow-lg shadow-[hsl(var(--background)/0.45)]">
            <h3 className="font-semibold text-lg text-foreground">{t.goPremium}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t.premiumDesc}</p>
            <button 
              onClick={onPayment}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-md shadow-[hsl(var(--primary)/0.35)] hover:opacity-90 hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.45)] transition"
            >
              {t.buyPremium}
            </button>
          </div>
        </div>
      )}
      <div className="px-5 py-4 bg-background/95 backdrop-blur-sm border-b border-border/70 sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder={t.searchStories}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/80 border border-border/80 rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <svg className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex px-5 pt-4 gap-2 overflow-x-auto sticky top-[73px] bg-background/95 backdrop-blur-sm z-10 pb-3">
        {CATEGORIES.filter(category => category !== 'Custom').map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === category || (category === 'All' && selectedCategory === 'All')
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            {categoryLabel(category)}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 space-y-6 pb-20 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-[0.14em]">{t.stories}</h3>
              {stories.map(story => {
                const full = story.description || '';
                const short =
                  full.length > 160 ? `${full.slice(0, 160).trimEnd()}.` : full;

                return (
                <div
                  key={story.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border/80 cursor-pointer hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.18)]"
                  onClick={() => onStoryClick(story)}
                >
                  <div className="h-40 bg-muted relative">
                    <img src={story.image} className="w-full h-full object-cover" alt={story.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background)/0.6)] via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-card/85 text-card-foreground px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-border/80 shadow-sm">{story.category}</span>
                    </div>
                    {story.mature && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-[10px] font-semibold">18+</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-lg text-card-foreground">{story.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{short}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-muted-foreground">⭐️ {story.rating}</span>
                      <span className="text-xs text-muted-foreground">👁 {story.plays.toLocaleString()}</span>
                    </div>
                    <button className="mt-4 w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-md shadow-[hsl(var(--primary)/0.32)] hover:opacity-90 hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.42)] transition">{t.start}</button>
                  </div>
                </div>
              )})}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
