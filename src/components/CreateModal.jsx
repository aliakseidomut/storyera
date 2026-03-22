export default function CreateModal({ 
  storyPrompt, 
  setStoryPrompt, 
  naughtinessLevel, 
  setNaughtinessLevel, 
  onGenerate, 
  onClose,
  language = 'en'
}) {
  const isRu = language === 'ru';
  const t = {
    title: isRu ? 'Создать новую историю' : 'Create New Story',
    storyPrompt: isRu ? 'Промпт истории' : 'Story Prompt',
    promptPlaceholder: isRu ? 'Опишите идею истории (например: детектив в киберпанк-городе...)' : 'Describe your story idea (e.g., A cyberpunk detective finds a clue...)',
    naughtiness: isRu ? 'Уровень откровенности' : 'Naughtiness Level',
    naughtinessHint: isRu ? 'Влияет на степень откровенности генерируемого контента.' : 'Adjusts the maturity of the generated content.',
    generate: isRu ? 'Сгенерировать и сохранить' : 'Generate & Save to Database',
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-2xl w-full max-w-md p-6 border border-border/80 shadow-2xl shadow-[hsl(var(--background)/0.55)] animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold tracking-tight mb-4">{t.title}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{t.storyPrompt}</label>
            <textarea
              value={storyPrompt}
              onChange={(e) => setStoryPrompt(e.target.value)}
              className="w-full bg-muted/80 border border-border/80 rounded-xl p-3 text-sm h-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder={t.promptPlaceholder}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">{t.naughtiness}</label>
              <span className="text-xs font-semibold text-foreground">{naughtinessLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={naughtinessLevel}
              onChange={(e) => setNaughtinessLevel(Number(e.target.value))}
              className="w-full accent-primary"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${naughtinessLevel}%, hsl(var(--muted)) ${naughtinessLevel}%, hsl(var(--muted)) 100%)`
              }}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{t.naughtinessHint}</p>
          </div>

          <div className="pt-2">
            <button
              onClick={onGenerate}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-[hsl(var(--primary)/0.36)] hover:opacity-90 hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.46)] transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t.generate}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
