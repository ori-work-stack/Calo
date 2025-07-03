import { healthKitService, HealthData } from "./healthKit"; // Assuming healthKit.ts exists and exports HealthData
import { deviceConnectionService } from "./deviceConnections"; // Updated import
import { nutritionAPI } from "./api"; // Assuming api.ts exists and exports nutritionAPI
import axios, { AxiosInstance } from "axios"; // Combined import

export interface ConnectedDevice {
  id: string;
  name: string;
  type:
    | "APPLE_HEALTH"
    | "GOOGLE_FIT"
    | "FITBIT"
    | "GARMIN"
    | "WHOOP"
    | "SAMSUNG_HEALTH"
    | "POLAR";
  status: "CONNECTED" | "DISCONNECTED" | "SYNCING" | "ERROR";
  lastSync?: string;
  isPrimary: boolean;
}

export interface DailyBalance {
  caloriesIn: number;
  caloriesOut: number;
  balance: number;
  balanceStatus: "balanced" | "slight_imbalance" | "significant_imbalance";
}

// Create API instance for device endpoints
const deviceAxiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.61:5000/api",
  timeout: 30000,
  withCredentials: true,
});

class DeviceAPIService {
  async getConnectedDevices(): Promise<ConnectedDevice[]> {
    try {
      console.log("📱 Getting connected devices...");

      // First check server for connected devices
      try {
        const response = await deviceAxiosInstance.get("/devices");
        if (response.data.success) {
          const serverDevices = response.data.data.map((device: any) => ({
            id: device.connected_device_id,
            name: device.device_name,
            type: device.device_type,
            status: device.connection_status,
            lastSync: device.last_sync_time,
            isPrimary: device.is_primary_device,
          }));

          console.log("✅ Found", serverDevices.length, "devices from server");
          return serverDevices;
        }
      } catch (serverError) {
        console.warn(
          "⚠️ Server request failed, checking local devices:",
          serverError
        );
      }

      // Fallback to local device checking
      const devices: ConnectedDevice[] = [];

      // Check Apple Health availability
      if (await healthKitService.isAvailable()) {
        const isInitialized = await healthKitService.initialize();

        if (isInitialized) {
          devices.push({
            id: "apple_health",
            name: "Apple Health",
            type: "APPLE_HEALTH",
            status: "CONNECTED",
            lastSync: new Date().toISOString(),
            isPrimary: true,
          });
        }
      }

      console.log("✅ Found", devices.length, "local devices");
      return devices;
    } catch (error) {
      console.error("💥 Error getting connected devices:", error);
      return [];
    }
  }

