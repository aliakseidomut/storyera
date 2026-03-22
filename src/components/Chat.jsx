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
    placeholderWithChoices: isRu ? 'Или введите свой вариант...' : 'Or type your own response...',
    placeholderDefault: isRu ? 'Введите сообщение или действие...' : 'Type your message or action...',
    hintWithChoices: isRu ? 'Выберите вариант выше или введите свой ответ' : 'Select a choice above or type your own response',
    hintDefault: isRu ? 'Продолжите историю, описав действие или реплику' : 'Continue the story by typing your actions or responses',
  };
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
    <div className="h-full flex flex-col animate-fade-in bg-background text-foreground">
      <div className="px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/70 flex items-center gap-3 z-10">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">{story?.title}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{t.aiActive}</span>
          </p>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-background"
      >
        <div className="max-w-xl mx-auto bg-card text-card-foreground rounded-2xl border border-border/80 p-5 md:p-6 space-y-4 shadow-lg shadow-[hsl(var(--background)/0.45)]">
          <div className="w-full mb-2">
            <img
              src={story?.image}
              className="w-full max-h-56 object-cover rounded-xl border border-border"
              alt={story?.title || 'Scene'}
            />
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-card-foreground">
            {chatMessages
              .filter((msg) => msg.role !== 'user')
              .map((msg, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {msg.content}
                </p>
              ))}

            {isTyping && (
              <p className="text-xs text-muted-foreground italic">
                {t.unfolding}<span className="animate-pulse">...</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {choicesCount >= 3 && !isPremium && (
          <div className="px-4 py-3 bg-primary text-primary-foreground flex items-center justify-between shadow-lg shadow-[hsl(var(--primary)/0.35)]">
            <span className="text-sm font-semibold">{t.unlockPremium}</span>
            <button onClick={onPayment} className="px-4 py-1.5 bg-card text-card-foreground border border-border/80 rounded-full text-xs font-semibold hover:bg-muted transition-colors">
              {t.buyPremium}
            </button>
          </div>
      )}

      {/* Choice buttons */}
      {choices.length > 0 && !isTyping && (
        <div className="px-4 py-3 bg-background border-t border-border/70 space-y-2">
          <p className="text-xs text-muted-foreground mb-2 font-medium">{t.chooseResponse}</p>
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => onChoiceSelect(choice)}
                disabled={isTyping}
                className="w-full text-left px-4 py-3 bg-primary text-primary-foreground border border-primary/40 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 hover:shadow-md hover:shadow-[hsl(var(--primary)/0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 bg-background border-t border-border/70">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={choices.length > 0 ? t.placeholderWithChoices : t.placeholderDefault}
            disabled={isTyping}
            className="flex-1 bg-muted/80 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-[hsl(var(--primary)/0.34)] hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.44)] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {choices.length > 0 
            ? t.hintWithChoices
            : t.hintDefault}
        </p>
      </form>
    </div>
  );
}
