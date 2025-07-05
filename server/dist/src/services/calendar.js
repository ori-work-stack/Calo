"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const database_1 = require("../lib/database");
class CalendarService {
    // Default nutritional goals (can be customized per user later)
    static getDefaultGoals() {
        return {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 67,
        };
    }
    static async getCalendarData(user_id, year, month) {
        try {
            console.log("📅 Fetching calendar data for user:", user_id, year, month);
            // Get start and end dates for the month
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of the month
            console.log("📊 Date range:", startDate, "to", endDate);
            // Fetch meals for the month
            const meals = await database_1.prisma.meal.findMany({
                where: {
                    user_id: user_id,
                    createdAt: {
                        gte: startDate,
                        lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000), // Include the last day
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            });
            console.log("🍽️ Found", meals.length, "meals for the month");
            // Get user goals (for now using defaults)
            const goals = this.getDefaultGoals();
            // Group meals by date
            const mealsByDate = {};
            meals.forEach((meal) => {
                const dateStr = meal.createdAt.toISOString().split("T")[0];
                if (!mealsByDate[dateStr]) {
                    mealsByDate[dateStr] = [];
                }
                mealsByDate[dateStr].push(meal);
            });
            // Generate calendar data for each day of the month
            const calendarData = {};
            const daysInMonth = endDate.getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const dateStr = date.toISOString().split("T")[0];
                const dayMeals = mealsByDate[dateStr] || [];
                // Calculate totals for the day
                const totals = dayMeals.reduce((acc, meal) => ({
                    calories: acc.calories + (meal.calories || 0),
                    protein: acc.protein + (meal.protein_g || 0),
                    carbs: acc.carbs + (meal.carbs_g || 0),
                    fat: acc.fat + (meal.fats_g || 0),
                }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                // Calculate quality score (simple algorithm)
                const qualityScore = this.calculateQualityScore(totals, goals);
                // Get events for this date (stored in meal additives for now)
                const events = this.extractEventsFromMeals(dayMeals);
                calendarData[dateStr] = {
                    date: dateStr,
                    caloriesGoal: goals.calories,
                    caloriesActual: totals.calories,
                    proteinGoal: goals.protein,
                    proteinActual: totals.protein,
                    carbsGoal: goals.carbs,
                    carbsActual: totals.carbs,
                    fatGoal: goals.fat,
                    fatActual: totals.fat,
                    mealCount: dayMeals.length,
                    qualityScore,
                    events,
                };
            }
            console.log("✅ Generated calendar data for", Object.keys(calendarData).length, "days");
            return calendarData;
        }
        catch (error) {
            console.error("💥 Error fetching calendar data:", error);
            throw new Error("Failed to fetch calendar data");
        }
    }
    static async getStatistics(user_id, year, month) {
        try {
            console.log("📊 Calculating statistics for user:", user_id, year, month);
            // Get calendar data for current month
            const currentMonthData = await this.getCalendarData(user_id, year, month);
            // Get previous month data for comparison
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;
            const prevMonthData = await this.getCalendarData(user_id, prevYear, prevMonth);
            const goals = this.getDefaultGoals();
            const currentDays = Object.values(currentMonthData);
            const prevDays = Object.values(prevMonthData);
            // Calculate current month statistics
            const goalDays = currentDays.filter((day) => day.caloriesActual / day.caloriesGoal >= 1.0).length;
            const totalDays = currentDays.length;
            const monthlyProgress = totalDays > 0 ? (goalDays / totalDays) * 100 : 0;
            // Calculate streak days
            const streakDays = this.calculateStreakDays(currentDays);
            // Calculate averages
            const totalCalories = currentDays.reduce((sum, day) => sum + day.caloriesActual, 0);
            const totalProtein = currentDays.reduce((sum, day) => sum + day.proteinActual, 0);
            const averageCalories = totalDays > 0 ? totalCalories / totalDays : 0;
            const averageProtein = totalDays > 0 ? totalProtein / totalDays : 0;
            // Find best and challenging weeks
            const { bestWeek, challengingWeek } = this.analyzeWeeks(currentDays);
            // Calculate improvement vs previous month
            const prevGoalDays = prevDays.filter((day) => day.caloriesActual / day.caloriesGoal >= 1.0).length;
            const prevProgress = prevDays.length > 0 ? (prevGoalDays / prevDays.length) * 100 : 0;
            const improvementPercent = Math.round(monthlyProgress - prevProgress);
            // Generate motivational message
            const motivationalMessage = this.generateMotivationalMessage(monthlyProgress, streakDays, improvementPercent);
            const statistics = {
                monthlyProgress: Math.round(monthlyProgress),
                streakDays,
                bestWeek,
                challengingWeek,
                improvementPercent,
                totalGoalDays: goalDays,
                averageCalories: Math.round(averageCalories),
                averageProtein: Math.round(averageProtein),
                motivationalMessage,
            };
            console.log("✅ Generated statistics:", statistics);
            return statistics;
        }
        catch (error) {
            console.error("💥 Error calculating statistics:", error);
            throw new Error("Failed to calculate statistics");
        }
    }
    static async addEvent(user_id, date, title, type) {
        try {
            console.log("📝 Adding event for user:", user_id, { date, title, type });
            // For now, we'll store events in a simple way
            // In a real app, you might want a separate events table
            const eventId = `event_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            const event = {
                id: eventId,
                title,
                type,
                date,
                createdAt: new Date().toISOString(),
            };
            // Store event in user's additional data (you might want to create a separate table)
            // For now, we'll use a simple approach and return the event
            console.log("✅ Event created:", event);
            return event;
        }
        catch (error) {
            console.error("💥 Error adding event:", error);
            throw new Error("Failed to add event");
        }
    }
    static async getEventsForDate(user_id, date) {
        try {
            console.log("📅 Getting events for date:", date);
            // For now, return empty array
            // In a real implementation, you'd fetch from a proper events table
            return [];
        }
        catch (error) {
            console.error("💥 Error fetching events:", error);
            throw new Error("Failed to fetch events");
        }
    }
    // Helper methods
    static calculateQualityScore(totals, goals) {
        if (totals.calories === 0)
            return 0;
        // Simple quality score based on how close to goals
        const caloriesScore = Math.min(totals.calories / goals.calories, 1.5); // Cap at 150%
        const proteinScore = Math.min(totals.protein / goals.protein, 1.2); // Cap at 120%
        // Penalize if too far from goals
        const caloriesPenalty = Math.abs(1 - caloriesScore) * 2;
        const proteinPenalty = Math.abs(1 - proteinScore) * 1.5;
        const baseScore = 10;
        const finalScore = Math.max(1, baseScore - caloriesPenalty - proteinPenalty);
        return Math.round(finalScore);
    }
    static extractEventsFromMeals(meals) {
        // Extract events from meal additives_json
        const events = [];
        meals.forEach((meal) => {
            if (meal.additives_json && meal.additives_json.events) {
                events.push(...meal.additives_json.events);
            }
        });
        return events;
    }
    static calculateStreakDays(days) {
        let streak = 0;
        // Sort days by date (most recent first)
        const sortedDays = days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const day of sortedDays) {
            const progress = day.caloriesActual / day.caloriesGoal;
            if (progress >= 1.0) {
                streak++;
            }
            else {
                break;
            }
        }
        return streak;
    }
    static analyzeWeeks(days) {
        // Group days into weeks
        const weeks = [];
        let currentWeek = [];
        days.forEach((day, index) => {
            currentWeek.push(day);
            if (currentWeek.length === 7 || index === days.length - 1) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
        });
        let bestWeekScore = 0;
        let worstWeekScore = 100;
        let bestWeekIndex = 0;
        let worstWeekIndex = 0;
        weeks.forEach((week, index) => {
            const weekScore = week.reduce((sum, day) => {
                const progress = (day.caloriesActual / day.caloriesGoal) * 100;
                return sum + Math.min(progress, 100);
            }, 0) / week.length;
            if (weekScore > bestWeekScore) {
                bestWeekScore = weekScore;
                bestWeekIndex = index;
            }
            if (weekScore < worstWeekScore) {
                worstWeekScore = weekScore;
                worstWeekIndex = index;
            }
        });
        const formatWeek = (weekIndex) => {
            if (weeks[weekIndex] && weeks[weekIndex].length > 0) {
                const firstDay = weeks[weekIndex][0].date;
                const lastDay = weeks[weekIndex][weeks[weekIndex].length - 1].date;
                return `${firstDay} to ${lastDay} (${Math.round(weekIndex === bestWeekIndex ? bestWeekScore : worstWeekScore)}% avg)`;
            }
            return "No data available";
        };
        return {
            bestWeek: formatWeek(bestWeekIndex),
            challengingWeek: formatWeek(worstWeekIndex),
        };
    }
    static generateMotivationalMessage(monthlyProgress, streakDays, improvementPercent) {
        if (monthlyProgress >= 90) {
            return "🎉 Outstanding! You're crushing your goals!";
        }
        else if (monthlyProgress >= 75) {
            return "💪 Great job! You're doing really well!";
        }
        else if (monthlyProgress >= 50) {
            return "👍 Good progress! Keep pushing forward!";
        }
        else if (improvementPercent > 10) {
            return "📈 Nice improvement from last month!";
        }
        else if (streakDays >= 3) {
            return `🔥 ${streakDays} day streak! Keep it going!`;
        }
        else {
            return "🌟 Every step counts! You've got this!";
        }
    }
}
exports.CalendarService = CalendarService;
//# sourceMappingURL=calendar.js.map