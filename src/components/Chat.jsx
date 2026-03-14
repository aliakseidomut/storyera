import { useEffect, useRef, useState } from 'react';

export default function Chat({ 
  story, 
  chatMessages, 
  isTyping, 
  onBack, 
  onSendMessage 
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
    <div className="h-full flex flex-col animate-fade-in bg-stone-50">
      <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center gap-3 shadow-sm z-10">
        <button
          onClick={onBack}
          className="text-stone-400 hover:text-stone-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-stone-800 text-sm">{story?.title}</h3>
          <p className="text-xs text-stone-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>AI Active</span>
          </p>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-100/50"
      >
        <div className="flex justify-center my-4">
          <img
            src={story?.image}
            className="w-full max-w-xs rounded-xl shadow-md border border-stone-200"
            alt="Scene"
          />
        </div>
        
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              {msg.role === 'user' ? 'Me' : 'AI'}
            </div>
            <div className={`p-3 rounded-2xl shadow-sm text-sm max-w-[80%] ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-tr-none'
                : 'bg-white text-stone-700 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-stone-500">AI</div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-stone-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message or action..."
            disabled={isTyping}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-2 text-center">
          Continue the story by typing your actions or responses
        </p>
      </form>
    </div>
  );
}
