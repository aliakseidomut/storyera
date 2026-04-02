import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Chat({ 
  story, 
  chatMessages, 
  isTyping, 
  choices = [],
  onBack, 
  onSendMessage,
  onChoiceSelect,
  language = 'en',
  storyEnded = false,
  onStoryComplete,
}) {
  const isRu = language === 'ru';
  const t = {
    aiActive: isRu ? 'AI активен' : 'AI Active',
    chooseResponse: isRu ? 'Выберите ответ:' : 'Choose your response:',
    placeholderDefault: isRu ? 'Введите сообщение...' : 'Type your message...',
    theEnd: isRu ? 'Конец' : 'The End',
    storyFinished: isRu ? 'История завершена' : 'Story finished',
    readOnly: isRu ? 'Вы просматриваете завершённую историю' : 'You are viewing a completed story',
    chapters: isRu ? 'Главы' : 'Chapters',
    downloadPdf: isRu ? 'Скачать PDF' : 'Download PDF',
  };

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const chapterBtnRef = useRef(null);
  const prevIsTypingRef = useRef(false);
  const scrollTimerRef = useRef(null);

  const [inputValue, setInputValue] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showChapterNav, setShowChapterNav] = useState(false);
  const [chapterNavPos, setChapterNavPos] = useState({ top: 0, right: 0 });

  /* ─── Auto-scroll: user choice → top of viewport after AI responds ─── */
  useEffect(() => {
    if (prevIsTypingRef.current && !isTyping) {
      // Typing just finished → scroll the user's last choice to the top
      const container = chatContainerRef.current;
      if (container) {
        let targetIdx = -1;
        for (let i = chatMessages.length - 1; i >= 0; i--) {
          if (chatMessages[i].role === 'user') { targetIdx = i; break; }
        }
        if (targetIdx >= 0) {
          requestAnimationFrame(() => {
            const el = container.querySelector(`[data-msg-idx="${targetIdx}"]`);
            if (el) {
              const containerRect = container.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              container.scrollTo({
                top: elRect.top - containerRect.top + container.scrollTop - 16,
                behavior: 'smooth'
              });
            }
          });
        }
      }
    } else if (isTyping) {
      // During typing, keep skeleton visible at the bottom
      const container = chatContainerRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    }
    prevIsTypingRef.current = isTyping;
  }, [isTyping, chatMessages]);

  /* ─── Extract chapter headings for navigation ─── */
  const chapters = useMemo(() => {
    const result = [];
    chatMessages.forEach((msg, idx) => {
      if (msg.role !== 'ai' || msg.content?.startsWith('data:image/')) return;
      const text = String(msg.content ?? '');
      const lines = text.split('\n');
      for (const line of lines) {
        let s = line.trim()
          .replace(/^\*+/, '').replace(/\*+$/, '')
          .replace(/^\[+/, '').replace(/\]+$/, '')
          .trim();
        if (/^(глава|chapter)\s/i.test(s) || /^введение$/i.test(s) || /^introduction$/i.test(s)) {
          result.push({ label: s, msgIdx: idx });
          break;
        }
      }
    });
    return result;
  }, [chatMessages]);

  const jumpToChapter = useCallback((msgIdx) => {
    setShowChapterNav(false);
    // Wait for dropdown to close, then scroll
    setTimeout(() => {
      const container = chatContainerRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-msg-idx="${msgIdx}"]`);
      if (!el) return;
      // Walk offsetParent chain to accumulate true offset from scroll container
      let offset = 0;
      let node = el;
      while (node && node !== container) {
        offset += node.offsetTop;
        node = node.offsetParent;
      }
      container.scrollTo({ top: Math.max(0, offset - 16), behavior: 'smooth' });
    }, 60);
  }, []);

  /* ─── Scroll direction → floating up/down buttons ─── */
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    let lastY = container.scrollTop;

    const handleScroll = () => {
      const currentY = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const atTop = currentY < 80;
      const atBottom = currentY > maxScroll - 80;

      if (currentY < lastY && !atTop) {
        setShowScrollUp(true);
        setShowScrollDown(false);
      } else if (currentY > lastY && !atBottom) {
        setShowScrollDown(true);
        setShowScrollUp(false);
      }
      if (atTop) setShowScrollUp(false);
      if (atBottom) setShowScrollDown(false);

      lastY = currentY;
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        setShowScrollUp(false);
        setShowScrollDown(false);
      }, 2500);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const scrollToTop = () => {
    chatContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setShowScrollUp(false);
  };
  const scrollToBottom = () => {
    const c = chatContainerRef.current;
    if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
    setShowScrollDown(false);
  };

  // Close fullscreen image on Esc
  useEffect(() => {
    if (!fullscreenImage) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setFullscreenImage(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenImage]);

  // Close chapter nav on outside click
  useEffect(() => {
    if (!showChapterNav) return;
    const close = () => setShowChapterNav(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showChapterNav]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  /* ─── Download story as PDF (direct download via jsPDF + html2canvas) ─── */
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);

    const title = story?.title || (isRu ? 'История' : 'Story');

    // Build clean HTML from chat messages (AI text only, skip images & user choices)
    let bodyHtml = '';
    let isFirstHeading = true;
    for (const msg of chatMessages) {
      if (msg.role !== 'ai') continue;
      if (msg.content?.startsWith('data:image/')) continue;
      const text = String(msg.content ?? '');
      const lines = text.split('\n');
      for (const line of lines) {
        const stripped = line.trim()
          .replace(/^\*+/, '').replace(/\*+$/, '')
          .replace(/^\[+/, '').replace(/\]+$/, '')
          .trim();
        const isHeading = /^(глава|chapter)\s/i.test(stripped) || /^введение$/i.test(stripped) || /^introduction$/i.test(stripped);
        if (isHeading) {
          const pb = isFirstHeading ? '' : 'page-break-before:always;';
          isFirstHeading = false;
          bodyHtml += `<h2 style="${pb}font-size:1.4em;margin:1.8em 0 0.7em;font-style:italic;text-align:center;">${stripped}</h2>\n`;
        } else if (line.trim()) {
          bodyHtml += `<p style="font-size:0.95em;line-height:1.7;margin:0 0 0.5em;text-indent:1.2em;text-align:justify;">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>\n`;
        }
      }
    }

    // Create off-screen container for rendering
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:40px 50px;background:#fff;font-family:Georgia,serif;color:#1a1a1a;';
    container.innerHTML = `<h1 style="text-align:center;font-size:1.6em;margin-bottom:1.5em;border-bottom:1px solid #ccc;padding-bottom:0.4em;">${title}</h1>${bodyHtml}`;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = 210; // A4 width mm
      const pdfH = 297; // A4 height mm
      const imgW = pdfW;
      const imgH = (canvas.height * pdfW) / canvas.width;

      let y = 0;
      pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
      let remaining = imgH - pdfH;

      while (remaining > 0) {
        pdf.addPage();
        y -= pdfH;
        pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
        remaining -= pdfH;
      }

      pdf.save(`${title}.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      document.body.removeChild(container);
      setPdfGenerating(false);
    }
  }, [chatMessages, story, isRu, pdfGenerating]);

  /* ─── Format scene text (same as before) ─── */
  const formatSceneText = (text) => {
    const raw = String(text ?? '')
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/[＊∗]/g, '*')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');
    const nodes = [];

    const parseHeadingLabel = (s) => {
      const trimmed = (s || '').trim();
      if (!trimmed) return null;
      const norm = trimmed.replace(/^\*\[/, '*').replace(/\]\*$/, '*');
      const star = norm.match(/^\*(.+)\*$/);
      const label = (star ? star[1] : norm).trim();
      if (!label) return null;
      const isIntro = /^введение$/i.test(label) || /^introduction$/i.test(label);
      const isChapter = /^глава(?![а-яё])/i.test(label) || /^chapter\b/i.test(label);
      if (!isIntro && !isChapter) return null;
      return { label, kind: isIntro ? 'intro' : 'chapter' };
    };

    const lines = raw.split('\n');
    let lastWasHeading = false;

    const unwrapHeadingLike = (line) => {
      let s = (line || '').trim();
      if (!s) return '';
      s = s.replace(/^\*\[/, '*').replace(/\]\*$/, '*');
      s = s.replace(/^\*+/, '').replace(/\*+$/, '').trim();
      s = s.replace(/^\[+/, '').replace(/\]+$/, '').trim();
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    };

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const unwrapped = unwrapHeadingLike(line);
      const heading = parseHeadingLabel(unwrapped);

      if (heading) {
        if (heading.kind === 'chapter' && nodes.length > 0 && !lastWasHeading) {
          nodes.push(<div key={`gap-${li}`} className="h-6" />);
        }
        nodes.push(
          <div
            key={`h-${li}`}
            className="block mt-12 mb-0 font-serif font-semibold italic text-lg md:text-xl text-foreground/90"
          >
            {heading.label}
          </div>,
        );
        lastWasHeading = true;
      } else {
        const outLine = lastWasHeading ? line.replace(/^[ \t]+/, '') : line;
        nodes.push(outLine);
        lastWasHeading = false;
      }
      if (li !== lines.length - 1) nodes.push('\n');
    }
    return nodes;
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-background text-foreground overflow-hidden">
      {/* ─── Chapter navigation dropdown (fixed, avoids overflow clip) ─── */}
      {showChapterNav && chapters.length > 0 && (
        <div
          className="fixed z-50 w-64 max-h-72 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl py-1"
          style={{ top: chapterNavPos.top, right: chapterNavPos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.chapters}</p>
          {chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => jumpToChapter(ch.msgIdx)}
              className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-muted transition truncate"
            >
              {ch.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Fullscreen image overlay ─── */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="button" tabIndex={0}
          onClick={() => setFullscreenImage(null)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFullscreenImage(null); }}
        >
          <img src={fullscreenImage} alt="Scene" className="w-full h-full max-w-[96vw] max-h-[92vh] object-contain rounded-xl border border-white/10 shadow-2xl" />
        </div>
      )}

      {/* ─── Header bar ─── */}
      <div className="px-4 py-3 bg-background border-b border-border flex items-center gap-3 z-10 flex-none">
        <button onClick={onBack} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm truncate">{story?.title}</h3>
        </div>

        {/* PDF download button */}
        <button
          onClick={handleDownloadPdf}
          disabled={pdfGenerating}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          title={t.downloadPdf}
        >
          {pdfGenerating ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
            </svg>
          )}
        </button>

        {/* Chapter navigation button */}
        {chapters.length > 0 && (
          <button
            ref={chapterBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              const rect = chapterBtnRef.current?.getBoundingClientRect();
              if (rect) setChapterNavPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
              setShowChapterNav(prev => !prev);
            }}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title={t.chapters}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        )}
      </div>

      {/* ─── Chat body ─── */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 bg-background relative">
        <div className="w-full mx-auto bg-card border border-border p-4 md:p-8 space-y-6 rounded-2xl shadow-lg">
          <img
            src={story?.image}
            className="w-full max-h-96 object-cover rounded-2xl border border-border"
            alt={story?.title || 'Scene'}
          />
          <div className="space-y-2 text-base leading-relaxed text-foreground">
            {chatMessages.map((msg, idx) => (
              <div key={idx} data-msg-idx={idx}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-white font-medium drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                    {msg.content}
                  </p>
                ) : msg.content.startsWith('data:image/') ? (
                  <img
                    src={msg.content}
                    alt="Scene"
                    role="button" tabIndex={0}
                    onClick={() => setFullscreenImage(msg.content)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFullscreenImage(msg.content); }}
                    className="block w-full max-w-none max-h-[70vh] object-contain rounded-xl border border-border my-2 cursor-zoom-in"
                  />
                ) : (
                  <div className="whitespace-pre-wrap">
                    {formatSceneText(msg.content)}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-4/5" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            )}
          </div>
        </div>

        {/* End button */}
        {storyEnded && onStoryComplete && choices.length === 0 && !isTyping && (
          <div className="w-full mx-auto mt-8 space-y-3 pb-4 text-center">
            <p className="text-sm text-muted-foreground mb-4 font-medium italic">{t.storyFinished}</p>
            <button
              onClick={onStoryComplete}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:opacity-90 transition shadow-lg shadow-[hsl(var(--primary)/0.38)]"
            >
              {t.theEnd}
            </button>
          </div>
        )}

        {/* Read-only banner */}
        {storyEnded && !onStoryComplete && (
          <div className="w-full mx-auto mt-8 pb-4 text-center">
            <p className="text-sm text-muted-foreground italic">{t.readOnly}</p>
          </div>
        )}

        {/* Choice buttons */}
        {choices.length > 0 && !isTyping && !storyEnded && (
          <div className="w-full mx-auto mt-8 space-y-3 pb-4">
            <p className="text-sm text-muted-foreground mb-2 font-medium">{t.chooseResponse}</p>
            <div className="flex flex-row gap-3 flex-wrap">
              {choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => onChoiceSelect(choice)}
                  disabled={isTyping}
                  className="flex-1 min-w-[200px] text-left px-5 py-4 bg-card border border-border rounded-2xl text-sm font-medium text-foreground hover:border-primary transition-all disabled:opacity-50"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input form */}
        {!storyEnded && (
          <form onSubmit={handleSubmit} className="w-full mx-auto mt-8 p-0 pb-8">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.placeholderDefault}
                disabled={isTyping}
                className="flex-1 bg-input border border-border rounded-2xl px-5 py-4 text-base text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        )}

      </div>

      {/* ─── Floating scroll buttons (outside scroll container for reliable fixed positioning) ─── */}
      {showScrollUp && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-8 right-8 z-40 w-8 h-8 rounded-full bg-foreground/10 backdrop-blur-sm border border-foreground/5 flex items-center justify-center text-foreground/30 hover:text-foreground/50 hover:bg-foreground/15 transition-all"
          aria-label="Scroll to top"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 md:bottom-8 right-8 z-40 w-8 h-8 rounded-full bg-foreground/10 backdrop-blur-sm border border-foreground/5 flex items-center justify-center text-foreground/30 hover:text-foreground/50 hover:bg-foreground/15 transition-all"
          aria-label="Scroll to bottom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
