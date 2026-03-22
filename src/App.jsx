import { useState, useEffect } from 'react';
import { DatabaseService } from './services/DatabaseService.js';
import { aiService } from './services/aiService.js';
import { STORY_DATABASE } from './data/mockDatabase.js';

// Components
import CreateModal from './components/CreateModal.jsx';
import Header from './components/Header.jsx';
import Library from './components/Library.jsx';
import StoryDetail from './components/StoryDetail.jsx';
import Chat from './components/Chat.jsx';
import Auth from './components/Auth.jsx';

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  // State Management
  const [currentView, setCurrentView] = useState('library');
  const [currentStory, setCurrentStory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [naughtinessLevel, setNaughtinessLevel] = useState(0);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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
  const [isPremium, setIsPremium] = useState(false);
  
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
        alert('Could not initiate payment.');
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

  const handleChoiceSelect = (choice) => {
    handleSendMessage(choice);
    setChoicesCount(prev => prev + 1);
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

  // Story state for tracking hidden parameters
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

  // Load data on mount
  useEffect(() => {
    loadStories();
    if (currentUser) {
      checkPremiumStatus();
    }
  }, [currentUser]);

  const checkPremiumStatus = async () => {
    console.log('Checking premium for:', currentUser?.email);
    try {
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser?.email })
      });
      const data = await res.json();
      console.log('Premium status check response:', data);
      setIsPremium(!!data.isPremium);
    } catch (err) {
      console.error('Failed to check premium:', err);
    }
  };

  // Load stories from database
  const loadStories = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory !== 'All') filters.category = selectedCategory;
      
      const data = await DatabaseService.getStories(filters);
      setStories(data);
    } catch (error) {
      console.error('Failed to load stories:', error);
      setStories(STORY_DATABASE.stories);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStories();
  }, [searchQuery, selectedCategory]);

  // Navigation Functions
  const goToLibrary = () => setCurrentView('library');

  const goToStoryDetail = async (story) => {
    setCurrentStory(story);
    setCurrentView('story-detail');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('library');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('storyera_user');
    } catch {
      // ignore storage errors
    }
    setCurrentUser(null);
    setCurrentView('landing');
    setCurrentStory(null);
    setChatMessages([]);
    setCurrentChoices([]);
  };

  const startChat = () => {
    setChatMessages([]);
    setCurrentChoices([]);
    setLastSceneSummary('');
    setLastUserChoice('');
    
    // Reset story state to initial values
    setStoryState({
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
    
    // Используем готовый сюжет из базы данных
    const story = currentStory || STORY_DATABASE.stories[0];

    // Set character data from predefined protagonist for this story
    if (story?.protagonist) {
      setCharacterData(story.protagonist);
    }
    const openingMessages = story?.plot?.opening || [
      "You receive a message from a number you don't recognize.",
      "Alex: You finally replied. I wasn't sure you would.",
      "Alex: So… do you remember me?"
    ];
    
    openingMessages.forEach((message, index) => {
      setTimeout(() => {
        addAIMessage(message);
      }, 500 + (index * 1000));
    });
    
    setCurrentView('chat');
  };

  // Chat Functions
  const addAIMessage = (text) => {
    setChatMessages(prev => [...prev, { role: 'ai', content: text }]);
  };

  const handleSendMessage = async (message) => {
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setLastUserChoice(message);
    setCurrentChoices([]); // Clear previous choices
    setIsTyping(true);
    setChoicesCount(prev => prev + 1);

    // Build conversation history for context
    const conversationHistory = chatMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // Build story context
    const storyContext = `Story: ${currentStory?.title || 'Custom Story'}\nDescription: ${currentStory?.description || ''}`;
    
    // Determine scenario brief based on story
    const scenarioBrief = currentStory?.description || storyContext;
    
    const response = await aiService.getAIResponse(message, {
      storyContext,
      characterData,
      scenarioBrief,
      storyState,
      lastSceneSummary,
      lastUserChoice: message,
      conversationHistory,
      flirtLevel: characterData.flirtLevel || 50,
      boundariesLevel: characterData.boundariesLevel || 50
    });
    
    setIsTyping(false);
    
    // Extract scene and choices from response
    const sceneText = response.scene || response;
    const choices = response.choices || [];
    
    // Update last scene summary
    setLastSceneSummary(sceneText.substring(0, 200)); // Store first 200 chars as summary
    
    // Save to database
    await DatabaseService.saveChatHistory(
      currentStory?.id, 
      [...chatMessages, { role: 'user', content: message }, { role: 'ai', content: sceneText }]
    );
    
    setTimeout(() => {
      addAIMessage(sceneText);
      setCurrentChoices(choices);
    }, 300);
  };

  // Story Generation
  const generateStory = async () => {
    let storyTitle = 'Custom Story';
    
    if (storyPrompt) {
      storyTitle = await aiService.generateStoryTitle(storyPrompt);
    }

    // Create story in database
    const newStory = await DatabaseService.createStory({
      title: storyTitle,
      description: storyPrompt || 'A custom generated story',
      category: 'Custom',
      tags: ['ai-generated', 'custom'],
      image: 'https://image.qwenlm.ai/public_source/b5a993e0-9295-487e-a8f3-21f4eba3a246/14c43e383-4b43-4292-9d05-2deec160dcea.png',
      characters: [{ name: characterData.name, role: 'Protagonist' }],
      mature: naughtinessLevel > 50
    });

    setCurrentStory(newStory);
    setShowCreateModal(false);
    setCurrentView('story-detail');
    startChat();
  };

  return (
    <div className="bg-black min-h-screen w-screen flex items-center justify-center p-4">
      <div className="w-full h-full max-w-md bg-black shadow-2xl relative overflow-hidden flex flex-col rounded-2xl border border-stone-800">
        <Header currentUser={currentUser} onLogout={handleLogout} isPremium={isPremium} />

        <main className="flex-1 overflow-y-auto relative bg-black">
          {!currentUser && (
            <Auth onAuthSuccess={handleAuthSuccess} />
          )}
          {currentUser && (currentView === 'library' || currentView === 'landing') && (
            <Library 
              stories={stories}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onStoryClick={goToStoryDetail}
              isPremium={isPremium}
              onPayment={handlePayment}
            />
          )}
          {currentUser && currentView === 'story-detail' && (
            <StoryDetail 
              story={currentStory}
              onBack={goToLibrary}
              onStartStory={startChat}
            />
          )}
          {currentUser && currentView === 'chat' && (
            <Chat 
              story={currentStory}
              chatMessages={chatMessages}
              isTyping={isTyping}
              choices={currentChoices}
              choicesCount={choicesCount}
              isPremium={isPremium}
              onPayment={handlePayment}
              onBack={() => goToStoryDetail(currentStory)}
              onSendMessage={handleSendMessage}
              onChoiceSelect={handleChoiceSelect}
            />
          )}
        </main>

        {showCreateModal && (
          <CreateModal 
            storyPrompt={storyPrompt}
            setStoryPrompt={setStoryPrompt}
            naughtinessLevel={naughtinessLevel}
            setNaughtinessLevel={setNaughtinessLevel}
            onGenerate={generateStory}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
}
