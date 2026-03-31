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
    console.log('[DEBUG] Fetching stories...');
    const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
    });
    const data = await this.parseJsonResponse(response, []);
    console.log('[DEBUG] Stories fetched:', data);
    return data;
  },

  // Save chat history
  async saveChatHistory(storyId, messages) {
    return { success: true };
  },

  async saveProgress(userId, storyId, progress, email) {
    const body = { user_id: userId || null, email, story_id: storyId, progress };
    const response = await fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await this.parseJsonResponse(response, { success: response.ok });
  },

  async getProgress(userId, storyId, email) {
    const body = { user_id: userId || null, email, story_id: storyId };
    const response = await fetch('/api/get-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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

  async createStory(storyData) {
    return { id: Math.floor(Math.random() * 1000) };
  }
};
