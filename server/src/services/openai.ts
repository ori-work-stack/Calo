import OpenAI from "openai";

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
`,
};

const updateAnalysisPrompts = {
  english: `
Update the nutritional analysis for this meal based on the additional information provided by the user. 
The user has added: "{updateText}"

Please recalculate the nutritional values and respond in JSON format with the same structure as before:

{
  "description": "Updated description including the new information",
  "items": [
    {
      "name": "Item name",
      "quantity": "Updated quantity/portion size",
      "calories": "Updated calories",
      "protein": "Updated protein content in grams",
      "carbs": "Updated carbohydrate content in grams", 
      "fat": "Updated fat content in grams",
      "fiber": "Updated fiber content in grams",
      "sugar": "Updated sugar content in grams"
    }
  ],
  "totalCalories": "Updated total calories for the entire meal",
  "totalProtein": "Updated total protein in grams",
  "totalCarbs": "Updated total carbohydrates in grams",
  "totalFat": "Updated total fat in grams",
  "healthScore": "Updated health score from 1-10",
  "recommendations": "Updated health recommendations"
}

Make sure to add the nutritional values from the additional items mentioned by the user.
`,

  hebrew: `
עדכן את הניתוח התזונתי לארוחה זו בהתבסס על המידע הנוסף שסופק על ידי המשתמש.
המשתמש הוסיף: "{updateText}"

אנא חשב מחדש את הערכים התזונתיים והגב בפורמט JSON עם אותו מבנה כמו קודם:

{
  "description": "תיאור מעודכן הכולל את המידע החדש",
  "items": [
    {
      "name": "שם הפריט",
      "quantity": "כמות/גודל מנה מעודכן",
      "calories": "קלוריות מעודכנות",
      "protein": "תכולת חלבון מעודכנת בגרמים",
      "carbs": "תכולת פחמימות מעודכנת בגרמים",
      "fat": "תכולת שומן מעודכנת בגרמים", 
      "fiber": "תכולת סיבים מעודכנת בגרמים",
      "sugar": "תכולת סוכר מעודכנת בגרמים"
    }
  ],
  "totalCalories": "סך כל הקלוריות המעודכנות לארוחה השלמה",
  "totalProtein": "סך כל החלבון המעודכן בגרמים",
  "totalCarbs": "סך כל הפחמימות המעודכנות בגרמים", 
  "totalFat": "סך כל השומן המעודכן בגרמים",
  "healthScore": "ציון בריאות מעודכן מ-1 עד 10",
  "recommendations": "המלצות בריאות מעודכנות"
}

וודא להוסיף את הערכים התזונתיים מהפריטים הנוספים שהוזכרו על ידי המשתמש.
`,
};

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeFood(
    base64Image: string,
    language: "english" | "hebrew" = "english",
    updateText?: string
  ) {
    try {
      let prompt = nutritionAnalysisPrompts[language];

      if (updateText) {
        prompt = updateAnalysisPrompts[language].replace(
          "{updateText}",
          updateText
        );
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image.startsWith("data:")
                    ? base64Image
                    : `data:image/jpeg;base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid JSON response from OpenAI");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error analyzing food with OpenAI:", error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService();
