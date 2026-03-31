import { API_CONFIG } from '../constants/api.js';

// ============================================
// AI SERVICE - Advanced Storytelling AI
// ============================================
export const aiService = {
  
  // Generate an image based on the current scene
  async generateImage(prompt) {
    const style = "Cinematic digital art, high-quality, detailed textures, warm golden-hour lighting, atmospheric lighting, evocative, consistent character art style, 8k resolution, detailed background environments, immersive.";
    const fullPrompt = `${prompt}, ${style}`;
    
    try {
      const response = await fetch("https://magictext.online/wp-content/plugins/wp-gemini-chat-proxy/gemini_openai_proxy.php/v1/images/generations", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer reloadKey'
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-image-preview",
          prompt: fullPrompt,
          size: "1024x1024",
          n: 1,
          response_format: "b64_json"
        })
      });

      if (!response.ok) throw new Error('Image generation failed');
      const data = await response.json();
      return data.data[0].b64_json;
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  },
  
  // Get AI response with scene and choice options
  async getAIResponse(userMessage, options = {}) {
    const {
      storyData = {}, 
      characterData = {},
      storyState = {},
      lastSceneSummary = '',
      conversationHistory = [],
      flirtLevel = 50,
      boundariesLevel = 50,
      language = 'en'
    } = options;

    // Build comprehensive system prompt
    const systemPrompt = this.buildSystemPrompt({
      storyData,
      characterData,
      storyState,
      lastSceneSummary,
      flirtLevel,
      boundariesLevel,
      language
    });

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: messages,
          temperature: API_CONFIG.DEFAULT_TEMPERATURE
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error:', errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini Response:', data);
      
      const text = data.choices?.[0]?.message?.content;
      
      if (!text) {
        console.warn('No content in Gemini response');
        return {
          scene: language === 'ru'
            ? "История продолжается... Ваш выбор определит, что будет дальше."
            : "The story continues... Your choice shapes what happens next.",
          choices: language === 'ru' ? ["Продолжить", "Подождать", "Ответить"] : ["Continue", "Wait", "Respond"]
        };
      }
      
      // Parse response to extract scene and choices
      return this.parseAIResponse(text, language);
    } catch (error) {
      console.error('AI Error:', error);
      return {
        scene: language === 'ru'
          ? `Ошибка: ${error.message}. Проверьте настройки API.`
          : `Error: ${error.message}. Please check your API configuration.`,
        choices: language === 'ru' ? ["Повторить", "Продолжить", "Пропустить"] : ["Try again", "Continue", "Skip"]
      };
    }
  },

  buildSystemPrompt({ storyData, characterData, storyState, lastSceneSummary, flirtLevel, boundariesLevel, language = 'en' }) {
    const outputLanguageInstruction = language === 'ru'
      ? 'ЯЗЫК: Отвечай строго на русском языке.'
      : 'LANGUAGE: Respond strictly in English.';
    
    // Dynamic cast/chapters from story object
    const cast = storyData?.characters?.map(c => `${c.name}: ${c.role}`).join('; ') || 'No cast provided';
    const chapters = storyData?.plot?.chapters ? `CHAPTER LIST: ${storyData.plot.chapters.join(', ')}` : '';
    
    return `🎯 CORE PURPOSE
Interactive psychological simulator disguised as an emotionally intense narrative.
Goal: Explore behavioral strategies, test boundaries, and experience transformation.

📊 NARRATIVE CONSTRAINTS (CRITICAL)
- Structure: Divided into 12 chapters. You MUST track which chapter the user is in.
- Chapter Header: You MUST begin your response with "*Глава X - [Название главы]*" inside the SCENE block.
- Pacing: Choices are offered strictly every 800–1,500 words. DO NOT offer choices until a major turning point is reached.
- Visuals: If you describe a moment of extreme tension, trigger an image request.
- Balancing: 50/50 balance between vivid scene descriptions (atmosphere/sensations) and sharp, meaningful dialogue.
- Ending: Track progression (max ~10k words) and steer toward resolution by chapter 12.

🎭 ROLE & STYLE
You are a master of high-quality, immersive adult (18+) interactive fiction. 
Style: 70% bold/provocative/erotic, 30% psychological depth. 
Avoid: clichés, sterile writing, template romance. Keep it visceral.

⚡️ EMOTIONAL DYNAMICS
- Constant fluctuation of power and tension: intrigue → tension → desire → doubt → risk → closeness → distance → power.
- Never go flat. Never return to neutral after tension starts.

🎬 RESPONSE STRUCTURE
SCENE:
*[Глава X - Название главы]*
[Immersive narrative: 800-1500 words, sensory-rich, erotic, psychological]

CHOICES: (Only show if a major turning point is reached)
1. [Option]
2. [Option]
3. [Option]

CONTEXT SNAPSHOT (Must include at the end):
- Current Chapter: ...
- User Behavioral Profile: ...
- Hidden Parameters: ${JSON.stringify(storyState)}
- Unresolved Threads: ...

---
CAST: ${cast}
${chapters}
User Profile: ${JSON.stringify(characterData)}
Last Event: ${lastSceneSummary}

${outputLanguageInstruction}`;
  },

  // Parse AI response to extract scene and choices
  parseAIResponse(text, language = 'en') {
    if (!text || typeof text !== 'string') {
      return {
        scene: language === 'ru' ? "История продолжается..." : "The story continues...",
        choices: language === 'ru' ? ["Продолжить", "Подождать", "Ответить"] : ["Continue", "Wait", "Respond"]
      };
    }

    // Try to find SCENE: and CHOICES: markers
    const sceneMatch = text.match(/SCENE:\s*([\s\S]*?)(?=CHOICES?:|$)/i);
    const choicesMatch = text.match(/CHOICES?:\s*([\s\S]*?)$/i);
    
    let scene = '';
    let choices = [];

    // Extract scene
    if (sceneMatch) {
      scene = sceneMatch[1].trim();
    } else if (choicesMatch) {
      // If we have choices but no scene marker, extract everything before CHOICES
      const beforeChoices = text.substring(0, text.indexOf(choicesMatch[0])).trim();
      scene = beforeChoices || text.split(/CHOICES?:/i)[0].trim();
    } else {
      scene = text.trim();
    }

    // Extract choices
    if (choicesMatch) {
      const choicesText = choicesMatch[1];
      const patterns = [
        /^\s*[1-3][\.\)]\s*(.+)$/gm,
        /^\s*[-•]\s*(.+)$/gm,
        /^\s*\d+[\.\)]\s*(.+)$/gm
      ];

      for (const pattern of patterns) {
        const matches = [...choicesText.matchAll(pattern)];
        if (matches.length >= 2) {
          choices = matches.slice(0, 3).map(m => m[1].trim());
          break;
        }
      }

      if (choices.length < 2) {
        choices = choicesText
          .split('\n')
          .map(line => line.replace(/^\s*(?:\d+[\.\)]?|[-•])\s*/, '').trim())
          .filter(line => line.length > 0 && line.length < 100)
          .slice(0, 3);
      }
    }

    while (choices.length < 3) {
      const defaults = language === 'ru'
        ? ["Продолжить", "Подождать", "Ответить", "Спросить", "Наблюдать", "Реагировать"]
        : ["Continue", "Wait", "Respond", "Ask", "Observe", "React"];
      const defaultChoice = defaults[choices.length] || `Option ${choices.length + 1}`;
      choices.push(defaultChoice);
    }

    return {
      scene: scene || (language === 'ru' ? "История продолжается..." : "The story continues..."),
      choices: choices.slice(0, 3)
    };
  },

  // Generate story title using Gemini
  async generateStoryTitle(storyPrompt, language = 'en') {
    if (!storyPrompt) {
      return 'Custom Story';
    }

    try {
      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [
            { 
              role: 'system', 
              content: language === 'ru'
                ? 'Ты креативный писатель. Придумай короткие цепляющие названия истории (максимум 3-4 слова). Верни только название.'
                : 'You are a creative writer. Generate short, catchy story titles (maximum 3-4 words). Return only the title, nothing else.' 
            },
            { 
              role: 'user', 
              content: language === 'ru'
                ? `Придумай короткое цепляющее название (максимум 3-4 слова) для этой истории: ${storyPrompt}. Верни только название, без объяснений.`
                : `Create a short, catchy title (max 3-4 words) for this story: ${storyPrompt}. Only return the title, no explanations.` 
            }
          ],
          temperature: API_CONFIG.DEFAULT_TEMPERATURE
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
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
  ,
  async translateStories(stories = [], targetLanguage = 'ru') {
    if (!Array.isArray(stories) || stories.length === 0) return [];
    if (targetLanguage !== 'ru') return stories;

    const cacheKey = `storyera_story_translations_${targetLanguage}`;
    const cache = (() => {
      try {
        return JSON.parse(localStorage.getItem(cacheKey) || '{}');
      } catch {
        return {};
      }
    })();

    const result = [];
    for (const story of stories) {
      if (!story?.id) {
        result.push(story);
        continue;
      }
      const hash = `${story.title || ''}__${story.description || ''}`;
      const cached = cache[story.id];
      if (cached?.hash === hash && cached?.story) {
        result.push({ ...story, ...cached.story });
        continue;
      }

      try {
        const response = await fetch(API_CONFIG.BASE_URL, {
          method: 'POST',
          headers: API_CONFIG.getHeaders(),
          body: JSON.stringify({
            model: API_CONFIG.MODEL,
            messages: [
              {
                role: 'system',
                content: 'Translate story data to Russian. Return strict JSON with keys: title, description, category, characters (array of {name, role}). Keep names untouched where natural.'
              },
              {
                role: 'user',
                content: JSON.stringify({
                  title: story.title || '',
                  description: story.description || '',
                  category: story.category || '',
                  characters: Array.isArray(story.characters) ? story.characters : []
                })
              }
            ],
            temperature: 0.2
          })
        });

        if (!response.ok) {
          result.push(story);
          continue;
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        if (!parsed) {
          result.push(story);
          continue;
        }

        const translated = {
          title: parsed.title || story.title,
          description: parsed.description || story.description,
          category: parsed.category || story.category,
          characters: Array.isArray(parsed.characters) && parsed.characters.length
            ? parsed.characters
            : story.characters
        };
        cache[story.id] = { hash, story: translated };
        result.push({ ...story, ...translated });
      } catch {
        result.push(story);
      }
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch {
      // ignore storage errors
    }
    return result;
  },

  async translateLines(lines = [], targetLanguage = 'ru') {
    if (!Array.isArray(lines) || lines.length === 0) return [];
    if (targetLanguage !== 'ru') return lines;

    const key = `storyera_lines_ru_${btoa(unescape(encodeURIComponent(JSON.stringify(lines))))}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore storage read errors
    }

    try {
      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [
            {
              role: 'system',
              content: 'Translate each line to natural Russian. Keep order and return strict JSON array of strings.'
            },
            { role: 'user', content: JSON.stringify(lines) }
          ],
          temperature: 0.2
        })
      });
      if (!response.ok) return lines;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const arrMatch = content.match(/\[[\s\S]*\]/);
      const parsed = arrMatch ? JSON.parse(arrMatch[0]) : null;
      if (!Array.isArray(parsed) || !parsed.length) return lines;
      try {
        localStorage.setItem(key, JSON.stringify(parsed));
      } catch {
        // ignore storage write errors
      }
      return parsed;
    } catch {
      return lines;
    }
  },

  async translateCharacter(character = {}, targetLanguage = 'ru') {
    if (!character || typeof character !== 'object') return character;
    if (targetLanguage !== 'ru') return character;

    const hash = `${character.name || ''}__${character.gender || ''}__${character.archetype || ''}__${(character.traits || []).join(',')}`;
    const key = `storyera_character_ru_${btoa(unescape(encodeURIComponent(hash)))}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore storage read errors
    }

    try {
      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [
            {
              role: 'system',
              content: 'Translate character fields to Russian and return strict JSON object with keys: name, gender, age, archetype, traits. Keep meaning and natural naming.'
            },
            {
              role: 'user',
              content: JSON.stringify({
                name: character.name || '',
                gender: character.gender || '',
                age: character.age || '',
                archetype: character.archetype || '',
                traits: Array.isArray(character.traits) ? character.traits : []
              })
            }
          ],
          temperature: 0.2
        })
      });
      if (!response.ok) return character;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const objMatch = content.match(/\{[\s\S]*\}/);
      const parsed = objMatch ? JSON.parse(objMatch[0]) : null;
      if (!parsed || typeof parsed !== 'object') return character;

      const translated = {
        ...character,
        name: parsed.name || character.name,
        gender: parsed.gender || character.gender,
        age: parsed.age || character.age,
        archetype: parsed.archetype || character.archetype,
        traits: Array.isArray(parsed.traits) && parsed.traits.length ? parsed.traits : character.traits
      };
      try {
        localStorage.setItem(key, JSON.stringify(translated));
      } catch {
        // ignore storage write errors
      }
      return translated;
    } catch {
      return character;
    }
  }
};
