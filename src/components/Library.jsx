import { CATEGORIES } from '../constants/modes.js';

export default function Library({ 
  stories, 
  loading, 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
  onStoryClick, 
  onCreateStory 
}) {
  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="px-6 py-4 bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-100 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <svg className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex px-6 pt-4 gap-4 overflow-x-auto sticky top-[73px] bg-stone-50 z-10 pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => {
              if (category === 'Custom') {
                onCreateStory();
              } else {
                setSelectedCategory(category);
              }
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              selectedCategory === category || (category === 'All' && selectedCategory === 'All')
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-8 pb-20 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-stone-400 uppercase tracking-wider">From Database</h3>
              {stories.map(story => (
                <div
                  key={story.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => onStoryClick(story)}
                >
                  <div className="h-40 bg-stone-200 relative">
                    <img src={story.image} className="w-full h-full object-cover" alt={story.title} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">{story.category}</span>
                    </div>
                    {story.mature && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-[10px] font-bold">18+</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-lg">{story.title}</h4>
                    <p className="text-sm text-stone-500 mt-1">{story.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-stone-400">⭐️ {story.rating}</span>
                      <span className="text-xs text-stone-400">👁 {story.plays.toLocaleString()}</span>
                    </div>
                    <button className="mt-3 w-full py-2 bg-stone-900 text-white rounded-lg text-sm font-bold">Start</button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer"
              onClick={onCreateStory}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Create Custom Story</h3>
                  <p className="text-orange-100 text-xs mt-1">Generate unique scenarios with AI</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div className="bg-white h-1.5 rounded-full w-3/4" />
              </div>
              <p className="text-[10px] text-orange-100 mt-2 text-right">Beta Access</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
