import OpenAI from 'openai';

export interface FunFact {
  id: number;
  text: string;
  type: 'city' | 'restaurant';
}

export class FunFactsService {
  private openai: OpenAI;

  constructor() {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateFunFacts(city: string, restaurantName: string): Promise<FunFact[]> {
    try {
      const prompt = `Generate exactly 5 fun facts for a restaurant scanner app:
      
      City: ${city}
      Restaurant: ${restaurantName}
      
      Create 2 fun facts about the city (${city}) and 3 fun facts about the restaurant (${restaurantName}).
      
      For city facts:
      - Interesting historical, cultural, or unique tidbits
      - Things locals might know but tourists find surprising
      - Brief (1-2 sentences each)
      
      For restaurant facts:
      - When it opened/was founded
      - Signature dishes or specialties
      - Unique features, awards, or interesting history
      - Famous customers or events
      - Special traditions or features
      
      Make them engaging like a knowledgeable local would share, factual but fun to read during a scanning process.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: 'You are a fun facts generator for a restaurant marketing app. Generate engaging, factual content that feels like insider knowledge from a local expert. Return as JSON with format: {"facts": [{"text": "fact text", "type": "city"}, {"text": "fact text", "type": "restaurant"}]}. Ensure exactly 2 city facts and 3 restaurant facts.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || '{"facts": []}');
      
      return result.facts.map((fact: any, index: number) => ({
        id: index + 1,
        text: fact.text,
        type: fact.type || (index < 2 ? 'city' : 'restaurant'),
      }));
    } catch (error) {
      console.error('Error generating fun facts:', error);
      // Return fallback facts if OpenAI fails
      return this.getFallbackFacts(city, restaurantName);
    }
  }

  private getFallbackFacts(city: string, restaurantName: string): FunFact[] {
    return [
      {
        id: 1,
        text: `${city} has a rich culinary history with unique local flavors.`,
        type: 'city',
      },
      {
        id: 2,
        text: `Local restaurants in ${city} serve authentic regional cuisine.`,
        type: 'city',
      },
      {
        id: 3,
        text: `${restaurantName} represents the local dining experience in ${city}.`,
        type: 'restaurant',
      },
      {
        id: 4,
        text: `Restaurants like ${restaurantName} contribute to the community's food culture.`,
        type: 'restaurant',
      },
      {
        id: 5,
        text: `${restaurantName} is part of ${city}'s diverse restaurant landscape.`,
        type: 'restaurant',
      },
    ];
  }
}