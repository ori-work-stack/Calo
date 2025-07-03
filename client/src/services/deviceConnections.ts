// deviceConnections.ts (Fixed)
import { Platform, Linking, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, AuthRequest } from "expo-auth-session";
// For persistent storage in a real app, you'd use something like:
// import * as SecureStore from 'expo-secure-store';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Device API configurations
const DEVICE_CONFIGS = {
  GARMIN: {
    name: "Garmin Connect",
    clientId:
      process.env.EXPO_PUBLIC_GARMIN_CLIENT_ID || "your-garmin-client-id",
    clientSecret:
      process.env.EXPO_PUBLIC_GARMIN_CLIENT_SECRET || "your-garmin-secret",
    authUrl: "https://connect.garmin.com/oauthConfirm",
    tokenUrl: "https://connectapi.garmin.com/oauth-service/oauth/request_token",
    accessTokenUrl:
      "https://connectapi.garmin.com/oauth-service/oauth/access_token",
    apiUrl: "https://apis.garmin.com/wellness-api/rest",
    scopes: ["wellness:read"],
  },
  GOOGLE_FIT: {
    name: "Google Fit",
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_FIT_CLIENT_ID || "your-google-client-id",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    apiUrl: "https://www.googleapis.com/fitness/v1",
    scopes: [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
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
  SAMSUNG_HEALTH: {
    name: "Samsung Health",
    packageName: "com.sec.android.app.shealth",
    available: Platform.OS === "android",
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
} as const;

export interface DeviceConnectionResult {
  success: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number;
  error?: string;
  deviceData?: {
    displayName?: string;
  };
}

export interface DeviceTokens {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn?: number;
}

export interface HealthData {
  steps?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
  heartRate?: number;
  weight?: number;
  distance?: number;
  date: string;
}

class DeviceConnectionService {
  private _tokenStore: Map<
    string,
    { accessToken: string; refreshToken?: string; expiresIn?: number }
  > = new Map();

  constructor() {
    WebBrowser.maybeCompleteAuthSession();
  }

  // TOKEN STORAGE METHODS
  async setDeviceTokens(
    deviceType: string,
    tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }
  ) {
    console.log(`🔒 Storing tokens for ${deviceType}`);
    this._tokenStore.set(deviceType, tokens);
  }

  async getDeviceTokens(deviceType: string): Promise<DeviceTokens> {
    console.log(`🔑 Retrieving tokens for ${deviceType}`);
    const stored = this._tokenStore.get(deviceType);
    return {
      accessToken: stored?.accessToken || null,
      refreshToken: stored?.refreshToken || null,
      expiresIn: stored?.expiresIn,
    };
  }

  async clearDeviceTokens(deviceType: string) {
    console.log(`🗑️ Clearing tokens for ${deviceType}`);
    this._tokenStore.delete(deviceType);
  }

  // OAUTH CONNECTION METHODS
  async connectGarmin(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Garmin...");

      const config = DEVICE_CONFIGS.GARMIN;
      const redirectUri = makeRedirectUri();

      // Note: Garmin uses OAuth 1.0a which is more complex
      // This is a simplified implementation
      const oauth1AuthUrl =
        `${config.authUrl}?` +
        `oauth_consumer_key=${config.clientId}&` +
        `oauth_signature_method=HMAC-SHA1&` +
        `oauth_timestamp=${Math.floor(Date.now() / 1000)}&` +
        `oauth_nonce=${Math.random().toString(36).substring(2, 12)}&` +
        `oauth_version=1.0&` +
        `oauth_callback=${encodeURIComponent(redirectUri)}`;

      const request = new AuthRequest(
        {
          clientId: config.clientId,
          redirectUri: redirectUri,
          responseType: "code",
          scopes: [],
        },
        { authorizationEndpoint: oauth1AuthUrl }
      );

      const result = await request.promptAsync({ returnUrl: redirectUri });

      if (
        result.type === "success" &&
        result.params.oauth_token &&
        result.params.oauth_verifier
      ) {
        const tokenResponse = await this.exchangeGarminToken(
          result.params.oauth_token as string,
          result.params.oauth_verifier as string
        );

        if (tokenResponse.oauth_token && tokenResponse.oauth_token_secret) {
          await this.setDeviceTokens(config.name, {
            accessToken: tokenResponse.oauth_token,
            refreshToken: tokenResponse.oauth_token_secret,
          });
          return {
            success: true,
            accessToken: tokenResponse.oauth_token,
            refreshToken: tokenResponse.oauth_token_secret,
            deviceData: { displayName: config.name },
          };
        }
      }

      return {
        success: false,
        error: "Garmin authorization cancelled or failed.",
      };
    } catch (error: any) {
      console.error("💥 Garmin connection error:", error);
      return {
        success: false,
        error: `Failed to connect to Garmin: ${error.message}`,
      };
    }
  }

  private async exchangeGarminToken(oauthToken: string, oauthVerifier: string) {
    const config = DEVICE_CONFIGS.GARMIN;

    try {
      const response = await fetch(config.accessTokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`,
      });

      const text = await response.text();
      const params = new URLSearchParams(text);

      return {
        oauth_token: params.get("oauth_token"),
        oauth_token_secret: params.get("oauth_token_secret"),
      };
    } catch (error) {
      console.error("💥 Garmin token exchange error:", error);
      return { oauth_token: null, oauth_token_secret: null };
    }
  }

  async connectGoogleFit(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Google Fit...");

      const config = DEVICE_CONFIGS.GOOGLE_FIT;
      const redirectUri = makeRedirectUri();

      const request = new AuthRequest(
        {
          clientId: config.clientId,
          scopes: config.scopes,
          redirectUri: redirectUri,
          responseType: "code",
          extraParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
        { authorizationEndpoint: config.authUrl }
      );

      const result = await request.promptAsync({ returnUrl: redirectUri });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangeGoogleFitToken(
          result.params.code as string,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.setDeviceTokens(config.name, {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
          });
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return {
        success: false,
        error: "Google Fit authorization cancelled or failed.",
      };
    } catch (error: any) {
      console.error("💥 Google Fit connection error:", error);
      return {
        success: false,
        error: `Failed to connect to Google Fit: ${error.message}`,
      };
    }
  }

  private async exchangeGoogleFitToken(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.GOOGLE_FIT;

    try {
      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body:
          `code=${code}&` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `grant_type=authorization_code`,
      });

      return await response.json();
    } catch (error) {
      console.error("💥 Google Fit token exchange error:", error);
      return {};
    }
  }

  async connectFitbit(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Fitbit...");

      const config = DEVICE_CONFIGS.FITBIT;
      const redirectUri = makeRedirectUri();

      const request = new AuthRequest(
        {
          clientId: config.clientId,
          scopes: config.scopes,
          redirectUri: redirectUri,
          responseType: "code",
          extraParams: {
            expires_in: "604800",
          },
        },
        { authorizationEndpoint: config.authUrl }
      );

      const result = await request.promptAsync({ returnUrl: redirectUri });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangeFitbitToken(
          result.params.code as string,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.setDeviceTokens(config.name, {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
          });
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return {
        success: false,
        error: "Fitbit authorization cancelled or failed.",
      };
    } catch (error: any) {
      console.error("💥 Fitbit connection error:", error);
      return {
        success: false,
        error: `Failed to connect to Fitbit: ${error.message}`,
      };
    }
  }

  private async exchangeFitbitToken(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.FITBIT;

    try {
      const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body:
          `client_id=${config.clientId}&` +
          `grant_type=authorization_code&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `code=${code}`,
      });

      return await response.json();
    } catch (error) {
      console.error("💥 Fitbit token exchange error:", error);
      return {};
    }
  }

  async connectWhoop(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Whoop...");

      const config = DEVICE_CONFIGS.WHOOP;
      const redirectUri = makeRedirectUri();

      const request = new AuthRequest(
        {
          clientId: config.clientId,
          scopes: config.scopes,
          redirectUri: redirectUri,
          responseType: "code",
          extraParams: {
            state: Math.random().toString(36).substring(2, 12),
          },
        },
        { authorizationEndpoint: config.authUrl }
      );

      const result = await request.promptAsync({ returnUrl: redirectUri });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangeWhoopToken(
          result.params.code as string,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.setDeviceTokens(config.name, {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
          });
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return {
        success: false,
        error: "Whoop authorization cancelled or failed.",
      };
    } catch (error: any) {
      console.error("💥 Whoop connection error:", error);
      return {
        success: false,
        error: `Failed to connect to Whoop: ${error.message}`,
      };
    }
  }

  private async exchangeWhoopToken(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.WHOOP;

    try {
      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("💥 Whoop token exchange error:", error);
      return {};
    }
  }

  async connectPolar(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Polar...");

      const config = DEVICE_CONFIGS.POLAR;
      const redirectUri = makeRedirectUri();

      const request = new AuthRequest(
        {
          clientId: config.clientId,
          scopes: config.scopes,
          redirectUri: redirectUri,
          responseType: "code",
        },
        { authorizationEndpoint: config.authUrl }
      );

      const result = await request.promptAsync({ returnUrl: redirectUri });

      if (result.type === "success" && result.params.code) {
        const tokenResponse = await this.exchangePolarToken(
          result.params.code as string,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await this.setDeviceTokens(config.name, {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
          });
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
            deviceData: { displayName: config.name },
          };
        }
      }

      return {
        success: false,
        error: "Polar authorization cancelled or failed.",
      };
    } catch (error: any) {
      console.error("💥 Polar connection error:", error);
      return {
        success: false,
        error: `Failed to connect to Polar: ${error.message}`,
      };
    }
  }

  private async exchangePolarToken(code: string, redirectUri: string) {
    const config = DEVICE_CONFIGS.POLAR;

    try {
      const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body:
          `grant_type=authorization_code&` +
          `code=${code}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}`,
      });

      return await response.json();
    } catch (error) {
      console.error("💥 Polar token exchange error:", error);
      return {};
    }
  }

  async connectSamsungHealth(): Promise<DeviceConnectionResult> {
    try {
      console.log("🔗 Connecting to Samsung Health...");

      if (Platform.OS !== "android") {
        return {
          success: false,
          error: "Samsung Health is only available on Android",
        };
      }

      const config = DEVICE_CONFIGS.SAMSUNG_HEALTH;

      const canOpen = await Linking.canOpenURL(`shealth://`);
      if (!canOpen) {
        Alert.alert(
          "Samsung Health Not Found",
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
        "Samsung Health integration requires additional SDK setup. Please refer to Samsung Health SDK documentation.",
        [{ text: "OK" }]
      );

      return { success: false, error: "SDK integration required" };
    } catch (error: any) {
      console.error("💥 Samsung Health connection error:", error);
      return {
        success: false,
        error: `Failed to connect to Samsung Health: ${error.message}`,
      };
    }
  }

  // DATA FETCHING METHODS
  async fetchGoogleFitData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    console.log(
      `Fetching Google Fit data for ${date} with token: ${accessToken.substring(
        0,
        10
      )}...`
    );

    try {
      // For now, return dummy data. In a real implementation, make API calls here
      return {
        date,
        steps: Math.floor(Math.random() * 10000) + 5000,
        caloriesBurned: Math.floor(Math.random() * 1000) + 1500,
        activeMinutes: Math.floor(Math.random() * 120) + 30,
        heartRate: Math.floor(Math.random() * 30) + 70,
        weight: 70 + Math.random() * 5,
        distance: Math.floor(Math.random() * 10) + 2,
      };
    } catch (error) {
      console.error("💥 Google Fit data fetch error:", error);
      return null;
    }
  }

  async fetchFitbitData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    console.log(
      `Fetching Fitbit data for ${date} with token: ${accessToken.substring(
        0,
        10
      )}...`
    );

    try {
      return {
        date,
        steps: Math.floor(Math.random() * 9000) + 4000,
        caloriesBurned: Math.floor(Math.random() * 900) + 1400,
        activeMinutes: Math.floor(Math.random() * 100) + 20,
        heartRate: Math.floor(Math.random() * 25) + 65,
        weight: 65 + Math.random() * 7,
        distance: Math.floor(Math.random() * 8) + 1,
      };
    } catch (error) {
      console.error("💥 Fitbit data fetch error:", error);
      return null;
    }
  }

  async fetchWhoopData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    console.log(
      `Fetching Whoop data for ${date} with token: ${accessToken.substring(
        0,
        10
      )}...`
    );

    try {
      return {
        date,
        steps: Math.floor(Math.random() * 7000) + 3000,
        caloriesBurned: Math.floor(Math.random() * 800) + 1300,
        activeMinutes: Math.floor(Math.random() * 90) + 15,
        heartRate: Math.floor(Math.random() * 20) + 60,
        weight: 75 + Math.random() * 3,
        distance: Math.floor(Math.random() * 7) + 1,
      };
    } catch (error) {
      console.error("💥 Whoop data fetch error:", error);
      return null;
    }
  }

  async fetchPolarData(
    accessToken: string,
    date: string
  ): Promise<HealthData | null> {
    console.log(
      `Fetching Polar data for ${date} with token: ${accessToken.substring(
        0,
        10
      )}...`
    );

    try {
      return {
        date,
        steps: Math.floor(Math.random() * 8000) + 4500,
        caloriesBurned: Math.floor(Math.random() * 950) + 1600,
        activeMinutes: Math.floor(Math.random() * 110) + 25,
        heartRate: Math.floor(Math.random() * 28) + 68,
        weight: 68 + Math.random() * 6,
        distance: Math.floor(Math.random() * 9) + 1.5,
      };
    } catch (error) {
      console.error("💥 Polar data fetch error:", error);
      return null;
    }
  }

  async fetchGarminData(
    accessToken: string,
    refreshToken: string,
    date: string
  ): Promise<HealthData | null> {
    console.log(
      `Fetching Garmin data for ${date} with access token: ${accessToken.substring(
        0,
        10
      )}...`
    );

    try {
      return {
        date,
        steps: Math.floor(Math.random() * 12000) + 6000,
        caloriesBurned: Math.floor(Math.random() * 1100) + 1800,
        activeMinutes: Math.floor(Math.random() * 150) + 40,
        heartRate: Math.floor(Math.random() * 35) + 75,
        weight: 72 + Math.random() * 4,
        distance: Math.floor(Math.random() * 12) + 3,
      };
    } catch (error) {
      console.error("💥 Garmin data fetch error:", error);
      return null;
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
        body:
          `refresh_token=${refreshToken}&` +
          `client_id=${config.clientId}&` +
          `grant_type=refresh_token`,
      });

      const tokenData = await response.json();
      if (tokenData.access_token) {
        await this.setDeviceTokens(config.name, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || refreshToken,
          expiresIn: tokenData.expires_in,
        });
        return tokenData.access_token;
      }
      return null;
    } catch (error) {
      console.error("💥 Google Fit token refresh error:", error);
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
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      });

      const tokenData = await response.json();
      if (tokenData.access_token) {
        await this.setDeviceTokens(config.name, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || refreshToken,
          expiresIn: tokenData.expires_in,
        });
        return tokenData.access_token;
      }
      return null;
    } catch (error) {
      console.error("💥 Fitbit token refresh error:", error);
      return null;
    }
  }

  // UTILITY METHODS
  getAvailableDevices(): string[] {
    const devices = Object.keys(DEVICE_CONFIGS);
    return devices.filter((device) => {
      if (device === "SAMSUNG_HEALTH") {
        return DEVICE_CONFIGS.SAMSUNG_HEALTH.available;
      }
      return true;
    });
  }

  getDeviceConfig(deviceType: string) {
    return DEVICE_CONFIGS[deviceType as keyof typeof DEVICE_CONFIGS];
  }

  async connectDevice(deviceType: string): Promise<DeviceConnectionResult> {
    switch (deviceType.toUpperCase()) {
      case "GARMIN":
        return this.connectGarmin();
      case "GOOGLE_FIT":
        return this.connectGoogleFit();
      case "FITBIT":
        return this.connectFitbit();
      case "WHOOP":
        return this.connectWhoop();
      case "SAMSUNG_HEALTH":
        return this.connectSamsungHealth();
      case "POLAR":
        return this.connectPolar();
      default:
        return { success: false, error: "Unsupported device type" };
    }
  }
}

export const deviceConnectionService = new DeviceConnectionService();
export default DeviceConnectionService;
