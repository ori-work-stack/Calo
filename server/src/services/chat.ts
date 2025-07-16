import OpenAI from "openai";
import { prisma } from "../lib/database";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export class ChatService {
  static async processMessage(
    userId: string,
    message: string,
    language: string = "hebrew"
  ): Promise<{
    response: string;
    messageId: string;
  }> {
    try {
      console.log("🤖 Processing chat message:", message);

      // Get user context for personalized advice
      const userContext = await this.getUserNutritionContext(userId);

      // Get recent chat history for context
      const recentHistory = await this.getChatHistory(userId, 10);

      // Create system prompt
      const systemPrompt = this.createNutritionSystemPrompt(
        language,
        userContext
      );

      // Build conversation context
      const conversationHistory = this.buildConversationHistory(
        recentHistory,
        message
      );

      let aiResponse: string;

      if (!openai || !process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key, using fallback response");
        aiResponse = this.getFallbackResponse(message, language);
      } else {
        // Call OpenAI
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        aiResponse =
          response.choices[0]?.message?.content ||
          "מצטער, לא הצלחתי לעבד את השאלה שלך.";
      }

      // Save conversation to database
      const messageId = await this.saveChatMessage(userId, message, aiResponse);

      return {
        response: aiResponse,
        messageId,
      };
    } catch (error) {
      console.error("💥 Chat service error:", error);
      return {
        response: this.getFallbackResponse(message, language),
        messageId: "",
      };
    }
  }

  private static createNutritionSystemPrompt(
    language: string,
    userContext: any
  ): string {
    const isHebrew = language === "hebrew";

    const basePrompt = isHebrew
      ? `אתה יועץ תזונה AI מומחה שעוזר למשתמשים עם שאלות תזונה.

⚠️ הגבלות חשובות:
- אתה לא נותן ייעוץ רפואי מוסמך
- במקרי בעיות בריאותיות חמורות - הפנה לרופא
- תמיד הדגש שזה ייעוץ כללי ולא תחליף לייעוץ מקצועי
- אם המשתמש יש אלרגיות - לעולם אל תציע מזונות המכילים אלרגנים אלה!

🎯 התמחויות שלך:
- המלצות תזונתיות מבוססות מדע
- ניתוח ערכים תזונתיים
- הצעות ארוחות מותאמות אישית
- טיפים לבישול בריא
- מידע על מזונות ורכיבים

📊 מידע על המשתמש:`
      : `You are an expert AI nutrition consultant helping users with nutrition questions.

⚠️ Important limitations:
- You do not provide licensed medical advice
- For serious health issues - refer to a doctor
- Always emphasize this is general advice and not a substitute for professional consultation
- If the user has allergies - NEVER suggest foods containing those allergens!

🎯 Your specialties:
- Science-based nutritional recommendations
- Nutritional value analysis
- Personalized meal suggestions
- Healthy cooking tips
- Food and ingredient information

📊 User information:`;

    const contextInfo = userContext
      ? `
יעדים יומיים: ${userContext.dailyGoals?.calories || "לא זמין"} קלוריות, ${
          userContext.dailyGoals?.protein || "לא זמין"
        }ג חלבון
צריכה היום: ${userContext.todayIntake?.calories || 0} קלוריות, ${
          userContext.todayIntake?.protein || 0
        }ג חלבון
הגבלות תזונתיות: ${userContext.restrictions?.join(", ") || "אין"}
אלרגיות: ${
          userContext.allergies?.join(", ") || "אין"
        } - חשוב ביותר: לעולם אל תציע מזונות עם אלרגנים אלה!
`
      : isHebrew
      ? "מידע על המשתמש לא זמין"
      : "User information not available";

    const instructions = isHebrew
      ? `
🔄 הוראות תגובה:
- תן תשובות מעשיות ופרקטיות
- השתמש במידע על המשתמש למתן המלצות מותאמות
- אם נשאלת על מזון ספציפי - תן ניתוח מפורט
- המלץ על ארוחות בהתאם ליעדים ולהגבלות
- תמיד שמור על טון ידידותי ומקצועי
- בדוק אלרגיות לפני כל המלצה!

עבור שאלות על מזון: תן מידע על קלוריות, חלבון, פחמימות, שומן, ויתמינים.
עבור המלצות ארוחות: קח בחשבון יעדים, הגבלות, אלרגיות ומה שנותר לצריכה היום.
עבור שאלות בישול: תן הצעות לשיפור התזונתי של המתכון.`
      : `
🔄 Response instructions:
- Give practical and actionable answers
- Use user information to provide personalized recommendations
- If asked about specific food - give detailed analysis
- Recommend meals according to goals and restrictions
- Always maintain a friendly and professional tone
- Check allergies before any recommendation!

For food questions: provide information about calories, protein, carbs, fat, and vitamins.
For meal recommendations: consider goals, restrictions, allergies and what's left to consume today.
For cooking questions: give suggestions for nutritional improvement of the recipe.`;

    return basePrompt + contextInfo + instructions;
  }

  private static async getUserNutritionContext(userId: string): Promise<any> {
    try {
      // Get user's nutrition goals
      const nutritionPlan = await prisma.nutritionPlan.findFirst({
        where: { user_id: userId },
      });

      // Get today's intake
      const today = new Date().toISOString().split("T")[0];
      const todayMeals = await prisma.meal.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      const todayIntake = todayMeals.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein_g || 0),
          carbs: acc.carbs + (meal.carbs_g || 0),
          fat: acc.fat + (meal.fats_g || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Get user questionnaire for restrictions and allergies
      const questionnaire = await prisma.userQuestionnaire.findFirst({
        where: { user_id: userId },
      });

      return {
        dailyGoals: nutritionPlan
          ? {
              calories: nutritionPlan.goal_calories,
              protein: nutritionPlan.goal_protein_g,
              carbs: nutritionPlan.goal_carbs_g,
              fat: nutritionPlan.goal_fats_g,
            }
          : null,
        todayIntake,
        restrictions: questionnaire?.dietary_style
          ? [questionnaire.dietary_style]
          : [],
        allergies: Array.isArray(questionnaire?.allergies)
          ? questionnaire.allergies
          : questionnaire?.allergies_text || [],
      };
    } catch (error) {
      console.error("Error getting user context:", error);
      return null;
    }
  }

  private static buildConversationHistory(
    recentHistory: any[],
    currentMessage: string
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Add recent history
    recentHistory.forEach((msg) => {
      history.push({ role: "user", content: msg.user_message });
      history.push({ role: "assistant", content: msg.ai_response });
    });

    // Add current message
    history.push({ role: "user", content: currentMessage });

    return history;
  }

  private static getFallbackResponse(
    message: string,
    language: string
  ): string {
    const isHebrew = language === "hebrew";
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("קלוריות") ||
      lowerMessage.includes("calories") ||
      lowerMessage.includes("כמה")
    ) {
      return isHebrew
        ? "כדי לתת לך מידע מדויק על קלוריות, אני צריך פרטים נוספים על המזון או הכמות. אתה יכול לצלם את המוצר או להכניס פרטים נוספים."
        : "To give you accurate calorie information, I need more details about the food or quantity. You can photograph the product or enter additional details.";
    }

    if (
      lowerMessage.includes("המלצה") ||
      lowerMessage.includes("recommendation") ||
      lowerMessage.includes("מה לאכול")
    ) {
      return isHebrew
        ? "אני אשמח להמליץ לך על ארוחות! בהתבסס על המידע שיש לי, אני מציע להתמקד בארוחות עם חלבון איכותי, ירקות טריים ופחמימות מורכבות. אתה יכול לספר לי על המטרות שלך או הגבלות תזונתיות ואתן המלצות ספציפיות יותר."
        : "I'd be happy to recommend meals for you! Based on the information I have, I suggest focusing on meals with quality protein, fresh vegetables, and complex carbohydrates. You can tell me about your goals or dietary restrictions and I'll give more specific recommendations.";
    }

    return isHebrew
      ? "אני כאן לעזור לך עם שאלות תזונה! אתה יכול לשאול אותי על ערכים תזונתיים, המלצות לארוחות, או כל שאלה אחרת הקשורה לתזונה. ⚠️ חשוב לזכור שזה ייעוץ כללי ולא תחליף לייעוץ רפואי מוסמך."
      : "I'm here to help with nutrition questions! You can ask me about nutritional values, meal recommendations, or any other nutrition-related questions. ⚠️ Important to remember this is general advice and not a substitute for licensed medical consultation.";
  }

  static async saveChatMessage(
    userId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<string> {
    try {
      const chatMessage = await prisma.chatMessage.create({
        data: {
          user_id: userId,
          user_message: userMessage,
          ai_response: aiResponse,
          created_at: new Date(),
        },
      });

      return chatMessage.message_id.toString();
    } catch (error) {
      console.error("Error saving chat message:", error);
      return "";
    }
  }

  static async getChatHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error("Error getting chat history:", error);
      return [];
    }
  }

  static async clearChatHistory(userId: string): Promise<void> {
    try {
      await prisma.chatMessage.deleteMany({
        where: { user_id: userId },
      });
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }

  static async processHealthBasedRecommendation(
    userId: string,
    healthData: any,
    customPrompt?: string
  ): Promise<string> {
    try {
      // Get user's complete profile
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        include: {
          questionnaires: true,
          nutritionPlans: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get the latest questionnaire
      const questionnaire = user.questionnaires?.[0];

      // Create comprehensive health-based prompt
      const healthPrompt =
        customPrompt ||
        `
        Health & Activity Analysis:
        - Steps Today: ${healthData.steps} steps
        - Calories Burned: ${healthData.caloriesBurned} calories
        - Average Heart Rate: ${healthData.heartRate} bpm
        - Distance Covered: ${(healthData.distance / 1000).toFixed(2)} km
        - Active Minutes: ${healthData.activeMinutes} minutes

        User Profile:
        - Daily Calorie Goal: ${
          user.nutritionPlans?.[0]?.goal_calories || "Not set"
        }
        - Protein Goal: ${
          user.nutritionPlans?.[0]?.goal_protein_g || "Not set"
        }g
        - Carbs Goal: ${user.nutritionPlans?.[0]?.goal_carbs_g || "Not set"}g
        - Fat Goal: ${user.nutritionPlans?.[0]?.goal_fats_g || "Not set"}g

        Personal Health Information:
        ${
          questionnaire?.allergies?.length
            ? `- ALLERGIES: ${questionnaire.allergies.join(
                ", "
              )} (CRITICAL: Never suggest foods containing these allergens!)`
            : ""
        }
        ${
          questionnaire?.medical_conditions_text?.length
            ? `- Medical Conditions: ${questionnaire.medical_conditions_text.join(
                ", "
              )}`
            : ""
        }
        ${
          questionnaire?.dietary_style
            ? `- Dietary Style: ${questionnaire.dietary_style}`
            : ""
        }
        ${
          questionnaire?.physical_activity_level
            ? `- Regular Activity Level: ${questionnaire.physical_activity_level}`
            : ""
        }

        Based on today's activity data and the user's health profile, provide:
        1. Personalized meal recommendations that match their activity level
        2. Caloric adjustments based on calories burned
        3. Hydration recommendations based on activity
        4. Recovery nutrition if the activity was intense
        5. Any warnings about foods to avoid due to allergies/conditions

        Be specific, safe, and practical in your recommendations. Answer in Hebrew.
      `;

      // Process with OpenAI
      if (!process.env.OPENAI_API_KEY || !openai) {
        return `על בסיס הפעילות שלך היום (${healthData.steps} צעדים, ${
          healthData.caloriesBurned
        } קלוריות שנשרפו), מומלץ:
        1. להגדיל את צריכת המים ל-${Math.ceil(
          healthData.activeMinutes / 10
        )} כוסות נוספות
        2. לאכול ארוחה עשירה בחלבון לשיקום השרירים
        3. לצרוך פחמימות איכותיות למילוי מאגרי האנרגיה

        הערה: זוהי המלצה כללית. לייעוץ אישי, יש להוסיף מפתח OpenAI.`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "אתה יועץ תזונה מקצועי הנותן המלצות מותאמות אישית על בסיס נתוני פעילות גופנית ופרופיל בריאותי. תן תשובות בעברית, בטוחות ומעשיות. אם יש אלרגיות - לעולם אל תציע מזונות המכילים אלרגנים אלה.",
          },
          {
            role: "user",
            content: healthPrompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return (
        completion.choices[0]?.message?.content ||
        "לא הצלחתי ליצור המלצות מותאמות אישית."
      );
    } catch (error) {
      console.error("Error in health-based recommendation:", error);
      throw error;
    }
  }
}
