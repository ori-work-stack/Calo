interface ActivityData {
    steps: number;
    caloriesBurned: number;
    activeMinutes: number;
    bmr: number;
    heartRate?: number;
    weight?: number;
    bodyFat?: number;
    sleepHours?: number;
    distance?: number;
}
interface DailyBalance {
    caloriesIn: number;
    caloriesOut: number;
    balance: number;
    balanceStatus: "balanced" | "slight_imbalance" | "significant_imbalance";
}
export declare class DeviceService {
    static getUserDevices(user_id: string): Promise<{
        user_id: string;
        created_at: Date;
        connected_device_id: string;
        device_name: string;
        device_type: import(".prisma/client").$Enums.DeviceType;
        connection_status: import(".prisma/client").$Enums.ConnectionStatus;
        last_sync_time: Date | null;
        sync_frequency_hours: number | null;
        is_primary_device: boolean;
        device_settings: import("@prisma/client/runtime/library").JsonValue | null;
        access_token_encrypted: string | null;
        refresh_token_encrypted: string | null;
        token_expires_at: Date | null;
        updated_at: Date;
    }[]>;
    static connectDevice(user_id: string, deviceType: string, deviceName: string, accessToken?: string, refreshToken?: string): Promise<{
        user_id: string;
        created_at: Date;
        connected_device_id: string;
        device_name: string;
        device_type: import(".prisma/client").$Enums.DeviceType;
        connection_status: import(".prisma/client").$Enums.ConnectionStatus;
        last_sync_time: Date | null;
        sync_frequency_hours: number | null;
        is_primary_device: boolean;
        device_settings: import("@prisma/client/runtime/library").JsonValue | null;
        access_token_encrypted: string | null;
        refresh_token_encrypted: string | null;
        token_expires_at: Date | null;
        updated_at: Date;
    }>;
    static disconnectDevice(user_id: string, deviceId: string): Promise<void>;
    static syncDeviceData(user_id: string, deviceId: string, activityData: ActivityData): Promise<{
        user_id: string;
        weight_kg: number | null;
        created_at: Date;
        updated_at: Date;
        daily_activity_id: string;
        device_id: string;
        date: Date;
        steps: number | null;
        calories_burned: number | null;
        active_minutes: number | null;
        bmr_estimate: number | null;
        distance_km: number | null;
        heart_rate_avg: number | null;
        heart_rate_max: number | null;
        sleep_hours: number | null;
        water_intake_ml: number | null;
        body_fat_percentage: number | null;
        source_device: string;
        sync_timestamp: Date;
        raw_data: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    static getActivityData(user_id: string, startDate: string, endDate: string): Promise<({
        device: {
            user_id: string;
            created_at: Date;
            connected_device_id: string;
            device_name: string;
            device_type: import(".prisma/client").$Enums.DeviceType;
            connection_status: import(".prisma/client").$Enums.ConnectionStatus;
            last_sync_time: Date | null;
            sync_frequency_hours: number | null;
            is_primary_device: boolean;
            device_settings: import("@prisma/client/runtime/library").JsonValue | null;
            access_token_encrypted: string | null;
            refresh_token_encrypted: string | null;
            token_expires_at: Date | null;
            updated_at: Date;
        };
    } & {
        user_id: string;
        weight_kg: number | null;
        created_at: Date;
        updated_at: Date;
        daily_activity_id: string;
        device_id: string;
        date: Date;
        steps: number | null;
        calories_burned: number | null;
        active_minutes: number | null;
        bmr_estimate: number | null;
        distance_km: number | null;
        heart_rate_avg: number | null;
        heart_rate_max: number | null;
        sleep_hours: number | null;
        water_intake_ml: number | null;
        body_fat_percentage: number | null;
        source_device: string;
        sync_timestamp: Date;
        raw_data: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    static getDailyBalance(user_id: string, date: string): Promise<DailyBalance | null>;
    private static encryptToken;
    private static decryptToken;
    static getDeviceTokens(user_id: string, deviceId: string): Promise<{
        accessToken?: string;
        refreshToken?: string;
    }>;
    static updateDeviceTokens(user_id: string, deviceId: string, accessToken?: string, refreshToken?: string): Promise<void>;
}
export {};
//# sourceMappingURL=devices.d.ts.map