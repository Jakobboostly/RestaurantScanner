import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class PlayfulTooltipService {
  private static cache = new Map<string, string>();

  static async generateTooltip(context: string, element: string, data?: any): Promise<string> {
    const cacheKey = `${context}-${element}-${JSON.stringify(data)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a playful, encouraging restaurant marketing assistant. Create fun, engaging tooltip explanations that are:
            - Conversational and friendly (use "you" and contractions)
            - Encouraging and positive
            - Include relevant emojis (1-2 max)
            - Keep under 80 words
            - Make complex concepts feel approachable
            - Add personality without being unprofessional`
          },
          {
            role: "user",
            content: `Context: ${context}
Element: ${element}
Data: ${JSON.stringify(data || {})}

Generate a playful tooltip explanation for this element.`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const tooltip = response.choices[0].message.content?.trim() || "Here's some helpful info! ✨";
      this.cache.set(cacheKey, tooltip);
      return tooltip;
    } catch (error) {
      console.error('Failed to generate playful tooltip:', error);
      return "Here's some helpful info! ✨";
    }
  }

  static async generateMultipleTooltips(requests: Array<{context: string, element: string, data?: any}>): Promise<string[]> {
    try {
      const prompts = requests.map(req => 
        `${req.context} - ${req.element}: ${JSON.stringify(req.data || {})}`
      ).join('\n\n');

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a playful, encouraging restaurant marketing assistant. Create fun, engaging tooltip explanations. Each should be:
            - Conversational and friendly (use "you" and contractions)
            - Encouraging and positive
            - Include relevant emojis (1-2 max)
            - Keep under 80 words each
            - Make complex concepts feel approachable
            
            Return exactly ${requests.length} tooltips, one per line, in order.`
          },
          {
            role: "user",
            content: `Generate playful tooltips for these elements:\n\n${prompts}`
          }
        ],
        max_tokens: 200 * requests.length,
        temperature: 0.7
      });

      const tooltips = response.choices[0].message.content?.trim().split('\n').filter(t => t.trim()) || [];
      
      // Cache the results
      requests.forEach((req, index) => {
        const cacheKey = `${req.context}-${req.element}-${JSON.stringify(req.data)}`;
        if (tooltips[index]) {
          this.cache.set(cacheKey, tooltips[index].trim());
        }
      });
      
      return tooltips.length >= requests.length 
        ? tooltips.slice(0, requests.length).map(t => t.trim())
        : requests.map(() => "Here's some helpful info! ✨");
    } catch (error) {
      console.error('Failed to generate multiple playful tooltips:', error);
      return requests.map(() => "Here's some helpful info! ✨");
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}