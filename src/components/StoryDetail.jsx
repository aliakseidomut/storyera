export default function StoryDetail({ story, onBack, onStartStory }) {
  return (
    <div className="h-full flex flex-col animate-fade-in bg-white">
      <div className="relative h-64">
        <img src={story?.image} className="w-full h-full object-cover" alt={story?.title} />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>
      
      <div className="px-6 -mt-10 relative z-10 flex-1 overflow-y-auto pb-20">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">{story?.title}</h1>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">{story?.description}</p>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="bg-stone-100 px-3 py-1 rounded-full text-xs font-bold text-stone-600">{story?.category}</span>
          <span className="text-xs text-stone-400">⭐️ {story?.rating}</span>
          <span className="text-xs text-stone-400">👁 {story?.plays?.toLocaleString()}</span>
          {story?.mature && (
            <span className="bg-red-100 px-3 py-1 rounded-full text-xs font-bold text-red-600">18+</span>
          )}
        </div>
        
        <div className="border-t border-stone-100 py-4">
          <h3 className="font-bold text-stone-800 mb-4">Characters</h3>
          <div className="space-y-4">
            {story?.characters?.map((char, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500">
                  {char.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm">{char.name}</p>
                  <p className="text-xs text-stone-400">{char.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStartStory}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 mt-4"
        >
          Start Story
        </button>
      </div>
    </div>
  );
}
