interface DayData {
    date: string;
    caloriesGoal: number;
    caloriesActual: number;
    proteinGoal: number;
    proteinActual: number;
    carbsGoal: number;
    carbsActual: number;
    fatGoal: number;
    fatActual: number;
    mealCount: number;
    qualityScore: number;
    events: Array<{
        id: string;
        title: string;
        type: string;
    }>;
}
interface CalendarStats {
    monthlyProgress: number;
    streakDays: number;
    bestWeek: string;
    challengingWeek: string;
    improvementPercent: number;
    totalGoalDays: number;
    averageCalories: number;
    averageProtein: number;
    motivationalMessage: string;
}
export declare class CalendarService {
    private static getDefaultGoals;
    static getCalendarData(user_id: string, year: number, month: number): Promise<Record<string, DayData>>;
    static getStatistics(user_id: string, year: number, month: number): Promise<CalendarStats>;
    static addEvent(user_id: string, date: string, title: string, type: string): Promise<{
        id: string;
        title: string;
        type: string;
        date: string;
        createdAt: string;
    }>;
    static getEventsForDate(user_id: string, date: string): Promise<never[]>;
    private static calculateQualityScore;
    private static extractEventsFromMeals;
    private static calculateStreakDays;
    private static analyzeWeeks;
    private static generateMotivationalMessage;
}
export {};
//# sourceMappingURL=calendar.d.ts.map