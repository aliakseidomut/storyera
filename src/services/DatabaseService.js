// ============================================
// DATABASE SERVICE (Fetch from Real API)
// ============================================
export const DatabaseService = {
  async ensureOk(response, endpoint) {
    if (response.ok) return;
    const body = await response.text().catch(() => '');
    throw new Error(`API ${endpoint} failed: ${response.status} ${body || response.statusText}`);
  },

  async parseJsonResponse(response, fallback = null) {
    const text = await response.text();
    if (!text) return fallback;
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  },

  // Get all stories
  async getStories(filters = {}) {
    const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
    });
    return await this.parseJsonResponse(response, []);
  },

  // Save chat history
  async saveChatHistory(storyId, messages) {
    // Keep in localStorage or local state, or save to backend if needed
    console.log('Saving chat history for story:', storyId, messages);
    return { success: true };
  },

  async saveProgress(userId, storyId, progress, email) {
    const response = await fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, story_id: storyId, progress })
    });
    await this.ensureOk(response, '/api/save-progress');
    return this.parseJsonResponse(response, { success: response.ok });
  },

  async getProgress(userId, storyId, email) {
    const response = await fetch('/api/get-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, story_id: storyId })
    });
    await this.ensureOk(response, '/api/get-progress');
    return this.parseJsonResponse(response, null);
  },

  async clearProgress(userId, storyId, email) {
    const response = await fetch('/api/clear-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, story_id: storyId })
    });
    await this.ensureOk(response, '/api/clear-progress');
    return this.parseJsonResponse(response, { success: response.ok });
  },

  async getAllProgress(userId, email) {
    const response = await fetch('/api/all-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, email })
    });
    await this.ensureOk(response, '/api/all-progress');
    return this.parseJsonResponse(response, []);
  },

  async createStory(storyData) {
    // Placeholder - usually admin feature or not implemented yet
    return { id: Math.floor(Math.random() * 1000) };
  }
};
