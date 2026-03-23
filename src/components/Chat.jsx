import { useEffect, useRef, useState } from 'react';

export default function Chat({ 
  story, 
  chatMessages, 
  isTyping, 
  choices = [],
  choicesCount,
  isPremium,
  onPayment,
  onBack, 
  onSendMessage,
  onChoiceSelect,
  language = 'en'
}) {
  const isRu = language === 'ru';
  const t = {
    aiActive: isRu ? 'AI активен' : 'AI Active',
    unfolding: isRu ? 'История продолжается' : 'The story is unfolding',
    unlockPremium: isRu ? 'Открой Premium за $9.90' : 'Unlock Premium for $9.90',
    buyPremium: isRu ? 'Купить Premium' : 'Buy Premium',
    chooseResponse: isRu ? 'Выберите ответ:' : 'Choose your response:',
    placeholderDefault: isRu ? 'Введите сообщение...' : 'Type your message...',
  };
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  const isLocked = choicesCount >= 3 && !isPremium;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-background text-foreground">
      <div className="px-4 py-3 bg-background border-b border-border flex items-center gap-3 z-10">
        <button onClick={onBack} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-foreground text-sm">{story?.title}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{t.aiActive}</span>
          </p>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="max-w-xl mx-auto bg-card border border-border p-5 md:p-6 space-y-4 rounded-2xl shadow-lg">
          <img
            src={story?.image}
            className="w-full max-h-56 object-cover rounded-2xl border border-border"
            alt={story?.title || 'Scene'}
          />
          <div className="space-y-3 text-sm leading-relaxed text-foreground">
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-primary font-medium">
                    {msg.content}
                  </p>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            ))}
            {isTyping && (
              <p className="text-xs text-muted-foreground italic">
                {t.unfolding}<span className="animate-pulse">...</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {isLocked && (
          <div className="px-4 py-3 bg-primary text-primary-foreground flex items-center justify-between shadow-lg">
            <span className="text-sm font-semibold">{t.unlockPremium}</span>
            <button onClick={onPayment} className="px-4 py-2 bg-card text-foreground rounded-full text-xs font-bold hover:bg-muted transition-colors">
              {t.buyPremium}
            </button>
          </div>
      )}

      {!isLocked && choices.length > 0 && !isTyping && (
        <div className="px-4 py-3 bg-background border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground mb-2 font-medium">{t.chooseResponse}</p>
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => onChoiceSelect(choice)}
                disabled={isTyping}
                className="w-full text-left px-4 py-4 bg-card border border-border rounded-2xl text-sm font-medium text-foreground hover:border-primary transition-all disabled:opacity-50"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLocked && (
        <form onSubmit={handleSubmit} className="p-4 bg-background border-t border-border">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.placeholderDefault}
              disabled={isTyping}
              className="flex-1 bg-input border border-border rounded-2xl px-4 py-4 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping}
              className="px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
