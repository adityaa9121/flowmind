const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.init();
  }

  init() {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  _handleError(error) {
    const msg = error.message || '';
    
    // Log the actual error stack securely on the server
    console.error('[GeminiService Error]:', error.stack || error);

    const customError = new Error();

    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      customError.status = 401;
      customError.message = 'Invalid AI Assistant configuration. Please verify API keys.';
    } else if (msg.includes('not found') || msg.includes('unsupported')) {
      customError.status = 400;
      customError.message = 'The configured AI model is unsupported or deprecated. Please check the model name.';
    } else if (msg.includes('quota') || msg.includes('429')) {
      customError.status = 429;
      customError.message = 'AI rate limit exceeded. Please try again later.';
    } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONN') || msg.includes('timeout')) {
      customError.status = 503;
      customError.message = 'Failed to reach Google AI servers. Please check your network connection.';
    } else {
      customError.status = 500;
      customError.message = 'An unexpected error occurred while communicating with the AI Assistant.';
    }

    return customError;
  }

  _extractJSON(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
         return JSON.parse(cleanedText);
      } catch {
         console.error('[GeminiService Error]: Failed to extract JSON from text:', text);
         throw new Error('AI returned an invalid response format.');
      }
    }
  }

  /**
   * Centralized AI Response Generator
   * @param {string|Array} prompt - The user prompt or message array
   * @param {string} systemInstruction - Optional system instruction
   * @param {Object} options - { history, jsonMode, retries, timeoutMs }
   */
  async generateAIResponse(prompt, systemInstruction = null, options = {}) {
    const { history = null, jsonMode = false, retries = 3, timeoutMs = 30000 } = options;
    
    if (!this.genAI) throw this._handleError(new Error('API_KEY_INVALID'));

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const modelOptions = { model: this.modelName };
        if (jsonMode) modelOptions.generationConfig = { responseMimeType: "application/json" };
        if (systemInstruction) modelOptions.systemInstruction = systemInstruction;

        const model = this.genAI.getGenerativeModel(modelOptions);
        
        let aiPromise;
        const startTime = Date.now();

        if (history !== null) {
          // Stateful Chat
          const formattedHistory = history.map(msg => ({
            role: msg.senderRole === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }));
          const chat = model.startChat({ history: formattedHistory });
          console.log(`[Gemini Request] Stateful Chat - Model: ${this.modelName} | History size: ${formattedHistory.length}`);
          aiPromise = chat.sendMessage(prompt);
        } else if (Array.isArray(prompt)) {
          // Stateless Chat (messages array)
          const lastMsg = prompt[prompt.length - 1].parts[0].text;
          const msgHistory = prompt.slice(0, -1);
          const chat = model.startChat({ history: msgHistory });
          console.log(`[Gemini Request] Stateless Chat - Model: ${this.modelName} | History size: ${msgHistory.length}`);
          aiPromise = chat.sendMessage(lastMsg);
        } else {
          // Standard Content Generation
          console.log(`[Gemini Request] Generate Content - Model: ${this.modelName} | JSON Mode: ${jsonMode}`);
          aiPromise = model.generateContent(prompt);
        }

        // Timeout Handling
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), timeoutMs)
        );

        const result = await Promise.race([aiPromise, timeoutPromise]);
        
        if (!result || !result.response) {
            throw new Error('Empty response from Gemini');
        }

        const text = result.response.text();
        console.log(`[Gemini Response] Success in ${Date.now() - startTime}ms`);
        
        if (jsonMode) {
          const parsed = this._extractJSON(text);
          return JSON.stringify(parsed);
        }
        
        return text;

      } catch (error) {
        attempt++;
        const msg = error.message || '';
        console.error(`[Gemini Attempt ${attempt} Failed]: ${msg}`);
        
        // Do not retry non-transient errors
        if (msg.includes('API_KEY_INVALID') || msg.includes('not found') || msg.includes('unsupported') || msg.includes('quota')) {
            throw this._handleError(error);
        }
        
        if (attempt > retries) {
          throw this._handleError(error);
        }
        
        // Exponential backoff
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
      }
    }
  }
}

module.exports = new GeminiService();
