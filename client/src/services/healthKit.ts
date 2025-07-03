import { Platform } from "react-native";

// Health data types
export interface HealthData {
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  heartRate?: number;
  weight?: number;
  bodyFat?: number;
  sleepHours?: number;
  date: string;
  distance?: number;
}

export interface HealthPermissions {
  steps: boolean;
  calories: boolean;
  heartRate: boolean;
  weight: boolean;
  sleep: boolean;
}

class HealthKitService {
  private isInitialized = false;
  private healthKit: any = null;

  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === "ios") {
        // Dynamic import for iOS only
        const { default: AppleHealthKit } = await import("react-native-health");
        this.healthKit = AppleHealthKit;

        const permissions = {
          permissions: {
            read: [
              "Steps",
              "ActiveEnergyBurned",
              "BasalEnergyBurned",
              "HeartRate",
              "BodyMass",
              "BodyFatPercentage",
              "SleepAnalysis",
            ],
            write: [],
          },
        };

        return new Promise((resolve) => {
          this.healthKit.initHealthKit(permissions, (error: any) => {
            if (error) {
              console.error("HealthKit initialization failed:", error);
              resolve(false);
            } else {
              console.log("✅ HealthKit initialized successfully");
              this.isInitialized = true;
              resolve(true);
            }
          });
        });
      } else if (Platform.OS === "android") {
        // For Android, we would use Google Fit
        console.log("📱 Android detected - Google Fit integration needed");
        return false; // Not implemented yet
      } else {
        console.log("🌐 Web platform - health data not available");
        return false;
      }
    } catch (error) {
      console.error("💥 Health service initialization error:", error);
      return false;
    }
  }

  async checkPermissions(): Promise<HealthPermissions> {
    if (!this.isInitialized || Platform.OS !== "ios") {
      return {
        steps: false,
        calories: false,
        heartRate: false,
        weight: false,
        sleep: false,
      };
    }

    // For now, assume permissions are granted if initialized
    return {
      steps: true,
      calories: true,
      heartRate: true,
      weight: true,
      sleep: true,
    };
  }

  async requestPermissions(): Promise<boolean> {
    return await this.initialize();
  }

  async getStepsForDate(date: string): Promise<number> {
    if (!this.isInitialized || Platform.OS !== "ios") {
      return 0;
    }

    return new Promise((resolve) => {
      const options = {
        date: date,
        includeManuallyAdded: false,
      };

      this.healthKit.getStepCount(options, (error: any, results: any) => {
        if (error) {
          console.error("Error getting steps:", error);
          resolve(0);
        } else {
          resolve(results.value || 0);
        }
      });
    });
  }

  async getCaloriesForDate(date: string): Promise<number> {
    if (!this.isInitialized || Platform.OS !== "ios") {
      return 0;
    }

    return new Promise((resolve) => {
      const options = {
        startDate: new Date(date).toISOString(),
        endDate: new Date(
          new Date(date).getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      // Get active calories
      this.healthKit.getActiveEnergyBurned(
        options,
        (error: any, results: any[]) => {
          if (error) {
            console.error("Error getting active calories:", error);
            resolve(0);
          } else {
            const totalActive = results.reduce(
              (sum, entry) => sum + entry.value,
              0
            );

            // Get basal calories
            this.healthKit.getBasalEnergyBurned(
              options,
              (error: any, basalResults: any[]) => {
                if (error) {
                  console.error("Error getting basal calories:", error);
                  resolve(totalActive);
                } else {
                  const totalBasal = basalResults.reduce(
                    (sum, entry) => sum + entry.value,
                    0
                  );
                  resolve(totalActive + totalBasal);
                }
              }
            );
          }
        }
      );
    });
  }

  async getHeartRateForDate(date: string): Promise<number | null> {
    if (!this.isInitialized || Platform.OS !== "ios") {
      return null;
    }

    return new Promise((resolve) => {
      const options = {
        startDate: new Date(date).toISOString(),
        endDate: new Date(
          new Date(date).getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      this.healthKit.getHeartRateSamples(
        options,
        (error: any, results: any[]) => {
          if (error) {
            console.error("Error getting heart rate:", error);
            resolve(null);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            // Calculate average heart rate
            const average =
              results.reduce((sum, entry) => sum + entry.value, 0) /
              results.length;
            resolve(Math.round(average));
          }
        }
      );
    });
  }

  async getWeightForDate(date: string): Promise<number | null> {
    if (!this.isInitialized || Platform.OS !== "ios") {
      return null;
    }

    return new Promise((resolve) => {
      const options = {
        startDate: new Date(date).toISOString(),
        endDate: new Date(
          new Date(date).getTime() + 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      this.healthKit.getWeightSamples(options, (error: any, results: any[]) => {
        if (error) {
          console.error("Error getting weight:", error);
          resolve(null);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          // Get the most recent weight
          const latestWeight = results[results.length - 1];
          resolve(latestWeight.value);
        }
      });
    });
  }

  async getHealthDataForDate(date: string): Promise<HealthData> {
    console.log("📊 Getting health data for date:", date);

    const [steps, calories, heartRate, weight] = await Promise.all([
      this.getStepsForDate(date),
      this.getCaloriesForDate(date),
      this.getHeartRateForDate(date),
      this.getWeightForDate(date),
    ]);

    // Calculate active minutes based on steps (rough estimate)
    const activeMinutes = Math.round(steps / 100); // Rough estimate: 100 steps per minute

    const healthData: HealthData = {
      steps,
      caloriesBurned: Math.round(calories),
      activeMinutes,
      heartRate: heartRate || undefined,
      weight: weight || undefined,
      date,
    };

    console.log("✅ Health data retrieved:", healthData);
    return healthData;
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === "ios") {
      try {
        const { default: AppleHealthKit } = await import("react-native-health");
        return AppleHealthKit.isAvailable();
      } catch {
        return false;
      }
    }
    return false;
  }
}

export const healthKitService = new HealthKitService();
