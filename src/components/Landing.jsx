import { STORY_DATABASE } from '../data/mockDatabase.js';

export default function Landing({ onStartStory, onStoryClick }) {
  const story = STORY_DATABASE.stories[0];
  
  return (
    <div className="p-6 space-y-8 pb-20 animate-fade-in">
      <div className="text-center space-y-4 pt-4">
        <h2 className="text-3xl font-bold leading-tight">Become the hero<br />of your own story</h2>
        <p className="text-stone-500 text-sm leading-relaxed">Interactive AI narratives where every choice changes the plot.</p>
        <button
          onClick={onStartStory}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold shadow-lg shadow-orange-500/30 transition-transform active:scale-95"
        >
          Start Your Story
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-stone-400 uppercase tracking-wider">Featured Story</h3>
        <div
          className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
          onClick={() => onStoryClick(story)}
        >
          <img
            src={story.image}
            className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Featured Story"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full w-fit mb-2">NEW</span>
            <h3 className="text-white text-2xl font-bold">{story.title}</h3>
            <p className="text-stone-200 text-sm mt-1 line-clamp-2">{story.description}</p>
            <button className="mt-4 w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
              Begin Story
            </button>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-orange-900">How it works</h3>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <p className="text-sm text-orange-800">Create your character</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <p className="text-sm text-orange-800">Enter the story</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <p className="text-sm text-orange-800">Shape the narrative</p>
          </div>
        </div>
      </div>
    </div>
  );
}
