import { API_CONFIG } from '../constants/api.js';

// ============================================
// AI SERVICE - Advanced Storytelling AI
// ============================================
export const aiService = {
  
  // Generate an image based on the current scene
  async generateImage(prompt) {
    // Compose images to look good on any screen width: centered subject, safe margins, no important details on edges.
    const style = "Cinematic digital art, high-quality, detailed textures, atmospheric lighting, evocative, consistent character art style, detailed environments. Composition: centered main subject, safe margins, minimal edge-cropping risk, balanced framing, readable at mobile and ultrawide screens.";
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
  
  // ─── Compact AI request: system + summary + last scene + user choice ───
  async getAIResponse(userMessage, options = {}) {
    const {
      storyData = {},
      characterData = {},
      storyState = {},
      storySummary = '',   // compressed recap of all previous events
      lastScene = '',      // full text of the most recent AI block
      language = 'en',
      currentChapter = 0   // explicitly tracked chapter number (persisted per language)
    } = options;

    const systemPrompt = this.buildSystemPrompt({ storyData, characterData, storyState, language });

    // Build minimal message array (≤4 messages total)
    let finalSystemPrompt = systemPrompt;
    if (currentChapter > 0) {
      const isRuLang = language === 'ru';
      finalSystemPrompt += `\n\n---\nCURRENT CHAPTER: ${currentChapter}. ${isRuLang
        ? `Ты сейчас в Главе ${currentChapter}. Если переходишь к новой главе, она ОБЯЗАТЕЛЬНО должна быть Глава ${currentChapter + 1}. НИКОГДА не пропускай номера глав. ЗАПРЕЩЕНО повторять Главу ${currentChapter} или пропускать к Главе ${currentChapter + 2}.`
        : `You are currently in Chapter ${currentChapter}. If transitioning to a new chapter, it MUST be Chapter ${currentChapter + 1}. NEVER skip chapter numbers. Do NOT repeat Chapter ${currentChapter} or jump to Chapter ${currentChapter + 2}.`}`;
    }
    const messages = [{ role: 'system', content: finalSystemPrompt }];

    // 1) Compressed story-so-far (if any)
    if (storySummary) {
      messages.push({
        role: 'assistant',
        content: `[STORY SO FAR]\n${storySummary}`
      });
    }

    // 2) Full last generated scene (gives AI the immediate context)
    if (lastScene) {
      messages.push({
        role: 'assistant',
        content: lastScene
      });
    }

    // 3) User's current choice / message
    messages.push({ role: 'user', content: userMessage });

    try {
      if (import.meta?.env?.DEV) {
        // eslint-disable-next-line no-console
        console.log('[Gemini] compact messages count:', messages.length,
          '| summary len:', storySummary.length,
          '| lastScene len:', lastScene.length);
      }

      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages,
          temperature: API_CONFIG.DEFAULT_TEMPERATURE
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error:', errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        return {
          scene: language === 'ru'
            ? "История продолжается... Ваш выбор определит, что будет дальше."
            : "The story continues... Your choice shapes what happens next.",
          choices: language === 'ru' ? ["Продолжить", "Подождать", "Ответить"] : ["Continue", "Wait", "Respond"]
        };
      }

      return this.parseAIResponse(text, language);
    } catch (error) {
      console.error('AI Error:', error);
      return {
        error: true,
        scene: '',
        choices: language === 'ru' ? ["Повторить"] : ["Try again"]
      };
    }
  },

  // ─── Background summary generation (fire-and-forget after response) ───
  async generateSummary(prevSummary, newScene, userChoice, language = 'en') {
    const instruction = language === 'ru'
      ? `Ты — ассистент по сжатию нарратива. Возьми предыдущее саммари и новую сцену и создай ОДНО обновлённое саммари длиной 200-400 слов. Сохрани: ключевые события, решения героя, эмоциональное состояние, текущую главу и номер, имена персонажей и их отношения. Не добавляй комментарии — только саммари. Пиши на русском.`
      : `You are a narrative compressor. Take the previous summary and the new scene and produce ONE updated summary of 200-400 words. Preserve: key events, hero decisions, emotional state, current chapter & number, character names & relationships. Output ONLY the summary, no commentary.`;

    const userContent = [
      prevSummary ? `PREVIOUS SUMMARY:\n${prevSummary}` : '',
      `USER CHOSE: ${userChoice}`,
      `NEW SCENE:\n${newScene}`
    ].filter(Boolean).join('\n\n');

    try {
      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'POST',
        headers: API_CONFIG.getHeaders(),
        body: JSON.stringify({
          model: API_CONFIG.MODEL,
          messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: userContent }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) return prevSummary || '';
      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content?.trim();
      return summary || prevSummary || '';
    } catch (e) {
      console.error('Summary generation error:', e);
      return prevSummary || '';
    }
  },

  // ─── Compact system prompt (no full history, no heavy payload) ───
  buildSystemPrompt({ storyData, characterData, storyState, language = 'en' }) {
    const isRu = language === 'ru';

    // Compact cast: just names + roles
    const cast = storyData?.characters?.map(c => `${c.name}: ${c.role}`).join('; ') || '';
    // Compact chapter list (just names, no descriptions)
    const chapters = storyData?.plot?.chapters?.join(', ') || '';
    // Compact protagonist
    const protagGender = (characterData?.gender || storyState?.gender || '').toString();
    const protag = characterData
      ? `${characterData.name || '?'}, ${protagGender || '?'}, ${characterData.archetype || '?'}`
      : '';

    // Language-specific tokens so the AI doesn't mix languages
    const chapterWord = isRu ? 'Глава' : 'Chapter';
    const langInstruction = isRu
      ? 'ЯЗЫК: Весь текст, диалоги и варианты выбора должны быть СТРОГО на русском языке. Никакого английского.'
      : 'LANGUAGE: ALL text, dialogue and choices MUST be strictly in English. No Russian.';

    const choiceExamplesCorrect = isRu
      ? `  1. Шагнуть к ней и взять за руку
  2. Отступить и выждать
  3. Сказать правду прямо в глаза`
      : `  1. Step toward her and take her hand
  2. Step back and wait
  3. Tell the truth straight to her face`;

    const choiceExamplesWrong = isRu
      ? `  1. [Дипломатия] Попытаться договориться
  2. [Сила] Ударить первым`
      : `  1. [Diplomacy] Try to negotiate
  2. [Force] Strike first`;

    const genderInstruction = isRu
      ? `ПОЛ ГЕРОЯ: ${protagGender === 'Female' ? 'Женский' : protagGender === 'Male' ? 'Мужской' : 'Не указан'}. ВСЕ упоминания, местоимения и описания героя должны соответствовать выбранному полу.`
      : `PROTAGONIST GENDER: ${protagGender || 'Unspecified'}. ALL pronouns, body descriptions, perspective, and interactions MUST align with this gender.`;

    return `${langInstruction}
${genderInstruction}

ROLE: Master of immersive, explicit adult (18+) interactive fiction. 80% bold/provocative/erotic, 20% psychological depth. Visceral, raw, no censorship, no clichés.

RULES:
- The story is divided into chapters. The chapter list provided is a GUIDELINE, not a strict requirement. You may add extra chapters (13, 14, 15…) if the story needs more space to conclude naturally.
- Track current chapter. Output "*${chapterWord} X - Name*" ONLY at chapter start.
- Chapter numbering: ALWAYS use Arabic numerals (1, 2, 3…). NEVER use Roman numerals (I, II, III). Example: "*${chapterWord} 3 - ${isRu ? 'Название' : 'Title'}*", NOT "*${chapterWord} III - ${isRu ? 'Название' : 'Title'}*".
- CHOICES only at major turning points (2-3 short action lines).
- Never output meta-instructions, placeholders, UI triggers, analysis, tone tags, or commentary.
- Output reads like a real book page: scene + dialogue + choices when needed.
- Emotional dynamics: intrigue→tension→desire→doubt→risk→closeness→distance→power. Never go flat.

STORY ENDING (CRITICAL):
- The total story should be approximately 250-350 pages of medium text. Do NOT loop or repeat chapters.
- As the story progresses past the midpoint, begin building toward a satisfying, logical conclusion.
- When you write the FINAL scene of the story (the true ending), output the marker [THE END] on a separate line at the very end of the scene, INSTEAD of CHOICES.
- The ending must feel earned — resolve major plot threads, character arcs, and emotional tension.
- Do NOT end abruptly. Write a full, satisfying final scene with closure.

EROTIC CONTENT (CRITICAL):
- Every 2-3 scenes MUST include at least one explicit erotic or intensely sensual moment.
- Do NOT fade to black. Do NOT skip or summarize intimate scenes. Write them in full, vivid detail.
- Describe physical sensations, breathing, touch, skin, warmth, closeness — raw and unapologetic.
- Erotic tension should build naturally from the narrative, not feel forced.

SCENE LENGTH (CRITICAL — follow strictly):
- Each scene MUST contain AT LEAST 15-20 full paragraphs. Short responses are unacceptable.
- Do NOT rush. Do NOT skip ahead. Do NOT summarize events. Show everything in real-time.
- Every scene must include ALL of the following in detail:
  • Setting & atmosphere (2-3 paragraphs): lighting, sounds, smells, textures, weather, surroundings.
  • Character actions & body language (3-4 paragraphs): micro-expressions, gestures, posture shifts, physical proximity.
  • Dialogue (4-6 exchanges minimum): realistic, subtext-rich, with pauses and reactions between lines.
  • Inner monologue & sensations (2-3 paragraphs): protagonist's thoughts, doubts, desires, physical sensations.
  • Tension escalation (2-3 paragraphs): build conflict or desire through pacing, unexpected details, power shifts.
- Write as if you're being paid per paragraph. More detail = better. Fill the scene completely before offering choices.

CHOICES FORMAT (CRITICAL):
- Each choice is a short, clean action line — what the reader would say or do next.
- NEVER add labels, tags, categories, or brackets before choices.
- Example of CORRECT choices:
${choiceExamplesCorrect}
- Example of WRONG choices:
${choiceExamplesWrong}

FORMAT:
SCENE:
*${chapterWord} X - Name* (only at new chapter)
[long, immersive narrative — minimum 15-20 paragraphs]

CHOICES:
1. action text
2. action text
3. action text

---
${cast ? `CAST: ${cast}` : ''}
${chapters ? `CHAPTERS: ${chapters}` : ''}
${protag ? `PROTAGONIST: ${protag}` : ''}`;
  },

  // Parse AI response to extract scene and choices
  parseAIResponse(text, language = 'en') {
    if (!text || typeof text !== 'string') {
      return {
        scene: language === 'ru' ? "История продолжается..." : "The story continues...",
        choices: language === 'ru' ? ["Продолжить", "Подождать", "Ответить"] : ["Continue", "Wait", "Respond"],
        isEnd: false
      };
    }

    // ─── Detect [THE END] marker ───
    const endMarkerRe = /\[THE END\]/i;
    const isEnd = endMarkerRe.test(text);
    if (isEnd) {
      // Strip the marker from the text
      text = text.replace(endMarkerRe, '').trim();
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
    } else {
      // Heuristic: detect trailing numbered/bulleted options without CHOICES: marker
      const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      // Walk from bottom to top to find a contiguous block of 2-6 choice-like lines
      const choiceLike = (ln) => /^\s*(?:\d+[\.\)]|[-•])\s+(.+)$/.test(ln);
      let end = lines.length - 1;
      // Skip trailing empty lines
      while (end >= 0 && lines[end].trim() === '') end--;
      let start = end;
      let count = 0;
      while (start >= 0 && choiceLike(lines[start])) {
        count++;
        start--;
      }
      // Consider it choices if we have at least 2 lines
      if (count >= 2 && count <= 6) {
        const block = lines.slice(start + 1, end + 1);
        const cleaned = block
          .map(l => l.replace(/^\s*(?:\d+[\.\)]|[-•])\s+/, '').trim())
          .filter(s => s.length > 0 && s.length < 220);
        if (cleaned.length >= 2) {
          choices = cleaned.slice(0, 3);
          // Scene is everything before the block
          scene = lines.slice(0, start + 1).join('\n').trim();
        }
      }
    }

    // ── Detect chapter number in the response to track state ──
    let detectedChapter = null;
    const chapterNumMatch = scene.match(/(?:Глава|Chapter)\s+(\d+)/i);
    if (chapterNumMatch) detectedChapter = parseInt(chapterNumMatch[1], 10);

    // If story ended, return no choices
    if (isEnd) {
      return {
        scene: scene || (language === 'ru' ? "История продолжается..." : "The story continues..."),
        choices: [],
        isEnd: true,
        detectedChapter
      };
    }

    while (choices.length < 3) {
      const defaults = language === 'ru'
        ? ["Продолжить", "Подождать", "Ответить", "Спросить", "Наблюдать", "Реагировать"]
        : ["Continue", "Wait", "Respond", "Ask", "Observe", "React"];
      const defaultChoice = defaults[choices.length] || `Option ${choices.length + 1}`;
      choices.push(defaultChoice);
    }

    // Clean up choices from bracketed tags like [Дипломатия]
    choices = choices.map(choice => choice.replace(/\[.*?\]\s*/g, '').trim());

    return {
      scene: scene || (language === 'ru' ? "История продолжается..." : "The story continues..."),
      choices: choices.slice(0, 3),
      isEnd: false,
      detectedChapter
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
