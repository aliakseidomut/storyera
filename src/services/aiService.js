import { API_CONFIG } from '../constants/api.js';

// ============================================
// AI SERVICE - Native Gemini API Implementation
// ============================================
export const aiService = {
  
  // Get AI response using native Gemini API format
  async getAIResponse(userMessage, storyContext, characterData, naughtinessLevel) {
    const apiKey = API_CONFIG.getApiKey();
    
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return "API key not configured. Please add your Gemini API key.";
    }

    const systemPrompt = `You are an interactive storytelling AI. Create engaging, immersive narratives based on user choices. 
    Story: ${storyContext}
    Character: ${characterData.name}, ${characterData.gender}, ${characterData.age}, ${characterData.archetype}, traits: ${characterData.traits.join(', ')}
    Naughtiness Level: ${naughtinessLevel}%
    
    Respond as the narrator or characters in the story. Keep responses concise (2-4 sentences max). 
    Create tension, mystery, or romance based on the story context. Continue the narrative based on what the user says or does.`;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                { text: userMessage }
              ]
            }
          ],
          generationConfig: {
            temperature: API_CONFIG.DEFAULT_TEMPERATURE,
            maxOutputTokens: 1024,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Gemini Response:', data);
      
      // Extract text from Gemini response format
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.warn('No content in Gemini response');
        return "The story continues... Your choice shapes what happens next.";
      }
      
      return text;
    } catch (error) {
      console.error('AI Error:', error);
      return `Error: ${error.message}. Please check your API configuration.`;
    }
  },

  // Generate story title using Gemini
  async generateStoryTitle(storyPrompt) {
    if (!storyPrompt) {
      return 'Custom Story';
    }

    const apiKey = API_CONFIG.getApiKey();
    
    if (!apiKey) {
      return 'Custom Story';
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { 
                  text: 'You are a creative writer. Generate short, catchy story titles (maximum 3-4 words). Return only the title, nothing else.' 
                },
                { 
                  text: `Create a short, catchy title (max 3-4 words) for this story: ${storyPrompt}. Only return the title, no explanations.` 
                }
              ]
            }
          ],
          generationConfig: {
            temperature: API_CONFIG.DEFAULT_TEMPERATURE,
            maxOutputTokens: 50
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (!title || title.length > 50) {
        return 'Custom Story';
      }
      
      return title;
    } catch (e) {
      console.error('Title generation error:', e);
      return 'Custom Story';
    }
  }
};
