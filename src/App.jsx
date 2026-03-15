import { useState, useEffect } from 'react';
import { DatabaseService } from './services/DatabaseService.js';
import { aiService } from './services/aiService.js';
import { STORY_DATABASE } from './data/mockDatabase.js';

// Components
import AgeGate from './components/AgeGate.jsx';
import CreateModal from './components/CreateModal.jsx';
import Header from './components/Header.jsx';
import Landing from './components/Landing.jsx';
import Character from './components/Character.jsx';
import Library from './components/Library.jsx';
import StoryDetail from './components/StoryDetail.jsx';
import Chat from './components/Chat.jsx';

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  // State Management
  const [currentView, setCurrentView] = useState('age-gate');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
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
  }, []);

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

  // Age Gate Functions
  const handleEnterApp = () => {
    if (ageConfirmed) {
      setCurrentView('landing');
    }
  };

  // Navigation Functions
  const goToCharacter = () => setCurrentView('character');
  const goToLibrary = () => setCurrentView('library');
  const goToLanding = () => setCurrentView('landing');

  const goToStoryDetail = async (story) => {
    setCurrentStory(story);
    setCurrentView('story-detail');
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
    
    // Update story state (simplified - in real implementation, AI could return state updates)
    // For now, we'll update based on user choices heuristically
    
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

  const handleChoiceSelect = (choice) => {
    handleSendMessage(choice);
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
    <div className="bg-stone-200 min-h-screen w-screen flex items-center justify-center p-4">
      <div className="w-full h-full max-w-md bg-stone-50 shadow-2xl relative overflow-hidden flex flex-col rounded-2xl">
        {currentView !== 'age-gate' && (
          <Header />
        )}

        <main className="flex-1 overflow-y-auto relative bg-stone-50">
          {currentView === 'age-gate' && (
            <AgeGate 
              ageConfirmed={ageConfirmed}
              setAgeConfirmed={setAgeConfirmed}
              onEnter={handleEnterApp}
            />
          )}
          {currentView === 'landing' && (
            <Landing 
              onStartStory={goToCharacter}
              onStoryClick={goToStoryDetail}
            />
          )}
          {currentView === 'character' && (
            <Character 
              characterData={characterData}
              setCharacterData={setCharacterData}
              onContinue={goToLibrary}
              onBack={goToLanding}
            />
          )}
          {currentView === 'library' && (
            <Library 
              stories={stories}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onStoryClick={goToStoryDetail}
              onCreateStory={() => setShowCreateModal(true)}
            />
          )}
          {currentView === 'story-detail' && (
            <StoryDetail 
              story={currentStory}
              onBack={goToLibrary}
              onStartStory={startChat}
            />
          )}
          {currentView === 'chat' && (
            <Chat 
              story={currentStory}
              chatMessages={chatMessages}
              isTyping={isTyping}
              choices={currentChoices}
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
