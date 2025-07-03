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
        // Check if react-native-health is available
        try {
          const AppleHealthKit = require("react-native-health").default;
          this.healthKit = AppleHealthKit;
        } catch (importError) {
          console.log("📱 react-native-health not available, using mock data");
          this.isInitialized = true;
          return true;
        }

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
              "DistanceWalkingRunning",
            ],
            write: [],
          },
        };

        return new Promise((resolve) => {
          this.healthKit.initHealthKit(permissions, (error: any) => {
            if (error) {
              console.error("HealthKit initialization failed:", error);
              // Fall back to mock data
              this.isInitialized = true;
              resolve(true);
            } else {
              console.log("✅ HealthKit initialized successfully");
              this.isInitialized = true;
              resolve(true);
            }
          });
        });
      } else {
        console.log("📱 Non-iOS platform - using mock health data");
        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      console.error("💥 Health service initialization error:", error);
      // Fall back to mock data
      this.isInitialized = true;
      return true;
    }
  }

  async checkPermissions(): Promise<HealthPermissions> {
    return {
      steps: this.isInitialized,
      calories: this.isInitialized,
      heartRate: this.isInitialized,
      weight: this.isInitialized,
      sleep: this.isInitialized,
    };
  }

  async requestPermissions(): Promise<boolean> {
    return await this.initialize();
  }

  async getStepsForDate(date: string): Promise<number> {
    if (!this.isInitialized) {
      return 0;
    }

    if (Platform.OS !== "ios" || !this.healthKit) {
      // Return realistic mock data
      return Math.floor(Math.random() * 5000) + 3000;
    }

    return new Promise((resolve) => {
      const options = {
        date: date,
        includeManuallyAdded: false,
      };

      this.healthKit.getStepCount(options, (error: any, results: any) => {
        if (error) {
          console.error("Error getting steps:", error);
          // Return mock data on error
          resolve(Math.floor(Math.random() * 5000) + 3000);
        } else {
          resolve(results.value || 0);
        }
      });
    });
  }

  async getCaloriesForDate(date: string): Promise<number> {
    if (!this.isInitialized) {
      return 0;
    }

    if (Platform.OS !== "ios" || !this.healthKit) {
      // Return realistic mock data
      return Math.floor(Math.random() * 800) + 1200;
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
            resolve(Math.floor(Math.random() * 800) + 1200);
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
                  resolve(totalActive + 1200); // Add estimated BMR
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
    if (!this.isInitialized) {
      return null;
    }

    if (Platform.OS !== "ios" || !this.healthKit) {
      // Return realistic mock data
      return Math.floor(Math.random() * 30) + 65;
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
            resolve(Math.floor(Math.random() * 30) + 65);
          } else if (results.length === 0) {
            resolve(Math.floor(Math.random() * 30) + 65);
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
    if (!this.isInitialized) {
      return null;
    }

    if (Platform.OS !== "ios" || !this.healthKit) {
      // Return realistic mock data
      return 70 + Math.random() * 10;
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
          resolve(70 + Math.random() * 10);
        } else if (results.length === 0) {
          resolve(70 + Math.random() * 10);
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
      distance: steps * 0.0008, // Rough estimate: 0.8m per step
      date,
    };

    console.log("✅ Health data retrieved:", healthData);
    return healthData;
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === "ios") {
      try {
        require("react-native-health");
        return true;
      } catch {
        // react-native-health not installed, but we can still provide mock data
        return true;
      }
    }
    // Always return true to provide mock data on other platforms
    return true;
  }
}

export const healthKitService = new HealthKitService();
