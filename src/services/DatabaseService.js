// ============================================
// DATABASE SERVICE (Fetch from Real API)
// ============================================
export const DatabaseService = {
  // Get all stories
  async getStories(filters = {}) {
    const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
    });
    return await response.json();
  },

  // Save chat history
  async saveChatHistory(storyId, messages) {
    // Keep in localStorage or local state, or save to backend if needed
    console.log('Saving chat history for story:', storyId, messages);
    return { success: true };
  },

  async saveProgress(userId, storyId, progress) {
    const response = await fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, story_id: storyId, progress })
    });
    return response.json();
  },

  async getProgress(userId, storyId) {
    const response = await fetch('/api/get-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, story_id: storyId })
    });
    return response.json();
  },

  async getAllProgress(userId) {
    const response = await fetch('/api/all-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    });
    return response.json();
  },

  async createStory(storyData) {
    // Placeholder - usually admin feature or not implemented yet
    return { id: Math.floor(Math.random() * 1000) };
  }
};
