import { useState, useEffect } from 'react';
import { DatabaseService } from './services/DatabaseService.js';
import { aiService } from './services/aiService.js';

// Components
import CreateModal from './components/CreateModal.jsx';
import Header from './components/Header.jsx';
import Library from './components/Library.jsx';
import StoryDetail from './components/StoryDetail.jsx';
import Chat from './components/Chat.jsx';
import Auth from './components/Auth.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import BottomNav from './components/BottomNav.jsx';
import ContinueReading from './components/ContinueReading.jsx';
import Sidebar from './components/Sidebar.jsx';

/* ──────────────────────────────────────────────
   Helper: apply translations_json for given lang
   ────────────────────────────────────────────── */
function translateStory(story, lang) {
  if (!story) return story;
  if (lang === 'ru') return story; // default data is Russian
  const raw = story.translations_json;
  const translations = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
  const langData = translations?.[lang];
  if (!langData) return story;
  return {
    ...story,
    title: langData.title || story.title,
    description: langData.description || story.description,
    category: langData.category || story.category,
    characters: langData.characters || story.characters,
    protagonist: langData.protagonist ? { ...story.protagonist, ...langData.protagonist } : story.protagonist,
    plot: langData.plot ? { ...story.plot, ...langData.plot } : story.plot,
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState('library');
  const [currentStory, setCurrentStory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [naughtinessLevel, setNaughtinessLevel] = useState(0);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [stories, setStories] = useState([]);
  const [translatedStories, setTranslatedStories] = useState([]);
  // progress: { [storyId]: { [language]: progressObj } }
  const [progress, setProgress] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [completedStories, setCompletedStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [storyEnded, setStoryEnded] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('storyera_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [choicesCount, setChoicesCount] = useState(0);
  const [messageCounter, setMessageCounter] = useState(0);

  // System language detection + localStorage override
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('storyera_language');
      if (stored) return stored;
      // Detect browser language
      const browserLang = (navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase();
      return browserLang === 'ru' ? 'ru' : 'en';
    } catch {
      return 'en';
    }
  });

  // ──── Theme (dark/light) with persistence ────
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('storyera_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    try { localStorage.setItem('storyera_theme', theme); } catch { /* ignore */ }
  }, [theme]);

  // ──── Analytics: fire SPA pageviews on view/story/language changes ────
  useEffect(() => {
    try {
      const view = currentView;
      const storyPart = currentStory?.id ? `/story/${currentStory.id}` : '';
      const lang = (activeStoryLang || language) || 'en';
      const pagePath = `/${view}${storyPart}?lang=${lang}`;
      if (window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_path: pagePath
        });
      }
      if (window.ym) {
        const fullUrl = `${window.location.origin}${pagePath}`;
        window.ym(108368041, 'hit', fullUrl);
      }
    } catch {
      // no-op
    }
  }, [currentView, currentStory?.id, activeStoryLang, language]);

  /* ──── Load progress + bookmarks + completed when user changes ──── */
  useEffect(() => {
    if (currentUser?.id || currentUser?.email) {
      DatabaseService.getAllProgress(currentUser.id, currentUser.email).then(allProgress => {
        if (Array.isArray(allProgress)) {
          const progMap = {};
          allProgress.forEach(p => {
            const sid = String(p.story_id);
            if (!progMap[sid]) progMap[sid] = {};
            progMap[sid][p.language || 'ru'] = p;
          });
          setProgress(progMap);
        }
      }).catch(e => console.error('Failed to load all progress', e));

      DatabaseService.getAllBookmarks(currentUser.id, currentUser.email).then(allBookmarks => {
        if (Array.isArray(allBookmarks)) {
          const bookmarkMap = {};
          allBookmarks.forEach(b => { bookmarkMap[b.story_id] = b; });
          setBookmarks(bookmarkMap);
        }
      }).catch(e => console.error('Failed to load bookmarks', e));

      DatabaseService.getAllCompleted(currentUser.id, currentUser.email).then(list => {
        if (Array.isArray(list)) setCompletedStories(list);
      }).catch(e => console.error('Failed to load completed stories', e));
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem('storyera_language', language); } catch { /* ignore */ }
  }, [language]);

  /* ──── Translate stories when language or stories change ──── */
  useEffect(() => {
    if (!stories.length) { setTranslatedStories([]); return; }
    setTranslatedStories(stories.map(s => translateStory(s, language)));
  }, [stories, language]);

  const handleChoiceSelect = (choice) => { handleSendMessage(choice); };

  const [characterData, setCharacterData] = useState({
    name: 'Alex', gender: 'Male', age: '18-25', archetype: 'Survivor',
    traits: ['bold', 'mysterious'], flirtLevel: 50, boundariesLevel: 50
  });

  const initialStoryState = {
    trust: 50, attraction: 50, tension: 30, mystery: 70,
    control: 50, risk: 30, boundaries: 50, pressure: 30, emotional_stability: 50,
  };
  const [storyState, setStoryState] = useState(initialStoryState);

  const [currentChoices, setCurrentChoices] = useState([]);
  const [lastSceneSummary, setLastSceneSummary] = useState('');
  const [lastUserChoice, setLastUserChoice] = useState('');
  const [storySummary, setStorySummary] = useState('');
  const [lastScene, setLastScene] = useState('');
  const [currentChapterNum, setCurrentChapterNum] = useState(0);
  // Track the actual story language (may differ from UI language when continuing a story in another language)
  const [activeStoryLang, setActiveStoryLang] = useState(null);

  useEffect(() => { loadStories(); if (currentUser) fetchMe(); }, []);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/me', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser?.email })
      });
      const data = await res.json();
      if (data.id && currentUser && !currentUser.id) {
        const updatedUser = { ...currentUser, id: data.id };
        setCurrentUser(updatedUser);
        localStorage.setItem('storyera_user', JSON.stringify(updatedUser));
      }
    } catch (err) { console.error('Failed to fetch /api/me:', err); }
  };

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.getStories({});
      const parsedData = data.map(s => ({
        ...s,
        characters: typeof s.characters_json === 'string' ? JSON.parse(s.characters_json) : (s.characters_json || []),
        plot: typeof s.plot_json === 'string' ? JSON.parse(s.plot_json) : (s.plot_json || {}),
        protagonist: typeof s.protagonist_json === 'string' ? JSON.parse(s.protagonist_json) : (s.protagonist_json || {}),
        translations_json: typeof s.translations_json === 'string' ? (() => { try { return JSON.parse(s.translations_json); } catch { return {}; } })() : (s.translations_json || {})
      }));
      setStories(parsedData);
    } catch (error) {
      console.error('Failed to load stories:', error);
      setStories([]);
    }
    setLoading(false);
  };

  const goToLibrary = () => setCurrentView('library');
  const goToStoryDetail = async (story) => { setCurrentStory(story); setCurrentView('story-detail'); };

  /* ──── Restart only clears progress for CURRENT language ──── */
  const restartStory = async (story) => {
    const selectedStory = story || currentStory;
    if (!selectedStory || (!currentUser?.id && !currentUser?.email)) {
      startChat(selectedStory, { forceRestart: true });
      return;
    }
    try {
      await DatabaseService.clearProgress(currentUser.id, selectedStory.id, currentUser.email, language);
      setProgress(prev => {
        const next = { ...prev };
        if (next[selectedStory.id]) {
          const langMap = { ...next[selectedStory.id] };
          delete langMap[language];
          if (Object.keys(langMap).length === 0) delete next[selectedStory.id];
          else next[selectedStory.id] = langMap;
        }
        return next;
      });
    } catch (e) { console.error('Failed to clear progress', e); }
    startChat(selectedStory, { forceRestart: true });
  };

  const handleAuthSuccess = (user) => { setCurrentUser(user); setCurrentView('library'); };

  const handleLogout = () => {
    localStorage.removeItem('storyera_user');
    setCurrentUser(null);
    setCurrentView('landing');
    setCurrentStory(null);
    setChatMessages([]);
    setCurrentChoices([]);
    setProgress({});
    setBookmarks({});
    setCompletedStories([]);
    setStoryEnded(false);
  };

  const toggleBookmark = async (story) => {
    const targetStory = story || currentStory;
    if (!targetStory || (!currentUser?.id && !currentUser?.email)) return;
    try {
      const isSaved = !!bookmarks[targetStory.id];
      if (isSaved) {
        await DatabaseService.removeBookmark(currentUser.id, targetStory.id, currentUser.email);
        setBookmarks(prev => { const next = { ...prev }; delete next[targetStory.id]; return next; });
      } else {
        await DatabaseService.addBookmark(currentUser.id, targetStory.id, currentUser.email);
        setBookmarks(prev => ({ ...prev, [targetStory.id]: { story_id: targetStory.id } }));
      }
    } catch (e) { console.error('Failed to toggle bookmark', e); }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('storyera_language', newLang);
  };

  const handleAvatarChange = (newPicture) => {
    const updated = { ...currentUser, picture: newPicture };
    setCurrentUser(updated);
    localStorage.setItem('storyera_user', JSON.stringify(updated));
  };

  const persistProgress = async ({ storyId, messages, state, choices, sceneSummary, userChoice, storyLanguage, currentChoicesSnapshot, summarySnapshot, lastSceneSnapshot, chapterNum }) => {
    if ((!currentUser?.id && !currentUser?.email) || !storyId) return;
    try {
      const stateWithExtras = {
        ...(state || {}),
        current_choices: Array.isArray(currentChoicesSnapshot) ? currentChoicesSnapshot : [],
        story_summary: summarySnapshot ?? '',
        last_scene_full: lastSceneSnapshot ?? '',
        current_chapter_num: chapterNum ?? 0
      };
      await DatabaseService.saveProgress(currentUser.id, storyId, {
        chat_history: messages,
        story_state: stateWithExtras,
        choices_count: choices,
        last_scene_summary: sceneSummary,
        last_user_choice: userChoice,
        language: storyLanguage
      }, currentUser.email);
      setProgress(prev => ({
        ...prev,
        [storyId]: {
          ...(prev[storyId] || {}),
          [storyLanguage]: { story_id: storyId, last_scene_summary: sceneSummary, choices_count: choices, updated_at: new Date().toISOString(), language: storyLanguage }
        }
      }));
    } catch (e) { console.error('Failed to persist progress', e); }
  };

  const startChat = async (story, options = {}) => {
    setLoading(true);
    setStoryEnded(false);
    setReadOnlyMode(false);
    const { forceRestart = false, storyLanguage: langOverride } = options;
    // Allow overriding the language (e.g. from ContinueReading per-language entries)
    const effectiveLang = langOverride || language;
    // Always look up the raw (untranslated) story by ID, then translate to the effective language.
    // This avoids double-translation bugs when the UI language differs from the story language.
    const storyArg = story || currentStory;
    if (!storyArg) { setLoading(false); return; }
    const rawStory = stories.find(s => s.id === storyArg.id) || storyArg;
    const selectedStory = translateStory(rawStory, effectiveLang);
    setCurrentStory(selectedStory);

    let storyLanguage = effectiveLang;
    setActiveStoryLang(effectiveLang);
    if (!forceRestart && (currentUser?.id || currentUser?.email)) {
      try {
        const savedProgress = await DatabaseService.getProgress(currentUser.id, selectedStory.id, currentUser.email, effectiveLang);
        if (savedProgress) {
          storyLanguage = savedProgress.language || effectiveLang;
          setActiveStoryLang(storyLanguage);
          const parsedHistory = savedProgress.chat_history ? JSON.parse(savedProgress.chat_history) : [];
          const parsedState = savedProgress.story_state ? JSON.parse(savedProgress.story_state) : {};
          setChatMessages(Array.isArray(parsedHistory) ? parsedHistory : []);
          const restoredState = parsedState && Object.keys(parsedState).length ? parsedState : initialStoryState;
          setStoryState(restoredState);
          // Restore protagonist gender if saved previously
          if (restoredState?.gender) {
            setCharacterData(prev => ({ ...prev, gender: restoredState.gender }));
          }
          setChoicesCount(savedProgress.choices_count);
          setLastSceneSummary(savedProgress.last_scene_summary);
          setLastUserChoice(savedProgress.last_user_choice);
          setStorySummary(parsedState?.story_summary || '');
          setLastScene(parsedState?.last_scene_full || '');
          setCurrentChapterNum(parsedState?.current_chapter_num || 0);
          const restoredChoices = Array.isArray(parsedState?.current_choices) ? parsedState.current_choices : (storyLanguage === 'ru'
            ? ['Продолжить уверенно', 'Спросить прямо', 'Сменить тактику']
            : ['Continue boldly', 'Ask directly', 'Change strategy']);
          setCurrentChoices(restoredChoices);
          setCurrentView('chat');
          setLoading(false);
          return;
        }
      } catch (e) { console.error('Failed to load progress', e); }
    }

    setChatMessages([]);
    setCurrentChoices([]);
    setLastSceneSummary('');
    setLastUserChoice('');
    setStorySummary('');
    setLastScene('');
    setCurrentChapterNum(0);
    setChoicesCount(0);
    setMessageCounter(0);
    const baseState = { ...initialStoryState };
    if (selectedStory?.protagonist) {
      setCharacterData(selectedStory.protagonist);
      // Store protagonist gender in state for the AI prompt
      if (selectedStory.protagonist.gender) {
        baseState.gender = selectedStory.protagonist.gender;
      }
    }
    setStoryState(baseState);

    const openingMessages = selectedStory?.plot?.opening || [effectiveLang === 'ru' ? 'Добро пожаловать в историю.' : 'Welcome to the story.'];
    const starterChoices = selectedStory?.plot?.starter_choices || [effectiveLang === 'ru' ? 'Начать' : 'Start'];

    const introLabel = effectiveLang === 'ru' ? '*Введение*' : '*Introduction*';
    const seededMessages = [
      { role: 'ai', content: introLabel },
      ...openingMessages.map((line) => ({ role: 'ai', content: line })),
    ];
    const seededSummary = openingMessages[openingMessages.length - 1] || '';

    setChatMessages(seededMessages);
    setCurrentChoices(starterChoices);
    setLastSceneSummary(seededSummary);
    setLastUserChoice('');

    const seededScene = openingMessages.join('\n');
    setLastScene(seededScene);
    await persistProgress({ storyId: selectedStory.id, messages: seededMessages, state: baseState, choices: 0, sceneSummary: seededSummary, userChoice: '', storyLanguage, currentChoicesSnapshot: starterChoices, summarySnapshot: '', lastSceneSnapshot: seededScene, chapterNum: 0 });

    setLoading(false);
    setCurrentView('chat');
  };

  /* ──── Continue a story in a specific language (from My Books) ──── */
  const startChatWithLang = (story, lang) => {
    startChat(story, { storyLanguage: lang });
  };

  const handleSendMessage = async (message) => {
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setLastUserChoice(message);
    setCurrentChoices([]);
    setIsTyping(true);
    const newChoicesCount = choicesCount + 1;
    setChoicesCount(newChoicesCount);
    const newMessageCount = messageCounter + 1;
    setMessageCounter(newMessageCount);

    const effectiveLang = activeStoryLang || language;
    const response = await aiService.getAIResponse(message, {
      storyData: currentStory,
      characterData,
      storyState,
      storySummary,
      lastScene,
      language: effectiveLang,
      currentChapter: currentChapterNum
    });

    // If the AI returned an error, don't add anything to the chat — just show retry choices
    if (response.error) {
      setIsTyping(false);
      // Remove the user message we just added so the user can retry cleanly
      setChatMessages(prev => prev.slice(0, -1));
      setChoicesCount(choicesCount); // revert
      setMessageCounter(messageCounter); // revert
      setCurrentChoices(response.choices || []);
      return;
    }

    const sceneText = response.scene || response;
    const choices = response.choices || [];
    const isEnd = response.isEnd || false;
    const shortSummary = sceneText.substring(0, 200);

    // Update chapter tracking if the AI started a new chapter
    const newChapterNum = response.detectedChapter != null ? response.detectedChapter : currentChapterNum;
    if (newChapterNum !== currentChapterNum) setCurrentChapterNum(newChapterNum);

    setLastSceneSummary(shortSummary);
    setLastScene(sceneText);
    setIsTyping(false);

    const finalMessages = [...chatMessages, { role: 'user', content: message }, { role: 'ai', content: sceneText }];
    setChatMessages(prev => [...prev, { role: 'ai', content: sceneText }]);
    setCurrentChoices(choices);

    if (isEnd) {
      setStoryEnded(true);
    }

    // Generate an image every 10 choices — AFTER text is shown
    if (newChoicesCount % 10 === 0) {
      aiService.generateImage(`Scene: ${shortSummary}`).then(imageB64 => {
        if (imageB64) {
          setChatMessages(prev => [...prev, { role: 'ai', content: `data:image/png;base64,${imageB64}` }]);
        }
      }).catch(e => console.error('Image generation failed:', e));
    }

    const storyLang = effectiveLang;
    await persistProgress({ storyId: currentStory?.id, messages: finalMessages, state: storyState, choices: newChoicesCount, sceneSummary: shortSummary, userChoice: message, storyLanguage: storyLang, currentChoicesSnapshot: choices, summarySnapshot: storySummary, lastSceneSnapshot: sceneText, chapterNum: newChapterNum });

    // Background summary
    const prevSummary = storySummary;
    aiService.generateSummary(prevSummary, sceneText, message, effectiveLang).then(newSummary => {
      setStorySummary(newSummary);
      persistProgress({ storyId: currentStory?.id, messages: finalMessages, state: storyState, choices: newChoicesCount, sceneSummary: shortSummary, userChoice: message, storyLanguage: storyLang, currentChoicesSnapshot: choices, summarySnapshot: newSummary, lastSceneSnapshot: sceneText, chapterNum: newChapterNum });
    }).catch(e => console.error('Background summary failed:', e));
  };

  /* ──── Complete story: save to completed_stories, clear progress ──── */
  const handleStoryComplete = async () => {
    if (!currentStory || (!currentUser?.id && !currentUser?.email)) return;
    const storyLang = activeStoryLang || language;
    const baseTitle = currentStory.title || 'Story';
    // Determine version
    const existing = completedStories.filter(c => c.story_id === currentStory.id && c.language === storyLang);
    const nextVersion = existing.length + 1;
    const versionTitle = `${baseTitle} - ${nextVersion}`;

    try {
      const result = await DatabaseService.saveCompleted(
        currentUser.id, currentStory.id, storyLang, versionTitle,
        JSON.stringify(chatMessages), currentUser.email
      );
      // Add to local state
      setCompletedStories(prev => [{
        id: result?.id, story_id: currentStory.id, language: storyLang,
        version: nextVersion, title: versionTitle, completed_at: new Date().toISOString()
      }, ...prev]);

      // Clear in-progress
      await DatabaseService.clearProgress(currentUser.id, currentStory.id, currentUser.email, storyLang);
      setProgress(prev => {
        const next = { ...prev };
        if (next[currentStory.id]) {
          const langMap = { ...next[currentStory.id] };
          delete langMap[storyLang];
          if (Object.keys(langMap).length === 0) delete next[currentStory.id];
          else next[currentStory.id] = langMap;
        }
        return next;
      });
    } catch (e) { console.error('Failed to save completed story', e); }

    setStoryEnded(false);
    setCurrentView('continue');
  };

  /* ──── Read a completed story ──── */
  const handleReadCompleted = async (completedItem) => {
    if (!completedItem?.id) return;
    setLoading(true);
    try {
      const full = await DatabaseService.getCompletedById(currentUser.id, completedItem.id, currentUser.email);
      if (full?.chat_history) {
        const parsed = JSON.parse(full.chat_history);
        setChatMessages(Array.isArray(parsed) ? parsed : []);
        // Find the original story to display title/image
        const originalStory = stories.find(s => s.id === completedItem.story_id);
        const translated = originalStory ? translateStory(originalStory, completedItem.language || language) : null;
        setCurrentStory(translated || { id: completedItem.story_id, title: completedItem.title, image: '' });
        setCurrentChoices([]);
        setStoryEnded(true);
        setReadOnlyMode(true);
        setCurrentView('chat');
      }
    } catch (e) { console.error('Failed to load completed story', e); }
    setLoading(false);
  };

  const handleExitChat = async () => {
    if (!storyEnded && !readOnlyMode) {
      const exitLang = activeStoryLang || language;
      await persistProgress({ storyId: currentStory?.id, messages: chatMessages, state: storyState, choices: choicesCount, sceneSummary: lastSceneSummary, userChoice: lastUserChoice || '', storyLanguage: exitLang, currentChoicesSnapshot: currentChoices, summarySnapshot: storySummary, lastSceneSnapshot: lastScene, chapterNum: currentChapterNum });
    }
    setStoryEnded(false);
    setReadOnlyMode(false);
    setActiveStoryLang(null);
    setCurrentView('library');
  };

  const generateStory = async () => {
    let storyTitle = 'Custom Story';
    if (storyPrompt) storyTitle = await aiService.generateStoryTitle(storyPrompt, language);
    const newStory = await DatabaseService.createStory({ title: storyTitle, description: storyPrompt, category: 'Custom', image: 'https://images.unsplash.com/photo-1542224566-6e85f2d6771f?q=80&w=1000', characters: [], mature: naughtinessLevel > 50 });
    setCurrentStory(newStory);
    setShowCreateModal(false);
    setCurrentView('story-detail');
    startChat(newStory);
  };

  /* ──── Helper to check progress for current language ──── */
  const hasProgressForLang = (storyId) => !!progress[storyId]?.[language];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-muted text-foreground flex overflow-hidden">
      {currentUser && <Sidebar currentView={currentView} onViewChange={setCurrentView} language={language} />}

      <div className="flex-1 h-[100dvh] bg-card text-card-foreground relative flex flex-col shadow-2xl shadow-[hsl(var(--background)/0.45)]">
        {currentUser && (
          <div className="md:hidden flex-none z-20">
            <Header currentUser={currentUser} onLogoClick={goToLibrary} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative bg-background w-full">
          <div className={`w-full ${currentView === 'chat' ? 'h-full overflow-hidden' : 'min-h-full'}`}>
            {!currentUser && <Auth onAuthSuccess={handleAuthSuccess} language={language} />}
            {currentUser && currentView === 'library' && (
              <Library stories={translatedStories} loading={loading} onStoryClick={goToStoryDetail} language={language} bookmarks={bookmarks} onToggleBookmark={toggleBookmark} />
            )}
            {currentUser && currentView === 'continue' && (
              <ContinueReading
                stories={translatedStories}
                progress={progress}
                bookmarks={bookmarks}
                completedStories={completedStories}
                onStoryClick={goToStoryDetail}
                onContinueWithLang={startChatWithLang}
                onReadCompleted={handleReadCompleted}
                language={language}
              />
            )}
            {currentUser && currentView === 'story-detail' && (
              <StoryDetail
                story={currentStory ? translateStory(currentStory, language) : null}
                onBack={goToLibrary}
                onStartStory={startChat}
                onRestartStory={() => restartStory(currentStory)}
                onToggleBookmark={() => toggleBookmark(currentStory)}
                isBookmarked={!!bookmarks[currentStory?.id]}
                hasProgress={hasProgressForLang(currentStory?.id)}
                language={language}
              />
            )}
            {currentUser && currentView === 'chat' && (
              <Chat
                story={currentStory}
                chatMessages={chatMessages}
                isTyping={isTyping}
                choices={currentChoices}
                onBack={handleExitChat}
                onSendMessage={readOnlyMode ? undefined : handleSendMessage}
                onChoiceSelect={readOnlyMode ? undefined : handleChoiceSelect}
                language={activeStoryLang || language}
                storyEnded={storyEnded}
                onStoryComplete={readOnlyMode ? undefined : handleStoryComplete}
              />
            )}
            {currentUser && currentView === 'settings' && (
              <SettingsPage currentUser={currentUser} language={language} theme={theme} onThemeChange={setTheme} onLanguageChange={handleLanguageChange} onAvatarChange={handleAvatarChange} onLogout={handleLogout} />
            )}
          </div>
        </main>

        {currentUser && (
          <div className="md:hidden flex-none z-20">
            <BottomNav currentView={currentView} onViewChange={setCurrentView} language={language} />
          </div>
        )}

        {showCreateModal && (
          <CreateModal
            storyPrompt={storyPrompt}
            setStoryPrompt={setStoryPrompt}
            naughtinessLevel={naughtinessLevel}
            setNaughtinessLevel={setNaughtinessLevel}
            onGenerate={generateStory}
            onClose={() => setShowCreateModal(false)}
            language={language}
          />
        )}
      </div>
    </div>
  );
}
