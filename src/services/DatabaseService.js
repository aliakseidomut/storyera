import { STORY_DATABASE } from '../data/mockDatabase.js';

// ============================================
// DATABASE SERVICE (Replace with kyarapu.com API)
// ============================================
export const DatabaseService = {
  // Get all stories
  async getStories(filters = {}) {
    // TODO: Replace with actual API call to kyarapu.com
    let stories = [...STORY_DATABASE.stories];
    
    if (filters.category) {
      stories = stories.filter(s => s.category === filters.category);
    }
    if (filters.mature !== undefined) {
      stories = stories.filter(s => s.mature === filters.mature);
    }
    if (filters.search) {
      stories = stories.filter(s => 
        s.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    return stories;
  },

  // Get story by ID
  async getStoryById(id) {
    // TODO: Replace with actual API call
    return STORY_DATABASE.stories.find(s => s.id === id);
  },

  // Create new story
  async createStory(storyData) {
    // TODO: Replace with actual API call
    const newStory = {
      id: STORY_DATABASE.stories.length + 1,
      ...storyData,
      rating: 0,
      plays: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    STORY_DATABASE.stories.push(newStory);
    return newStory;
  },

  // Save chat history
  async saveChatHistory(storyId, messages) {
    // TODO: Replace with actual API call
    console.log('Saving chat history for story:', storyId, messages);
    return { success: true };
  },

  // Get user profile
  async getUserProfile(userId) {
    // TODO: Replace with actual API call
    return STORY_DATABASE.users.find(u => u.id === userId);
  }
};
