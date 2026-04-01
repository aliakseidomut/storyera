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

  // Save chat history (legacy, unused)
  async saveChatHistory(storyId, messages) {
    return { success: true };
  },

  /* ──── Progress (language-aware) ──── */

  async saveProgress(userId, storyId, progress, email) {
    const body = { user_id: userId || null, email, story_id: storyId, progress };
    const response = await fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await this.parseJsonResponse(response, { success: response.ok });
  },

  async getProgress(userId, storyId, email, language) {
    const body = { user_id: userId || null, email, story_id: storyId, language };
    const response = await fetch('/api/get-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    await this.ensureOk(response, '/api/get-progress');
    return this.parseJsonResponse(response, null);
  },

  async clearProgress(userId, storyId, email, language) {
    const response = await fetch('/api/clear-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, story_id: storyId, language })
    });
    return await this.parseJsonResponse(response, { success: response.ok });
  },

  async getAllProgress(userId, email) {
    const response = await fetch('/api/all-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email })
    });
    return await this.parseJsonResponse(response, []);
  },

  /* ──── Bookmarks ──── */

  async getAllBookmarks(userId, email) {
    const response = await fetch('/api/all-bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email })
    });
    return await this.parseJsonResponse(response, []);
  },

  async addBookmark(userId, storyId, email) {
    const response = await fetch('/api/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, story_id: storyId })
    });
    return await this.parseJsonResponse(response, { success: response.ok });
  },

  async removeBookmark(userId, storyId, email) {
    const response = await fetch('/api/unbookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, story_id: storyId })
    });
    return await this.parseJsonResponse(response, { success: response.ok });
  },

  /* ──── Completed stories ──── */

  async saveCompleted(userId, storyId, language, title, chatHistory, email) {
    const response = await fetch('/api/save-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId || null, email, story_id: storyId, language, title, chat_history: chatHistory })
    });
    return await this.parseJsonResponse(response, { success: response.ok });
  },

  async getAllCompleted(userId, email) {
    const response = await fetch('/api/all-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email })
    });
    return await this.parseJsonResponse(response, []);
  },

  async getCompletedById(userId, completedId, email) {
    const response = await fetch('/api/get-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId || null, email, completed_id: completedId })
    });
    return await this.parseJsonResponse(response, null);
  },

  async createStory(storyData) {
    return { id: Math.floor(Math.random() * 1000) };
  }
};
