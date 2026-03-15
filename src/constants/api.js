// ============================================
// API CONFIGURATION - Gemini Proxy (OpenAI-compatible)
// ============================================

export const API_CONFIG = {
  // Gemini proxy endpoint (OpenAI-compatible format)
  BASE_URL: "https://magictext.online/wp-content/plugins/wp-gemini-chat-proxy/gemini_openai_proxy.php/v1/chat/completions",
  MODEL: 'gemini-3-flash-preview',
  DEFAULT_TEMPERATURE: 0.7,
  
  // No API key needed - using fixed reloadKey
  getHeaders: function() {
    return {
      'Authorization': 'Bearer reloadKey',
      'Content-Type': 'application/json'
    };
  }
};
