export default function ApiModal({ apiKey, onSave, onUseDemo }) {
  const handleSave = () => {
    const input = document.getElementById('hf-api-key-input');
    if (input && input.value.trim()) {
      onSave(input.value.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <h2 className="text-xl font-bold mb-4">AI Configuration</h2>
        <p className="text-sm text-stone-500 mb-4">
          Enter your Hugging Face API key to use Gemini AI for story generation. Database powered by kyarapu.com
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Hugging Face API Key</label>
            <input
              type="password"
              id="hf-api-key-input"
              defaultValue={apiKey}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx or reloadKey"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500"
            />
            <p className="text-xs text-stone-400 mt-1">Using Gemini 3 Flash Preview model</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">
              Save Key
            </button>
            <button onClick={onUseDemo} className="flex-1 py-3 bg-stone-200 text-stone-700 rounded-xl font-semibold">
              Demo Mode
            </button>
          </div>
          
          <p className="text-xs text-stone-400 text-center">Demo mode uses pre-written responses. For full AI, add your API key.</p>
        </div>
      </div>
    </div>
  );
}
