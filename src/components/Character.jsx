export default function Character({ characterData, setCharacterData, onContinue, onBack }) {
  const selectGender = (gender) => {
    setCharacterData(prev => ({ ...prev, gender }));
  };

  const toggleTrait = (trait) => {
    setCharacterData(prev => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait]
    }));
  };

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-stone-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">Create Your Character</h2>
      </div>
      
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 group cursor-pointer">
          <img src="https://image.qwenlm.ai/public_source/b5a993e0-9295-487e-a8f3-21f4eba3a246/1c449c543-0576-45c4-b1c2-62e1d7b50841.png" className="w-full h-full object-cover" alt="Avatar" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold">Change</span>
          </div>
        </div>
        <span className="text-xs text-stone-400">Upload Avatar</span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Name</label>
          <input
            type="text"
            value={characterData.name}
            onChange={(e) => setCharacterData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-white border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Gender</label>
          <div className="flex gap-2">
            {['Male', 'Female', 'Other'].map(gender => (
              <button
                key={gender}
                onClick={() => selectGender(gender)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  characterData.gender === gender
                    ? 'bg-red-600 text-white shadow-md shadow-orange-200'
                    : 'bg-white border border-stone-800 text-stone-400 hover:bg-black'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Age Range</label>
            <select
              value={characterData.age}
              onChange={(e) => setCharacterData(prev => ({ ...prev, age: e.target.value }))}
              className="w-full bg-white border border-stone-800 rounded-xl px-3 py-3 text-sm focus:outline-none"
            >
              <option>18-25</option>
              <option>26-35</option>
              <option>36-50</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Archetype</label>
            <select
              value={characterData.archetype}
              onChange={(e) => setCharacterData(prev => ({ ...prev, archetype: e.target.value }))}
              className="w-full bg-white border border-stone-800 rounded-xl px-3 py-3 text-sm focus:outline-none"
            >
              <option>Survivor</option>
              <option>Hero</option>
              <option>Villain</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Personality Traits</label>
          <div className="grid grid-cols-2 gap-2">
            {['bold', 'mysterious', 'curious', 'romantic', 'sarcastic'].map(trait => (
              <label
                key={trait}
                className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                  characterData.traits.includes(trait)
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-stone-800 hover:border-orange-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={characterData.traits.includes(trait)}
                  onChange={() => toggleTrait(trait)}
                  className="text-orange-500 focus:ring-red-500 rounded"
                />
                <span className="text-sm capitalize">{trait}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">
            Flirt Level: {characterData.flirtLevel || 50}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={characterData.flirtLevel || 50}
            onChange={(e) => setCharacterData(prev => ({ ...prev, flirtLevel: parseInt(e.target.value) }))}
            className="w-full h-2 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>Reserved</span>
            <span>Bold</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">
            Boundaries Level: {characterData.boundariesLevel || 50}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={characterData.boundariesLevel || 50}
            onChange={(e) => setCharacterData(prev => ({ ...prev, boundariesLevel: parseInt(e.target.value) }))}
            className="w-full h-2 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>Open</span>
            <span>Guarded</span>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full mt-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-transform active:scale-95"
      >
        Continue
      </button>
    </div>
  );
}
