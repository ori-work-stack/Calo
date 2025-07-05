export interface NutritionStatistics {
    averageCaloriesDaily: number;
    calorieGoalAchievementPercent: number;
    averageProteinDaily: number;
    averageCarbsDaily: number;
    averageFatsDaily: number;
    averageFiberDaily: number;
    averageSodiumDaily: number;
    averageSugarDaily: number;
    averageFluidsDaily: number;
    processedFoodPercentage: number;
    alcoholCaffeineIntake: number;
    vegetableFruitIntake: number;
    fullLoggingPercentage: number;
    allergenAlerts: string[];
    healthRiskPercentage: number;
    averageEatingHours: {
        start: string;
        end: string;
    };
    intermittentFastingHours: number;
    missedMealsAlert: number;
    nutritionScore: number;
    weeklyTrends: {
        calories: number[];
        protein: number[];
        carbs: number[];
        fats: number[];
    };
    insights: string[];
    recommendations: string[];
}
export declare class StatisticsService {
    static getNutritionStatistics(userId: string, period: "week" | "month" | "custom"): Promise<NutritionStatistics>;
    private static calculateStatistics;
    private static calculateNutritionScore;
    private static getEmptyStatistics;
    static generateAIInsights(meals: any[], stats: any): Promise<string[]>;
    static generateRecommendations(stats: any, user: any): Promise<string[]>;
    static generatePDFReport(userId: string): Promise<Buffer>;
    static generateInsights(userId: string): Promise<{
        insights: string[];
        recommendations: string[];
    }>;
    private static getDefaultInsights;
    private static getDefaultRecommendations;
    private static getEmptyStatisticsWithDefaults;
}
//# sourceMappingURL=statistics.d.ts.map