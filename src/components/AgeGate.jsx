export default function AgeGate({ ageConfirmed, setAgeConfirmed, onEnter }) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Adult Content Warning</h2>
        <p className="text-stone-400 mb-6">This application contains AI-generated stories that may include mature themes. Powered by kyarapu.com database.</p>
        <div className="flex items-center justify-center gap-2 mb-6">
          <input
            type="checkbox"
            id="age-confirm"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="w-5 h-5 text-orange-600 rounded focus:ring-red-500"
          />
          <label htmlFor="age-confirm" className="text-sm font-medium">I confirm I am 18 years or older</label>
        </div>
        <button
          onClick={onEnter}
          disabled={!ageConfirmed}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            ageConfirmed
              ? 'bg-red-700 text-white hover:bg-orange-700 cursor-pointer'
              : 'bg-stone-300 text-stone-400 cursor-not-allowed'
          }`}
        >
          Enter Application
        </button>
      </div>
    </div>
  );
}
