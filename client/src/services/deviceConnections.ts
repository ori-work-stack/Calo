import { Platform, Linking, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";

// Device API configurations with REAL endpoints
const DEVICE_CONFIGS = {
  GARMIN: {
    name: "Garmin Connect",
    clientId:
      process.env.EXPO_PUBLIC_GARMIN_CLIENT_ID || "your-garmin-client-id",
    clientSecret:
      process.env.EXPO_PUBLIC_GARMIN_CLIENT_SECRET || "your-garmin-secret",
    authUrl: "https://connect.garmin.com/oauthConfirm",
    requestTokenUrl:
      "https://connectapi.garmin.com/oauth-service/oauth/request_token",
    accessTokenUrl:
      "https://connectapi.garmin.com/oauth-service/oauth/access_token",
    apiUrl: "https://apis.garmin.com/wellness-api/rest",
    scopes: ["wellness:read"],
  },
  GOOGLE_FIT: {
    name: "Google Fit",
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_FIT_CLIENT_ID || "your-google-client-id",
    clientSecret:
      process.env.EXPO_PUBLIC_GOOGLE_FIT_CLIENT_SECRET || "your-google-secret",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    apiUrl: "https://www.googleapis.com/fitness/v1",
    scopes: [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.location.read",
    ],
  },
  FITBIT: {
    name: "Fitbit",
    clientId:
      process.env.EXPO_PUBLIC_FITBIT_CLIENT_ID || "your-fitbit-client-id",
    clientSecret:
      process.env.EXPO_PUBLIC_FITBIT_CLIENT_SECRET || "your-fitbit-secret",
    authUrl: "https://www.fitbit.com/oauth2/authorize",
    tokenUrl: "https://api.fitbit.com/oauth2/token",
    apiUrl: "https://api.fitbit.com/1",
    scopes: [
      "activity",
      "heartrate",
      "nutrition",
      "profile",
      "sleep",
      "weight",
    ],
  },
  WHOOP: {
    name: "Whoop",
    clientId: process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID || "your-whoop-client-id",
    clientSecret:
      process.env.EXPO_PUBLIC_WHOOP_CLIENT_SECRET || "your-whoop-secret",
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    apiUrl: "https://api.prod.whoop.com/developer/v1",
    scopes: ["read:recovery", "read:cycles", "read:workout", "read:sleep"],
  },
  POLAR: {
    name: "Polar",
    clientId: process.env.EXPO_PUBLIC_POLAR_CLIENT_ID || "your-polar-client-id",
    clientSecret:
      process.env.EXPO_PUBLIC_POLAR_CLIENT_SECRET || "your-polar-secret",
    authUrl: "https://flow.polar.com/oauth2/authorization",
    tokenUrl: "https://polarremote.com/v2/oauth2/token",
    apiUrl: "https://www.polaraccesslink.com/v3",
    scopes: ["accesslink.read_all"],
  },
  SAMSUNG_HEALTH: {
    name: "Samsung Health",
    packageName: "com.sec.android.app.shealth",
    available: Platform.OS === "android",
  },
} as const;

export interface DeviceConnectionResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  deviceData?: any;
}

export interface HealthData {
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  heartRate?: number;
  weight?: number;
  distance?: number;
  date: string;
}

class DeviceConnectionService {
  // SECURE TOKEN STORAGE
  private async storeDeviceTokens(
    deviceType: string,
    accessToken: string,
    refreshToken?: string
  ) {
    try {
      const tokenKey = `device_token_${deviceType}`;
      const refreshKey = `device_refresh_${deviceType}`;

      await SecureStore.setItemAsync(tokenKey, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(refreshKey, refreshToken);
      }

      console.log("🔐 Device tokens stored securely for", deviceType);
    } catch (error) {
      console.error("💥 Failed to store device tokens:", error);
    }
  }

