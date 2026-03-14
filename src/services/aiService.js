import { API_CONFIG } from '../constants/api.js';

// ============================================
// AI SERVICE
// ============================================
export const aiService = {
  // Get AI response from Gemini via Hugging Face Chat Completions API
  async getAIResponse(userMessage, storyContext, characterData, naughtinessLevel) {
    const systemPrompt = `You are an interactive storytelling AI. Create engaging, immersive narratives based on user choices. 
    Story: ${storyContext}
    Character: ${characterData.name}, ${characterData.gender}, ${characterData.age}, ${characterData.archetype}, traits: ${characterData.traits.join(', ')}
    Naughtiness Level: ${naughtinessLevel}%
    
    Respond as the narrator or characters in the story. Keep responses concise (2-4 sentences max). 
    Create tension, mystery, or romance based on the story context. Continue the narrative based on what the user says or does.`;

    try {
      const headers = {
        'Authorization': 'Bearer reloadKey',
        'Content-Type': 'application/json'
      };

      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: API_CONFIG.DEFAULT_TEMPERATURE
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AI Response:', data);
      
      const text = data.choices?.[0]?.message?.content;
      
      if (!text) {
        console.warn('No content in AI response');
        return "The story continues... Your choice shapes what happens next.";
      }
      
      return text;
    } catch (error) {
      console.error('AI Error:', error);
      return "I encountered an error while generating the response. Please try again.";
    }
  },

  // Generate story title using Gemini
  async generateStoryTitle(storyPrompt) {
    if (!storyPrompt) {
      return 'Custom Story';
    }

    try {
      const headers = {
        'Authorization': 'Bearer reloadKey',
        'Content-Type': 'application/json'
      };

      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a creative writer. Generate short, catchy story titles (maximum 3-4 words). Return only the title, nothing else.'
            },
            {
              role: 'user',
              content: `Create a short, catchy title (max 3-4 words) for this story: ${storyPrompt}. Only return the title, no explanations.`
            }
          ],
          temperature: API_CONFIG.DEFAULT_TEMPERATURE
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Title API Error Response:', errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Title Generation Response:', data);
      
      const title = data.choices?.[0]?.message?.content?.trim();
      
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
