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

export default function App() {
  const [currentView, setCurrentView] = useState('library');
  const [currentStory, setCurrentStory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [naughtinessLevel, setNaughtinessLevel] = useState(0);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [stories, setStories] = useState([]);
  const [translatedStories, setTranslatedStories] = useState([]);
  const [progress, setProgress] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [isPremium, setIsPremium] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('storyera_language') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    if (currentUser?.id) {
        DatabaseService.getAllProgress(currentUser.id, currentUser.email).then(allProgress => {
            if (Array.isArray(allProgress)) {
                const progMap = {};
                allProgress.forEach(p => {
                    progMap[p.story_id] = p;
                });
                setProgress(progMap);
            }
        }).catch(e => console.error('Failed to load all progress', e));

        DatabaseService.getAllBookmarks(currentUser.id, currentUser.email).then(allBookmarks => {
            if (Array.isArray(allBookmarks)) {
                const bookmarkMap = {};
                allBookmarks.forEach(b => {
                    bookmarkMap[b.story_id] = b;
                });
                setBookmarks(bookmarkMap);
            }
        }).catch(e => console.error('Failed to load bookmarks', e));
    }
  }, [currentUser]);
  
  const handlePayment = async () => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(language === 'ru' ? 'Не удалось запустить оплату.' : 'Could not initiate payment.');
      }
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const session_id = query.get('session_id');
    const email = query.get('email');

    if (session_id && email) {
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id, email })
      }).then(() => {
        setIsPremium(true);
        window.history.replaceState({}, document.title, "/");
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem('storyera_language', language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  useEffect(() => {
    const run = async () => {
      setTranslatedStories(stories);
    };
    run();
  }, [stories]);

  const handleChoiceSelect = (choice) => {
    handleSendMessage(choice);
  };

  const [characterData, setCharacterData] = useState({
    name: 'Alex',
    gender: 'Male',
    age: '18-25',
    archetype: 'Survivor',
    traits: ['bold', 'mysterious'],
    flirtLevel: 50,
    boundariesLevel: 50
  });

  const [storyState, setStoryState] = useState({
    trust: 50,
    attraction: 50,
    tension: 30,
    mystery: 70,
    control: 50,
    risk: 30,
    boundaries: 50,
    pressure: 30,
    emotional_stability: 50
  });

  const [currentChoices, setCurrentChoices] = useState([]);
  const [lastSceneSummary, setLastSceneSummary] = useState('');
  const [lastUserChoice, setLastUserChoice] = useState('');
  const initialStoryState = {
    trust: 50,
    attraction: 50,
    tension: 30,
    mystery: 70,
    control: 50,
    risk: 30,
    boundaries: 50,
    pressure: 30,
    emotional_stability: 50,
  };

  useEffect(() => {
    loadStories();
    if (currentUser) {
      checkPremiumStatus();
    }
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser?.email })
      });
      const data = await res.json();
      setIsPremium(!!data.isPremium);
      if (data.id && currentUser && !currentUser.id) {
          const updatedUser = { ...currentUser, id: data.id };
          setCurrentUser(updatedUser);
          localStorage.setItem('storyera_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to check premium:', err);
    }
  };

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.getStories({});
      const parsedData = data.map(s => ({
        ...s,
        characters: typeof s.characters_json === 'string' ? JSON.parse(s.characters_json) : (s.characters_json || []),
        plot: typeof s.plot_json === 'string' ? JSON.parse(s.plot_json) : (s.plot_json || {}),
        protagonist: typeof s.protagonist_json === 'string' ? JSON.parse(s.protagonist_json) : (s.protagonist_json || {})
      }));
      setStories(parsedData);
    } catch (error) {
      console.error('Failed to load stories:', error);
      setStories([]);
    }
    setLoading(false);
  };

  const goToLibrary = () => setCurrentView('library');
  const goToStoryDetail = async (story) => {
    setCurrentStory(story);
    setCurrentView('story-detail');
  };

  const restartStory = async (story) => {
    const selectedStory = story || currentStory;
    if (!selectedStory || (!currentUser?.id && !currentUser?.email)) {
      startChat(selectedStory, { forceRestart: true });
      return;
    }
    try {
      await DatabaseService.clearProgress(currentUser.id, selectedStory.id, currentUser.email);
      setProgress(prev => { const next = { ...prev }; delete next[selectedStory.id]; return next; });
    } catch (e) { console.error('Failed to clear progress', e); }
    startChat(selectedStory, { forceRestart: true });
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('library');
  };

  const handleLogout = () => {
    localStorage.removeItem('storyera_user');
    setCurrentUser(null);
    setCurrentView('landing');
    setCurrentStory(null);
    setChatMessages([]);
    setCurrentChoices([]);
    setProgress({});
    setBookmarks({});
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

  const handleSaveSettings = (updatedUser, selectedLanguage) => {
    setCurrentUser(updatedUser);
    setLanguage(selectedLanguage);
    localStorage.setItem('storyera_user', JSON.stringify(updatedUser));
    setCurrentView('library');
  };

  const persistProgress = async ({ storyId, messages, state, choices, sceneSummary, userChoice, storyLanguage }) => {
    if ((!currentUser?.id && !currentUser?.email) || !storyId) return;
    try {
      await DatabaseService.saveProgress(currentUser.id, storyId, { chat_history: messages, story_state: state, choices_count: choices, last_scene_summary: sceneSummary, last_user_choice: userChoice, language: storyLanguage }, currentUser.email);
      setProgress(prev => ({ ...prev, [storyId]: { story_id: storyId, last_scene_summary: sceneSummary, choices_count: choices, updated_at: new Date().toISOString(), language: storyLanguage } }));
    } catch (e) { console.error('Failed to persist progress', e); }
  };

  const startChat = async (story, options = {}) => {
    setLoading(true);
    const { forceRestart = false } = options;
    const selectedStory = story || currentStory;
    if (!selectedStory) { setLoading(false); return; }
    
    let storyLanguage = language;
    if (!forceRestart && (currentUser?.id || currentUser?.email)) {
      try {
        const savedProgress = await DatabaseService.getProgress(currentUser.id, selectedStory.id, currentUser.email);
        if (savedProgress) {
            if (savedProgress.language) storyLanguage = savedProgress.language;
            const parsedHistory = savedProgress.chat_history ? JSON.parse(savedProgress.chat_history) : [];
            const parsedState = savedProgress.story_state ? JSON.parse(savedProgress.story_state) : {};
            setChatMessages(Array.isArray(parsedHistory) ? parsedHistory : []);
            setStoryState(parsedState && Object.keys(parsedState).length ? parsedState : initialStoryState);
            setChoicesCount(savedProgress.choices_count);
            setLastSceneSummary(savedProgress.last_scene_summary);
            setLastUserChoice(savedProgress.last_user_choice);
            setCurrentChoices(storyLanguage === 'ru' ? ['Продолжить уверенно', 'Спросить прямо', 'Сменить тактику'] : ['Continue boldly', 'Ask directly', 'Change strategy']);
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
    setChoicesCount(0);
    setMessageCounter(0);
    setStoryState(initialStoryState);
    
    if (selectedStory?.protagonist) {
      setCharacterData(selectedStory.protagonist);
    }
    
    const openingMessages = selectedStory?.plot?.opening || ["Welcome to the story."];
    const starterChoices = selectedStory?.plot?.starter_choices || ["Start"];

    const seededMessages = openingMessages.map((line) => ({ role: 'ai', content: line }));
    const seededSummary = openingMessages[openingMessages.length - 1] || '';
    
    setChatMessages(seededMessages);
    setCurrentChoices(starterChoices);
    setLastSceneSummary(seededSummary);
    setLastUserChoice('');
    
    await persistProgress({ storyId: selectedStory.id, messages: seededMessages, state: initialStoryState, choices: 0, sceneSummary: seededSummary, userChoice: '', storyLanguage });

    setLoading(false);
    setCurrentView('chat');
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

    if (newMessageCount % 10 === 0) {
        const imageB64 = await aiService.generateImage(`Scene: ${lastSceneSummary}`);
        if (imageB64) {
            setChatMessages(prev => [...prev, { role: 'ai', content: `data:image/png;base64,${imageB64}` }]);
        }
    }

    const conversationHistory = chatMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    const response = await aiService.getAIResponse(message, { storyData: currentStory, characterData, storyState, lastSceneSummary, lastUserChoice: message, conversationHistory, language });
    
    const sceneText = response.scene || response;
    const choices = response.choices || [];
    
    setLastSceneSummary(sceneText.substring(0, 200)); 
    setIsTyping(false);
    const finalMessages = [...chatMessages, { role: 'user', content: message }, { role: 'ai', content: sceneText }];
    
    await DatabaseService.saveChatHistory(currentStory?.id, finalMessages);
    await persistProgress({ storyId: currentStory?.id, messages: finalMessages, state: storyState, choices: newChoicesCount, sceneSummary: sceneText.substring(0, 200), userChoice: message, storyLanguage: progress[currentStory?.id]?.language || language });
    
    setChatMessages(prev => [...prev, { role: 'ai', content: sceneText }]);
    setCurrentChoices(choices);
  };

  const handleExitChat = async () => {
    await persistProgress({ storyId: currentStory?.id, messages: chatMessages, state: storyState, choices: choicesCount, sceneSummary: lastSceneSummary, userChoice: lastUserChoice || '', storyLanguage: progress[currentStory?.id]?.language || language });
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

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-muted text-foreground flex overflow-hidden">
      {currentUser && <Sidebar currentView={currentView} onViewChange={setCurrentView} language={language} />}
      
      <div className="flex-1 h-[100dvh] bg-card text-card-foreground relative flex flex-col shadow-2xl shadow-[hsl(var(--background)/0.45)]">
        {currentUser && (
          <div className="md:hidden flex-none z-20">
            <Header currentUser={currentUser} isPremium={isPremium} onLogoClick={goToLibrary} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative bg-background w-full">
          <div className="w-full min-h-full">
            {!currentUser && <Auth onAuthSuccess={handleAuthSuccess} language={language} />}
            {currentUser && currentView === 'library' && (
              <Library stories={translatedStories} loading={loading} onStoryClick={goToStoryDetail} isPremium={isPremium} onPayment={handlePayment} language={language} progress={progress} bookmarks={bookmarks} onToggleBookmark={toggleBookmark} />
            )}
            {/* ... other views ... */}
            {currentUser && currentView === 'continue' && (
              <ContinueReading stories={translatedStories} progress={progress} bookmarks={bookmarks} onStoryClick={goToStoryDetail} language={language} />
            )}
            {currentUser && currentView === 'story-detail' && (
              <StoryDetail story={currentStory} onBack={goToLibrary} onStartStory={startChat} onRestartStory={() => restartStory(currentStory)} onToggleBookmark={() => toggleBookmark(currentStory)} isBookmarked={!!bookmarks[currentStory?.id]} hasProgress={!!progress[currentStory?.id]} language={language} />
            )}
            {currentUser && currentView === 'chat' && (
              <Chat story={currentStory} chatMessages={chatMessages} isTyping={isTyping} choices={currentChoices} choicesCount={choicesCount} isPremium={isPremium} onPayment={handlePayment} onBack={handleExitChat} onSendMessage={handleSendMessage} onChoiceSelect={handleChoiceSelect} language={language} />
            )}
            {currentUser && currentView === 'settings' && (
              <SettingsPage currentUser={currentUser} language={language} onSave={handleSaveSettings} onLogout={handleLogout} />
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