  async getDeviceTokens(deviceType: string): Promise<{
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      const tokenKey = `device_token_${deviceType}`;
      const refreshKey = `device_refresh_${deviceType}`;

      const accessToken = await SecureStore.getItemAsync(tokenKey);
      const refreshToken = await SecureStore.getItemAsync(refreshKey);

      return {
        accessToken: accessToken || undefined,
        refreshToken: refreshToken || undefined,
      };
    } catch (error) {
      console.error("💥 Failed to get device tokens:", error);
      return {};
    }
  }

  async clearDeviceTokens(deviceType: string) {
    try {
      const tokenKey = `device_token_${deviceType}`;
      const refreshKey = `device_refresh_${deviceType}`;

      await SecureStore.deleteItemAsync(tokenKey);
      await SecureStore.deleteItemAsync(refreshKey);

      console.log("🗑️ Device tokens cleared for", deviceType);
    } catch (error) {
      console.error("💥 Failed to clear device tokens:", error);
    }
  }

  getDeviceConfig(deviceType: string) {
    return DEVICE_CONFIGS[deviceType as keyof typeof DEVICE_CONFIGS];
  }

  // GOOGLE FIT INTEGRATION
  async connectGoogleFit(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Google Fit...");

      const config = DEVICE_CONFIGS.GOOGLE_FIT;
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

      const authUrl =
        `${config.authUrl}?` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(config.scopes.join(" "))}&` +
        `access_type=offline&` +
        `prompt=consent`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangeGoogleFitCode(
          result.params.code,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.storeDeviceTokens(
            "GOOGLE_FIT",
            tokenResponse.access_token,
            tokenResponse.refresh_token
          );

          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return { success: false, error: "Google Fit authorization cancelled" };
    } catch (error) {
      console.error("💥 Google Fit connection error:", error);
      return { success: false, error: "Failed to connect to Google Fit" };
    }
  }

  private async exchangeGoogleFitCode(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.GOOGLE_FIT;

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    return await response.json();
  }

  async fetchGoogleFitData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    try {
      const config = DEVICE_CONFIGS.GOOGLE_FIT;
      const startTime = new Date(date).getTime() * 1000000; // nanoseconds
      const endTime = startTime + 24 * 60 * 60 * 1000 * 1000000; // 24 hours

      // Fetch steps
      const stepsResponse = await fetch(
        `${config.apiUrl}/users/me/dataSources/derived:com.google.step_count.delta:com.google.android.gms:estimated_steps/datasets/${startTime}-${endTime}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const stepsData = await stepsResponse.json();
      const steps =
        stepsData.point?.reduce(
          (sum: number, point: any) => sum + (point.value?.[0]?.intVal || 0),
          0
        ) || 0;

      // Fetch calories
      const caloriesResponse = await fetch(
        `${config.apiUrl}/users/me/dataSources/derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended/datasets/${startTime}-${endTime}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const caloriesData = await caloriesResponse.json();
      const calories =
        caloriesData.point?.reduce(
          (sum: number, point: any) => sum + (point.value?.[0]?.fpVal || 0),
          0
        ) || 0;

      return {
        steps,
        caloriesBurned: Math.round(calories),
        activeMinutes: Math.round(steps / 100), // Rough estimate
        date,
      };
    } catch (error) {
      console.error("💥 Error fetching Google Fit data:", error);
      return null;
    }
  }

  // FITBIT INTEGRATION
  async connectFitbit(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Fitbit...");

      const config = DEVICE_CONFIGS.FITBIT;
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

      const authUrl =
        `${config.authUrl}?` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(config.scopes.join(" "))}&` +
        `expires_in=604800`; // 1 week

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangeFitbitCode(
          result.params.code,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.storeDeviceTokens(
            "FITBIT",
            tokenResponse.access_token,
            tokenResponse.refresh_token
          );

          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return { success: false, error: "Fitbit authorization cancelled" };
    } catch (error) {
      console.error("💥 Fitbit connection error:", error);
      return { success: false, error: "Failed to connect to Fitbit" };
    }
  }

  private async exchangeFitbitCode(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.FITBIT;

    const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    return await response.json();
  }

  async fetchFitbitData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    try {
      const config = DEVICE_CONFIGS.FITBIT;

      const response = await fetch(
        `${config.apiUrl}/user/-/activities/date/${date}.json`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      const summary = data.summary;

      return {
        steps: summary.steps || 0,
        caloriesBurned: summary.caloriesOut || 0,
        activeMinutes:
          (summary.veryActiveMinutes || 0) + (summary.fairlyActiveMinutes || 0),
        distance: summary.distances?.[0]?.distance || 0,
        date,
      };
    } catch (error) {
      console.error("💥 Error fetching Fitbit data:", error);
      return null;
    }
  }

  // WHOOP INTEGRATION
  async connectWhoop(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Whoop...");

      const config = DEVICE_CONFIGS.WHOOP;
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

      const authUrl =
        `${config.authUrl}?` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(config.scopes.join(" "))}`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangeWhoopCode(
          result.params.code,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.storeDeviceTokens(
            "WHOOP",
            tokenResponse.access_token,
            tokenResponse.refresh_token
          );

          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return { success: false, error: "Whoop authorization cancelled" };
    } catch (error) {
      console.error("💥 Whoop connection error:", error);
      return { success: false, error: "Failed to connect to Whoop" };
    }
  }

  private async exchangeWhoopCode(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.WHOOP;

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    return await response.json();
  }

  async fetchWhoopData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    try {
      const config = DEVICE_CONFIGS.WHOOP;
      const startDate = new Date(date).toISOString();
      const endDate = new Date(
        new Date(date).getTime() + 24 * 60 * 60 * 1000
      ).toISOString();

      const response = await fetch(
        `${config.apiUrl}/cycle?start=${startDate}&end=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      const cycle = data.records?.[0];

      if (cycle) {
        return {
          steps: 0, // Whoop doesn't track steps
          caloriesBurned: cycle.strain?.kilojoule || 0,
          activeMinutes: cycle.strain?.workouts_duration_milli
            ? Math.round(cycle.strain.workouts_duration_milli / 60000)
            : 0,
          heartRate: cycle.recovery?.heart_rate_variability_rmssd || 0,
          date,
        };
      }

      return null;
    } catch (error) {
      console.error("💥 Error fetching Whoop data:", error);
      return null;
    }
  }

  // POLAR INTEGRATION
  async connectPolar(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Polar...");

      const config = DEVICE_CONFIGS.POLAR;
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

      const authUrl =
        `${config.authUrl}?` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(config.scopes.join(" "))}`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangePolarCode(
          result.params.code,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.storeDeviceTokens(
            "POLAR",
            tokenResponse.access_token,
            tokenResponse.refresh_token
          );

          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return { success: false, error: "Polar authorization cancelled" };
    } catch (error) {
      console.error("💥 Polar connection error:", error);
      return { success: false, error: "Failed to connect to Polar" };
    }
  }

  private async exchangePolarCode(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.POLAR;

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${config.clientId}:${config.clientSecret}`
        )}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    return await response.json();
  }

  async fetchPolarData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    try {
      const config = DEVICE_CONFIGS.POLAR;

      const response = await fetch(
        `${config.apiUrl}/users/daily-activity?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      const activity = data.data?.[0];

      if (activity) {
        return {
          steps: activity.steps || 0,
          caloriesBurned: activity.calories || 0,
          activeMinutes: activity.active_time_seconds
            ? Math.round(activity.active_time_seconds / 60)
            : 0,
          heartRate: activity.heart_rate_avg || 0,
          date,
        };
      }

      return null;
    } catch (error) {
      console.error("💥 Error fetching Polar data:", error);
      return null;
    }
  }

  // GARMIN INTEGRATION (OAuth 1.0a)
  async connectGarmin(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Garmin...");

      // Garmin uses OAuth 1.0a which is more complex
      // For now, return a placeholder implementation
      Alert.alert(
        "Garmin Integration",
        "Garmin integration requires OAuth 1.0a implementation. Please contact support for setup assistance.",
        [{ text: "OK" }]
      );

      return {
        success: false,
        error: "Garmin OAuth 1.0a implementation required",
      };
    } catch (error) {
      console.error("💥 Garmin connection error:", error);
      return { success: false, error: "Failed to connect to Garmin" };
    }
  }

  async fetchGarminData(
    accessToken: string,
    tokenSecret: string,
    date: string
  ): Promise<HealthData | null> {
    // Placeholder for Garmin data fetching
    console.log("📊 Garmin data fetching requires OAuth 1.0a signing");
    return null;
  }

  // SAMSUNG HEALTH INTEGRATION
  async connectSamsungHealth(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Samsung Health...");

      if (Platform.OS !== "android") {
        return {
          success: false,
          error: "Samsung Health is only available on Android",
        };
      }

      const canOpen = await Linking.canOpenURL("shealth://");

      if (!canOpen) {
        Alert.alert(
          "Samsung Health Required",
          "Please install Samsung Health from the Google Play Store",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Install",
              onPress: () =>
                Linking.openURL(
                  "market://details?id=com.sec.android.app.shealth"
                ),
            },
          ]
        );
        return { success: false, error: "Samsung Health not installed" };
      }

      Alert.alert(
        "Samsung Health Integration",
        "Samsung Health integration requires the Samsung Health SDK. Please contact support for setup assistance.",
        [{ text: "OK" }]
      );

      return {
        success: false,
        error: "Samsung Health SDK implementation required",
      };
    } catch (error) {
      console.error("💥 Samsung Health connection error:", error);
      return { success: false, error: "Failed to connect to Samsung Health" };
    }
  }

  // TOKEN REFRESH METHODS
  async refreshGoogleFitToken(refreshToken: string): Promise<string | null> {
    try {
      const config = DEVICE_CONFIGS.GOOGLE_FIT;

      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        await this.storeDeviceTokens(
          "GOOGLE_FIT",
          data.access_token,
          refreshToken
        );
        return data.access_token;
      }

      return null;
    } catch (error) {
      console.error("💥 Error refreshing Google Fit token:", error);
      return null;
    }
  }

  async refreshFitbitToken(refreshToken: string): Promise<string | null> {
    try {
      const config = DEVICE_CONFIGS.FITBIT;
      const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        await this.storeDeviceTokens(
          "FITBIT",
          data.access_token,
          data.refresh_token
        );
        return data.access_token;
      }

      return null;
    } catch (error) {
      console.error("💥 Error refreshing Fitbit token:", error);
      return null;
    }
  }

  // MAIN CONNECTION METHOD
  async connectDevice(deviceType: string): Promise<DeviceConnectionResult> {
    console.log("🔗 Connecting to device:", deviceType);

    try {
      switch (deviceType) {
        case "GARMIN":
          return await this.connectGarmin();
        case "GOOGLE_FIT":
          return await this.connectGoogleFit();
        case "FITBIT":
          return await this.connectFitbit();
        case "WHOOP":
          return await this.connectWhoop();
        case "POLAR":
          return await this.connectPolar();
        case "SAMSUNG_HEALTH":
          return await this.connectSamsungHealth();
        default:
          return { success: false, error: "Unsupported device type" };
      }
    } catch (error) {
      console.error("💥 Device connection error:", error);
      return { success: false, error: "Connection failed" };
    }
  }
}

export const deviceConnectionService = new DeviceConnectionService();