  async connectDevice(deviceType: string): Promise<boolean> {
    try {
      console.log("🔗 Connecting device:", deviceType);

      if (deviceType === "APPLE_HEALTH") {
        const success = await healthKitService.requestPermissions();
        if (success) {
          // Register with server
          try {
            await deviceAxiosInstance.post("/devices/connect", {
              deviceType: "APPLE_HEALTH",
              deviceName: "Apple Health",
            });
          } catch (serverError) {
            console.warn("⚠️ Failed to register with server:", serverError);
          }

          console.log("✅ Apple Health connected successfully");
          return true;
        }
        return false;
      }

      // For other devices, use OAuth flow
      const result = await deviceConnectionService.connectDevice(deviceType);

      if (result.success && result.accessToken) {
        // Register with server
        try {
          await deviceAxiosInstance.post("/devices/connect", {
            deviceType,
            // Access display name from deviceConnectionService's config
            deviceName:
              deviceConnectionService.getDeviceConfig(deviceType).name ||
              `${deviceType} Device`,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
        } catch (serverError) {
          console.warn("⚠️ Failed to register with server:", serverError);
        }

        console.log("✅ Device connected successfully:", deviceType);
        return true;
      }

      console.log("❌ Device connection failed:", result.error);
      return false;
    } catch (error) {
      console.error("💥 Error connecting device:", error);
      return false;
    }
  }

  async syncDevice(deviceId: string): Promise<boolean> {
    try {
      console.log("🔄 Syncing device:", deviceId);

      if (deviceId === "apple_health") {
        // Get today's health data
        const today = new Date().toISOString().split("T")[0];
        const healthData = await healthKitService.getHealthDataForDate(today);

        // Send to server
        try {
          await deviceAxiosInstance.post(`/devices/${deviceId}/sync`, {
            activityData: {
              steps: healthData.steps,
              caloriesBurned: healthData.caloriesBurned,
              activeMinutes: healthData.activeMinutes,
              bmr: 1800, // Default BMR estimate
              heartRate: healthData.heartRate,
              weight: healthData.weight,
            },
          });
        } catch (serverError) {
          console.warn("⚠️ Failed to sync with server:", serverError);
        }

        console.log("📊 Synced Apple Health data:", healthData);
        return true;
      }

      // For other devices, fetch data using their APIs
      const devices = await this.getConnectedDevices();
      const device = devices.find((d) => d.id === deviceId);

      if (!device) {
        console.error("❌ Device not found:", deviceId);
        return false;
      }

      const today = new Date().toISOString().split("T")[0];
      let activityData: HealthData | null = null;

      // Get stored tokens
      const tokens = await deviceConnectionService.getDeviceTokens(device.type);

      if (!tokens.accessToken) {
        console.error("❌ No access token found for device:", device.type);
        return false;
      }

      // Fetch data based on device type
      switch (device.type) {
        case "GOOGLE_FIT":
          activityData = await deviceConnectionService.fetchGoogleFitData(
            tokens.accessToken,
            today
          );
          break;
        case "FITBIT":
          activityData = await deviceConnectionService.fetchFitbitData(
            tokens.accessToken,
            today
          );
          break;
        case "WHOOP":
          activityData = await deviceConnectionService.fetchWhoopData(
            tokens.accessToken,
            today
          );
          break;
        case "POLAR":
          activityData = await deviceConnectionService.fetchPolarData(
            tokens.accessToken,
            today
          );
          break;
        case "GARMIN":
          // Garmin fetch requires refresh token as well for OAuth 1.0a
          activityData = await deviceConnectionService.fetchGarminData(
            tokens.accessToken,
            tokens.refreshToken || "", // Ensure refreshToken is a string
            today
          );
          break;
        default:
          console.error("❌ Unsupported device type:", device.type);
          return false;
      }

      if (activityData) {
        // Send to server
        try {
          await deviceAxiosInstance.post(`/devices/${deviceId}/sync`, {
            activityData: {
              steps: activityData.steps || 0,
              caloriesBurned: activityData.caloriesBurned || 0,
              activeMinutes: activityData.activeMinutes || 0,
              bmr: 1800, // Default BMR estimate
              distance: activityData.distance || 0,
            },
          });
        } catch (serverError) {
          console.warn("⚠️ Failed to sync with server:", serverError);
        }

        console.log("📊 Synced device data:", activityData);
        return true;
      }

      return false;
    } catch (error) {
      console.error("💥 Error syncing device:", error);
      return false;
    }
  }

  async getActivityData(date: string): Promise<HealthData | null> {
    try {
      console.log("📊 Getting activity data for:", date);

      // Try server first
      try {
        const response = await deviceAxiosInstance.get(
          `/devices/activity/${date}/${date}`
        );
        if (response.data.success && response.data.data.length > 0) {
          const serverData = response.data.data[0];
          return {
            steps: serverData.steps || 0,
            caloriesBurned: serverData.calories_burned || 0,
            activeMinutes: serverData.active_minutes || 0,
            heartRate: serverData.heart_rate_avg,
            weight: serverData.weight_kg,
            date,
          };
        }
      } catch (serverError) {
        console.warn(
          "⚠️ Server request failed, checking local devices:",
          serverError
        );
      }

      // Fallback to local devices
      const devices = await this.getConnectedDevices();
      const appleHealthDevice = devices.find(
        (d) => d.type === "APPLE_HEALTH" && d.status === "CONNECTED"
      );

      if (appleHealthDevice) {
        return await healthKitService.getHealthDataForDate(date);
      }

      console.log("⚠️ No connected devices found");
      return null;
    } catch (error) {
      console.error("💥 Error getting activity data:", error);
      return null;
    }
  }

  async getDailyBalance(date: string): Promise<DailyBalance | null> {
    try {
      console.log("⚖️ Calculating daily balance for:", date);

      // Try server first
      try {
        const response = await deviceAxiosInstance.get(
          `/devices/balance/${date}`
        );
        if (response.data.success) {
          console.log("✅ Daily balance from server:", response.data.data);
          return response.data.data;
        }
      } catch (serverError) {
        console.warn(
          "⚠️ Server request failed, calculating locally:",
          serverError
        );
      }

      // Fallback to local calculation
      // Get calories consumed from nutrition API
      const nutritionStats = await nutritionAPI.getDailyStats(date);
      const caloriesIn = nutritionStats.calories || 0;

      // Get calories burned from health data
      const activityData = await this.getActivityData(date);
      const caloriesOut = activityData?.caloriesBurned || 0;

      // Only return balance if we have real data
      if (caloriesOut === 0) {
        console.log("⚠️ No activity data available - not showing balance");
        return null;
      }

      const balance = caloriesIn - caloriesOut;
      const balancePercent = Math.abs(balance) / caloriesOut;

      let balanceStatus:
        | "balanced"
        | "slight_imbalance"
        | "significant_imbalance";
      if (balancePercent <= 0.1) {
        balanceStatus = "balanced";
      } else if (balancePercent <= 0.25) {
        balanceStatus = "slight_imbalance";
      } else {
        balanceStatus = "significant_imbalance";
      }

      const dailyBalance: DailyBalance = {
        caloriesIn,
        caloriesOut,
        balance,
        balanceStatus,
      };

      console.log("✅ Daily balance calculated locally:", dailyBalance);
      return dailyBalance;
    } catch (error) {
      console.error("💥 Error calculating daily balance:", error);
      return null;
    }
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      console.log("🔌 Disconnecting device:", deviceId);

      // Get device info
      const devices = await this.getConnectedDevices();
      const device = devices.find((d) => d.id === deviceId);

      if (device) {
        // Clear local tokens
        await deviceConnectionService.clearDeviceTokens(device.type);
      }

      // Disconnect from server
      try {
        await deviceAxiosInstance.delete(`/devices/${deviceId}`);
      } catch (serverError) {
        console.warn("⚠️ Failed to disconnect from server:", serverError);
      }

      console.log("✅ Device disconnected successfully");
      return true;
    } catch (error) {
      console.error("💥 Error disconnecting device:", error);
      return false;
    }
  }

  // TOKEN REFRESH METHODS
  async refreshDeviceTokens(deviceType: string): Promise<boolean> {
    try {
      console.log("🔄 Refreshing tokens for:", deviceType);

      const tokens = await deviceConnectionService.getDeviceTokens(deviceType);

      if (!tokens.refreshToken) {
        console.error("❌ No refresh token found for:", deviceType);
        return false;
      }

      let newAccessToken: string | null = null;

      switch (deviceType) {
        case "GOOGLE_FIT":
          newAccessToken = await deviceConnectionService.refreshGoogleFitToken(
            tokens.refreshToken
          );
          break;
        case "FITBIT":
          newAccessToken = await deviceConnectionService.refreshFitbitToken(
            tokens.refreshToken
          );
          break;
        // Add other refresh methods as needed
        default:
          console.warn("⚠️ Token refresh not implemented for:", deviceType);
          return false;
      }

      if (newAccessToken) {
        console.log("✅ Tokens refreshed successfully for:", deviceType);
        return true;
      }

      return false;
    } catch (error) {
      console.error("💥 Error refreshing tokens:", error);
      return false;
    }
  }

  // BATCH SYNC ALL DEVICES
  async syncAllDevices(): Promise<{ success: number; failed: number }> {
    try {
      console.log("🔄 Syncing all devices...");

      const devices = await this.getConnectedDevices();
      const connectedDevices = devices.filter((d) => d.status === "CONNECTED");

      let success = 0;
      let failed = 0;

      for (const device of connectedDevices) {
        try {
          const result = await this.syncDevice(device.id);
          if (result) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error("💥 Failed to sync device:", device.id, error);
          failed++;
        }
      }

      console.log(`✅ Sync complete: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error("💥 Error syncing all devices:", error);
      return { success: 0, failed: 0 };
    }
  }
}

export const deviceAPI = new DeviceAPIService();
