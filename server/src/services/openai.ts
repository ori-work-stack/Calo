import OpenAI from 'openai';

const nutritionAnalysisPrompts = {
  english: `
Analyze this food image and provide detailed nutritional information. Please respond in JSON format with the following structure:

{
  "description": "Brief description of what you see in the image",
  "items": [
    {
      "name": "Item name",
      "quantity": "Estimated quantity/portion size",
      "calories": "Estimated calories",
      "protein": "Protein content in grams",
      "carbs": "Carbohydrate content in grams", 
      "fat": "Fat content in grams",
      "fiber": "Fiber content in grams",
      "sugar": "Sugar content in grams"
    }
  ],
  "totalCalories": "Total estimated calories for the entire meal",
  "totalProtein": "Total protein in grams",
  "totalCarbs": "Total carbohydrates in grams",
  "totalFat": "Total fat in grams",
  "healthScore": "Health score from 1-10 based on nutritional value",
  "recommendations": "Brief health recommendations or notes"
}

Please be as accurate as possible with portion sizes and nutritional estimates.
`,

  hebrew: `
נתח את תמונת המזון הזו וספק מידע תזונתי מפורט. אנא הגב בפורמט JSON עם המבנה הבא:

{
  "description": "תיאור קצר של מה שאתה רואה בתמונה",
  "items": [
    {
      "name": "שם הפריט",
      "quantity": "כמות/גודל מנה משוער",
      "calories": "קלוריות משוערות",
      "protein": "תכולת חלבון בגרמים",
      "carbs": "תכולת פחמימות בגרמים",
      "fat": "תכולת שומן בגרמים", 
      "fiber": "תכולת סיבים בגרמים",
      "sugar": "תכולת סוכר בגרמים"
    }
  ],
  "totalCalories": "סך כל הקלוריות המשוערות לארוחה השלמה",
  "totalProtein": "סך כל החלבון בגרמים",
  "totalCarbs": "סך כל הפחמימות בגרמים", 
  "totalFat": "סך כל השומן בגרמים",
  "healthScore": "ציון בריאות מ-1 עד 10 בהתבסס על ערך תזונתי",
  "recommendations": "המלצות בריאות קצרות או הערות"
}

אנא היה מדויק ככל האפשר עם גדלי המנות והערכות תזונתיות.
`
};

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeFood(base64Image: string, language: 'english' | 'hebrew' = 'english') {
    try {
      const prompt = nutritionAnalysisPrompts[language];
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing food with OpenAI:', error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService();