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

  async generateFunFacts(city: string, restaurantName: string, state?: string): Promise<FunFact[]> {
    try {
      const locationString = state ? `${city}, ${state}` : city;
      const prompt = `Generate exactly 5 GENERAL fun facts for a restaurant scanner app:
      
      Location: ${locationString}
      Restaurant: ${restaurantName}
      
      Create 2 fun facts about the location (${locationString}) and 3 fun facts about the restaurant (${restaurantName}).
      
      CRITICAL: DO NOT make up specific details, dates, events, or claims that you cannot verify. Use general, widely-known information only.
      
      For location facts:
      - Well-known historical or cultural facts about ${city}${state ? ` or ${state}` : ''}
      - Geographic or demographic information that is generally known
      - AVOID specific dates, events, or claims unless universally known
      
      For restaurant facts:
      - Generic positive statements about local dining
      - General comments about the type of cuisine or restaurant concept
      - Broad statements about local food culture
      - AVOID specific opening dates, menu items, awards, or events
      
      Keep facts general, positive, and avoid specific claims that could be false.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: 'You are a fun facts generator for a restaurant marketing app. Generate ONLY general, widely-known information. DO NOT hallucinate specific details, dates, events, or claims. Keep facts generic and positive. Return as JSON with format: {"facts": [{"text": "fact text", "type": "city"}, {"text": "fact text", "type": "restaurant"}]}. Ensure exactly 2 location/city facts and 3 restaurant facts.',
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
      return this.getFallbackFacts(city, restaurantName, state);
    }
  }

  private getFallbackFacts(city: string, restaurantName: string, state?: string): FunFact[] {
    const locationString = state ? `${city}, ${state}` : city;
    return [
      {
        id: 1,
        text: `${locationString} has a rich culinary history with unique local flavors.`,
        type: 'city',
      },
      {
        id: 2,
        text: `Local restaurants in ${locationString} serve authentic regional cuisine.`,
        type: 'city',
      },
      {
        id: 3,
        text: `${restaurantName} represents the local dining experience in ${locationString}.`,
        type: 'restaurant',
      },
      {
        id: 4,
        text: `Restaurants like ${restaurantName} contribute to the community's food culture.`,
        type: 'restaurant',
      },
      {
        id: 5,
        text: `${restaurantName} is part of ${locationString}'s diverse restaurant landscape.`,
        type: 'restaurant',
      },
    ];
  }
}