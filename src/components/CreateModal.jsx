export default function CreateModal({ 
  storyPrompt, 
  setStoryPrompt, 
  naughtinessLevel, 
  setNaughtinessLevel, 
  onGenerate, 
  onClose 
}) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold mb-4">Create New Story</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Story Prompt</label>
            <textarea
              value={storyPrompt}
              onChange={(e) => setStoryPrompt(e.target.value)}
              className="w-full bg-black border border-stone-800 rounded-xl p-3 text-sm h-24 focus:outline-none focus:border-red-500"
              placeholder="Describe your story idea (e.g., A cyberpunk detective finds a clue...)"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-stone-400 uppercase">Naughtiness Level</label>
              <span className="text-xs font-bold text-orange-600">{naughtinessLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={naughtinessLevel}
              onChange={(e) => setNaughtinessLevel(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${naughtinessLevel}%, #e7e5e4 ${naughtinessLevel}%, #e7e5e4 100%)`
              }}
            />
            <p className="text-[10px] text-stone-400 mt-1">Adjusts the maturity of the generated content.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={onGenerate}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate & Save to Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
