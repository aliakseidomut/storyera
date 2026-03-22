import { useEffect, useRef, useState } from 'react';

export default function Chat({ 
  story, 
  chatMessages, 
  isTyping, 
  choices = [],
  onBack, 
  onSendMessage,
  onChoiceSelect
}) {
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  useEffect(() => {
    // Фокус на поле ввода после загрузки
    if (inputRef.current && chatMessages.length > 0) {
      inputRef.current.focus();
    }
  }, [chatMessages.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-black">
      <div className="px-4 py-3 bg-black border-b border-stone-800 flex items-center gap-3 shadow-sm z-10">
        <button
          onClick={onBack}
          className="text-stone-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-white text-sm">{story?.title}</h3>
          <p className="text-xs text-stone-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>AI Active</span>
          </p>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-black"
      >
        <div className="max-w-xl mx-auto bg-stone-900 rounded-2xl shadow-sm border border-stone-800 p-5 md:p-6 space-y-4">
          <div className="w-full mb-2">
            <img
              src={story?.image}
              className="w-full max-h-56 object-cover rounded-xl shadow-sm border border-stone-800"
              alt={story?.title || 'Scene'}
            />
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-stone-100">
            {chatMessages
              .filter((msg) => msg.role !== 'user')
              .map((msg, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {msg.content}
                </p>
              ))}

            {isTyping && (
              <p className="text-xs text-stone-400 italic">
                The story is unfolding<span className="animate-pulse">...</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment gate temporarily disabled */}

      {/* Choice buttons */}
      {choices.length > 0 && !isTyping && (
        <div className="px-4 py-3 bg-black border-t border-stone-800 space-y-2">
          <p className="text-xs text-stone-400 mb-2 font-medium">Choose your response:</p>
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => onChoiceSelect(choice)}
                disabled={isTyping}
                className="w-full text-left px-4 py-3 bg-stone-950 hover:bg-brand/20 border border-stone-700 hover:border-brand rounded-xl text-sm font-medium text-stone-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 bg-black border-t border-stone-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={choices.length > 0 ? "Or type your own response..." : "Type your message or action..."}
            disabled={isTyping}
            className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-stone-600"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2 text-center">
          {choices.length > 0 
            ? "Select a choice above or type your own response"
            : "Continue the story by typing your actions or responses"}
        </p>
      </form>
    </div>
  );
}
