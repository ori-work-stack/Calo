import AppleHealthKit, {
  HealthKitPermissions,
  HealthInputOptions,
} from "react-native-health";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.BodyMassIndex,
    ],
    write: [],
  },
};

export interface HealthData {
  steps: number;
  caloriesBurned: number;
  heartRate: number;
  distance: number;
  activeMinutes: number;
  date: Date;
}

export class HealthKitService {
  static initHealthKit(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Platform.OS !== "ios") {
        reject(new Error("HealthKit is only available on iOS"));
        return;
      }

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  }

  static async getDailyHealthData(
    date: Date = new Date()
  ): Promise<HealthData> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
    };

    try {
      const [steps, calories, heartRate, distance] = await Promise.all([
        this.getSteps(options),
        this.getActiveCalories(options),
        this.getHeartRate(options),
        this.getDistance(options),
      ]);

      const healthData: HealthData = {
        steps: steps || 0,
        caloriesBurned: calories || 0,
        heartRate: heartRate || 0,
        distance: distance || 0,
        activeMinutes: Math.floor((steps || 0) / 100), // Estimate active minutes
        date: date,
      };

      // Cache the data
      await this.cacheHealthData(healthData);

      return healthData;
    } catch (error) {
      console.error("Error fetching health data:", error);
      // Return cached data if available
      return (
        (await this.getCachedHealthData(date)) ||
        this.getDefaultHealthData(date)
      );
    }
  }

  private static async cacheHealthData(data: HealthData): Promise<void> {
    try {
      const key = `health_data_${data.date.toDateString()}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error caching health data:", error);
    }
  }

  private static async getCachedHealthData(
    date: Date
  ): Promise<HealthData | null> {
    try {
      const key = `health_data_${date.toDateString()}`;
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting cached health data:", error);
      return null;
    }
  }

  private static getDefaultHealthData(date: Date): HealthData {
    return {
      steps: 0,
      caloriesBurned: 0,
      heartRate: 0,
      distance: 0,
      activeMinutes: 0,
      date: date,
    };
  }

  static generateAIHealthPrompt(
    healthData: HealthData,
    userGoals?: any
  ): string {
    return `
      Daily Health Data Analysis:
      - Steps: ${healthData.steps} steps
      - Calories Burned: ${healthData.caloriesBurned} calories
      - Average Heart Rate: ${healthData.heartRate} bpm
      - Distance: ${(healthData.distance / 1000).toFixed(2)} km
      - Active Minutes: ${healthData.activeMinutes} minutes
      - Date: ${healthData.date.toLocaleDateString()}

      ${
        userGoals
          ? `User Goals:
      - Daily Calories: ${userGoals.daily_calories || "Not set"}
      - Protein: ${userGoals.protein_goal || "Not set"}g
      - Carbs: ${userGoals.carbs_goal || "Not set"}g
      - Fat: ${userGoals.fat_goal || "Not set"}g`
          : ""
      }

      Based on this activity data and nutritional goals, please provide:
      1. Personalized meal recommendations for today
      2. Caloric adjustments based on activity level
      3. Hydration recommendations
      4. Recovery nutrition suggestions if the activity level is high

      Please be specific and practical in your recommendations.
    `;
  }

  private static getSteps(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getStepCount(
        options,
        (callbackError: string, results: any) => {
          if (callbackError) {
            reject(new Error(callbackError));
          } else {
            resolve(results?.value || 0);
          }
        }
      );
    });
  }

  private static getActiveCalories(
    options: HealthInputOptions
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getActiveEnergyBurned(
        options,
        (callbackError: string, results: any) => {
          if (callbackError) {
            reject(new Error(callbackError));
          } else {
            resolve(results?.value || 0);
          }
        }
      );
    });
  }

  private static getHeartRate(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getHeartRateSamples(
        options,
        (callbackError: string, results: any) => {
          if (callbackError) {
            reject(new Error(callbackError));
          } else {
            const samples = results || [];
            if (samples.length > 0) {
              const average =
                samples.reduce(
                  (sum: number, sample: any) => sum + sample.value,
                  0
                ) / samples.length;
              resolve(Math.round(average));
            } else {
              resolve(0);
            }
          }
        }
      );
    });
  }

  private static getDistance(options: HealthInputOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.getDistanceWalkingRunning(
        options,
        (callbackError: string, results: any) => {
          if (callbackError) {
            reject(new Error(callbackError));
          } else {
            resolve(results?.value || 0);
          }
        }
      );
    });
  }

  static async syncWithAI(apiUrl: string, userId: string): Promise<string> {
    try {
      const healthData = await this.getDailyHealthData();

      const response = await fetch(
        `${apiUrl}/chat/health-based-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            healthData,
            prompt: this.generateAIHealthPrompt(healthData),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI recommendations");
      }

      const data = await response.json();
      return data.recommendation;
    } catch (error) {
      console.error("Error syncing health data with AI:", error);
      throw error;
    }
  }
}
