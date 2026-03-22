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
  language
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
    unlock: isRu ? 'Открой безлимит' : 'Unlock unlimited stories'
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
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm text-foreground">{story.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{story.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
