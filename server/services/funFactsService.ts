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
      const prompt = `You are a licensed tourist that goes around all of the US and does restaurant and city reviews. You are tasked with ${city} and ${restaurantName}. Please provide 6 fun facts about them`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable tourist and restaurant reviewer. Generate exactly 6 interesting fun facts - 3 about the city and 3 about the restaurant/local dining scene. Keep each fact concise (under 50 words) and engaging. Return as JSON with format: {"facts": [{"text": "fact text", "type": "city"}, {"text": "fact text", "type": "restaurant"}]}',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"facts": []}');
      
      return result.facts.map((fact: any, index: number) => ({
        id: index + 1,
        text: fact.text,
        type: fact.type || (index < 3 ? 'city' : 'restaurant'),
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
        text: `${city} is known for its vibrant food scene and dining culture.`,
        type: 'city',
      },
      {
        id: 4,
        text: `${restaurantName} represents the local dining experience in ${city}.`,
        type: 'restaurant',
      },
      {
        id: 5,
        text: `Restaurants like ${restaurantName} contribute to the community's food culture.`,
        type: 'restaurant',
      },
      {
        id: 6,
        text: `${restaurantName} is part of ${city}'s diverse restaurant landscape.`,
        type: 'restaurant',
      },
    ];
  }
}