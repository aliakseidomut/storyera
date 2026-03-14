// ============================================
// API CONFIGURATION - Google Gemini 3 Flash Preview
// ============================================

// Option 1: Using Google's Native Gemini API (Recommended)
export const API_CONFIG = {
  // Official Google Gemini API endpoint
  BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models",
  MODEL: 'gemini-3-flash-preview',
  DEFAULT_TEMPERATURE: 1.0,  // Google recommends keeping default at 1.0 for Gemini 3
  
  // API Key should be set in environment variables, not hardcoded
  getApiKey: () => import.meta.env.VITE_GEMINI_API_KEY || '',
  
  // Build the full endpoint URL
  getEndpoint: function() {
    return `${this.BASE_URL}/${this.MODEL}:generateContent`;
  }
};

// Option 2: If you must use OpenAI-compatible proxy (current setup)
// The proxy should handle the translation between OpenAI format and Gemini format
export const API_CONFIG_OPENAI_COMPATIBLE = {
  BASE_URL: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  MODEL: 'gemini-3-flash-preview',
  DEFAULT_TEMPERATURE: 1.0,
  
  // For OpenAI-compatible endpoint, you need proper authentication
  getHeaders: function(apiKey) {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
};
