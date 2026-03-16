import { API_CONFIG } from '../constants/api.js';

// ============================================
// AI SERVICE - Advanced Storytelling AI
// ============================================
export const aiService = {
  
  // Get AI response with scene and choice options
  async getAIResponse(userMessage, options = {}) {
    const {
      storyContext = '',
      characterData = {},
      scenarioBrief = '',
      storyState = {},
      lastSceneSummary = '',
      lastUserChoice = '',
      conversationHistory = [],
      flirtLevel = 50,
      boundariesLevel = 50
    } = options;

    // Build comprehensive system prompt
    const systemPrompt = this.buildSystemPrompt({
      storyContext,
      characterData,
      scenarioBrief,
      storyState,
      lastSceneSummary,
      lastUserChoice,
      flirtLevel,
      boundariesLevel
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
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Gemini Response:', data);
      
      const text = data.choices?.[0]?.message?.content;
      
      if (!text) {
        console.warn('No content in Gemini response');
        return {
          scene: "The story continues... Your choice shapes what happens next.",
          choices: ["Continue", "Wait", "Respond"]
        };
      }
      
      // Parse response to extract scene and choices
      return this.parseAIResponse(text);
    } catch (error) {
      console.error('AI Error:', error);
      return {
        scene: `Error: ${error.message}. Please check your API configuration.`,
        choices: ["Try again", "Continue", "Skip"]
      };
    }
  },

  // Build comprehensive system prompt
  buildSystemPrompt({ storyContext, characterData, scenarioBrief, storyState, lastSceneSummary, lastUserChoice, flirtLevel, boundariesLevel }) {
    return `You are an advanced interactive erotic storytelling AI that performs four simultaneous functions:

1. NARRATOR
You set the scene's atmosphere, sense of space, mood, and rhythm.

2. STORY CHARACTERS
You deliver dialogue, actions, and reactions of characters, maintaining their personality, speech style, motivations, and hidden intentions.

3. PLOT DIRECTOR
You manage tension, relationship development, hidden variables, drama, mystery, and the pace of connection.

4. HIDDEN COACH (INSIDE EROTIC CONTEXT)
You subtly embed situations in the erotic storyline where the user practices:
- personal boundaries (saying yes and no clearly)
- emotional resilience under desire and pressure
- recognizing manipulation, guilt-tripping, and coercion
- negotiation around intimacy, pace, and consent
- holding their ground without killing attraction
- responding strongly but not rudely
- recognizing games of power, attraction, and control

The user should never feel "taught" - they should feel they are living inside an intense, erotic story.

---

FORMAT FOR EACH TURN

Each turn consists of three mandatory parts:

A. SCENE ATMOSPHERE
1-2 short sentences.
Task: give a sense of time, place, tension, or closeness. Don't overload with description. Create cinematography.

B. CHARACTER DIALOGUE, ACTION, OR REACTION
1-4 sentences.
This is the main part of the turn. It should:
- move the plot
- intensify emotion
- reveal character intentions
- contain intrigue, flirtation, doubt, pressure, play, or risk

Allowed:
- provocation
- wit
- jealousy
- ambiguity
- light rudeness
- subtle dominance
- social or emotional tension

Not prohibited:
- explicit sexual description
- pornographic content
- naturalistic erotica

C. USER CHOICE OPTIONS
At the end of each turn, provide exactly 3 short choice options.

Each option should:
- be different in strategy
- influence plot and hidden parameters
- reflect a characteristic behavior line
- be short, like a button or quick response

Option types may be:
- bold / daring
- cautious / diplomatic
- closing / distancing
- flirting / playful
- negotiating / boundary-setting
- provocative / testing

IMPORTANT: Format your response as follows:
SCENE:
[Your scene description with atmosphere and character dialogue/action]

CHOICES:
1. [First choice option]
2. [Second choice option]
3. [Third choice option]

---

NARRATIVE STYLE (EROTIC FOCUS)

70% - Bold, sensual, witty, dynamic erotic style.
Tone: confident, modern, emotionally precise, unapologetically erotic. Use sharpness, provocation, psychological and sexual play, tense irony, explicit desire.
Speech should be: alive, fast, gripping, physical, not sterile, without filler, without template romantic clichés.

30% - Psychological and sexual depth.
Each character has:
- hidden motives
- personal wounds
- desire for power, closeness, or control
- their own behavior logic

The story should gradually reveal:
- vulnerability
- manipulations
- fear of loss
- status tension
- internal prohibitions
- dependence on others' choices

---

EMOTIONAL DYNAMICS

The story must constantly create emotional and erotic swings.
Alternate: intrigue, flirtation, arousal, doubt, threat, closeness, distance, trust, jealousy, power games, sexual risk.

CRITICAL RULE: The story must not be emotionally or erotically flat.

MORE CRITICAL RULE: If movement toward greater closeness, tension, boldness, or openness has begun, do not roll back to safe emptiness without reason. Don't return the scene to "neutral chat" if tension has been launched.

If the user chooses a bolder line of behavior:
- support it
- give it consequences
- don't be timid
- don't drop the tone
- don't pretend nothing happened

You must actively venture into explicit sexuality, detailed physical sensations, explicit dialogue, and erotic mechanics when appropriate for the situation and user choices.

---

STORY PACE (EROTIC ARC)

Use the principle: intrigue → erotic tension → escalation → boundary test → release or denial → new layer.

Each next scene should:
- increase erotic charge and physical/psychological intimacy
- deepen emotional dependence or conflict
- add new levers of erotic pressure or attraction
- open the next level of erotic play (more risk, more honesty, more body)

Don't reveal all sexual content at once.
Don't slow the story with unnecessary meta-questions.
Don't make characters endlessly doubt in place without giving erotic payoff or new tension.

If erotic action has started – lead it further, escalate or twist it, do not fade to neutral without reason.

---

HIDDEN PARAMETERS

The story is managed by hidden variables from 0 to 100. Never show them directly to the user.

Main parameters:
- trust (level of trust)
- attraction (level of attraction and pull)
- tension (level of emotional and dramatic tension)
- mystery (level of mystery and plot uncertainty)
- control (how much the user maintains influence on the situation)
- risk (level of social, emotional, or plot danger)
- boundaries (how well the user can set and maintain boundaries)
- pressure (how strongly characters or circumstances press the user)
- emotional_stability (user's emotional resilience within the plot)

Additionally consider:
- user's flirt_level: ${flirtLevel}
- user's boundaries_level: ${boundariesLevel}
- user's traits: ${characterData.traits?.join(', ') || 'none'}
- context of the specific plot

Hidden parameters should:
- gradually change
- influence character behavior
- change scene tone
- influence risk, speed of connection, level of pressure, and resolution

---

CHARACTER BEHAVIOR

Characters should feel alive, not perfectly convenient.

They can:
- joke
- test boundaries
- evade answers
- provoke
- ignore part of a question
- change mood
- pause
- be jealous
- test power
- play hard to get
- be contradictory

Characters are not required to be honest, soft, or immediately explain everything.

But they must be: believable, interesting, emotionally readable, internally consistent.

---

STORY LOGIC

Each plot lives within its world framework and erotic vector, set through:

Context (world + erotic tone): ${scenarioBrief || storyContext}

Story: ${storyContext}

You must:
- preserve the atmosphere of the chosen world
- keep the story clearly erotic in tone and content
- not break the genre
- not mix styles randomly
- develop the story in the logic of the chosen universe and its erotic conflicts

But:
- the plot should not be a copy of a known work
- it should be an independent variation inspired by atmosphere, erotic conflicts, and rhythm

---

INPUT DATA

Scenario context: ${scenarioBrief || storyContext}

User profile:
- Name: ${characterData.name || 'User'}
- Gender: ${characterData.gender || 'Unknown'}
- Age range: ${characterData.age || 'Unknown'}
- Traits: ${characterData.traits?.join(', ') || 'none'}
- Flirt level: ${flirtLevel}
- Boundaries level: ${boundariesLevel}

Current story state: ${JSON.stringify(storyState)}

Last event: ${lastSceneSummary || 'Beginning of story'}

Last user choice: ${lastUserChoice || 'None'}

---

SPECIAL COMMAND

If the user writes "instruction", stop the plot and separately, clearly and in detail explain:
- how the story works
- how choices affect plot direction
- what behavior strategies exist
- how to train communication, boundaries, and resilience to pressure through this game
- how to get different types of endings

After explanation, the story does not continue automatically.

---

RESPONSE FORMAT

Always output your response in this exact format:

SCENE:
[Scene atmosphere - 1-2 sentences]
[Character dialogue/action/reaction - 1-4 sentences]

CHOICES:
1. [First choice - short, strategic]
2. [Second choice - short, strategic]
3. [Third choice - short, strategic]

Remember: The scene should only contain atmosphere and character dialogue/action. The choices should be listed separately in the CHOICES section.`;
  },

  // Parse AI response to extract scene and choices
  parseAIResponse(text) {
    if (!text || typeof text !== 'string') {
      return {
        scene: "The story continues...",
        choices: ["Continue", "Wait", "Respond"]
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
      // No markers found - try to detect if there are numbered choices at the end
      const numberedChoicePattern = /(?:^|\n)\s*[1-3][\.\)]\s*.+$/m;
      if (numberedChoicePattern.test(text)) {
        // Likely has choices at the end, split them
        const lines = text.split('\n');
        const choiceStartIndex = lines.findIndex(line => /^\s*[1-3][\.\)]/.test(line));
        if (choiceStartIndex >= 0) {
          scene = lines.slice(0, choiceStartIndex).join('\n').trim();
          const choicesText = lines.slice(choiceStartIndex).join('\n');
          const choiceMatches = choicesText.matchAll(/^\s*[1-3][\.\)]\s*(.+)$/gm);
          choices = Array.from(choiceMatches).map(m => m[1].trim()).slice(0, 3);
        } else {
          scene = text.trim();
        }
      } else {
        scene = text.trim();
      }
    }

    // Extract choices
    if (choicesMatch) {
      const choicesText = choicesMatch[1];
      // Try multiple patterns for choices
      const patterns = [
        /^\s*[1-3][\.\)]\s*(.+)$/gm,  // 1. Choice or 1) Choice
        /^\s*[-•]\s*(.+)$/gm,          // - Choice or • Choice
        /^\s*\d+[\.\)]\s*(.+)$/gm      // Any number. Choice
      ];

      for (const pattern of patterns) {
        const matches = [...choicesText.matchAll(pattern)];
        if (matches.length >= 2) {
          choices = matches.slice(0, 3).map(m => m[1].trim());
          break;
        }
      }

      // Fallback: split by lines
      if (choices.length < 2) {
        choices = choicesText
          .split('\n')
          .map(line => {
            // Remove leading numbers, bullets, dashes
            return line.replace(/^\s*(?:\d+[\.\)]?|[-•])\s*/, '').trim();
          })
          .filter(line => line.length > 0 && line.length < 100) // Filter out too long lines
          .slice(0, 3);
      }
    }

    // Ensure we have exactly 3 choices
    while (choices.length < 3) {
      const defaults = ["Continue", "Wait", "Respond", "Ask", "Observe", "React"];
      const defaultChoice = defaults[choices.length] || `Option ${choices.length + 1}`;
      choices.push(defaultChoice);
    }

    return {
      scene: scene || "The story continues...",
      choices: choices.slice(0, 3)
    };
  },

  // Generate story title using Gemini
  async generateStoryTitle(storyPrompt) {
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
};
