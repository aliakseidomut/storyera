export default function StoryDetail({ story, onBack, onStartStory, language = 'en' }) {
  const isRu = language === 'ru';
  const t = {
    characters: isRu ? 'Персонажи' : 'Characters',
    startStory: isRu ? 'Начать историю' : 'Start Story',
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-background text-foreground">
      <div className="relative h-64">
        <img src={story?.image} className="w-full h-full object-cover" alt={story?.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background)/0.9)] via-[hsl(var(--background)/0.35)] to-transparent pointer-events-none" />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-9 h-9 bg-card/80 backdrop-blur-md rounded-full flex items-center justify-center text-card-foreground border border-border/80 hover:bg-muted z-10 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <div className="px-5 -mt-10 relative z-10 flex-1 overflow-y-auto pb-20">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{story?.title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">{story?.description}</p>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="bg-muted px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-border">{story?.category}</span>
          <span className="text-xs text-muted-foreground">⭐️ {story?.rating}</span>
          <span className="text-xs text-muted-foreground">👁 {story?.plays?.toLocaleString()}</span>
          {story?.mature && (
            <span className="bg-primary px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground">18+</span>
          )}
        </div>
        
        <div className="border-t border-border/70 py-4">
          <h3 className="font-semibold text-foreground mb-4">{t.characters}</h3>
          <div className="space-y-4">
            {story?.characters?.map((char, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted transition">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground border border-border">
                  {char.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{char.name}</p>
                  <p className="text-xs text-muted-foreground">{char.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStartStory}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold mt-4 hover:opacity-90 transition shadow-lg shadow-[hsl(var(--primary)/0.38)] hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.5)]"
        >
          {t.startStory}
        </button>
      </div>
    </div>
  );
}
