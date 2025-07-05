"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceService = void 0;
const database_1 = require("../lib/database");
class DeviceService {
    static async getUserDevices(user_id) {
        try {
            console.log("📱 Getting devices for user:", user_id);
            const devices = await database_1.prisma.connectedDevice.findMany({
                where: { user_id },
                orderBy: { created_at: "desc" },
            });
            console.log("✅ Found", devices.length, "devices");
            return devices;
        }
        catch (error) {
            console.error("💥 Error getting user devices:", error);
            throw new Error("Failed to fetch user devices");
        }
    }
    static async connectDevice(user_id, deviceType, deviceName, accessToken, refreshToken) {
        try {
            console.log("🔗 Connecting device for user:", user_id, {
                deviceType,
                deviceName,
            });
            // Validate device type
            const validDeviceTypes = [
                "APPLE_HEALTH",
                "GOOGLE_FIT",
                "FITBIT",
                "GARMIN",
                "WHOOP",
                "SAMSUNG_HEALTH",
                "POLAR",
                "SUUNTO",
                "WITHINGS",
                "OURA",
                "AMAZFIT",
                "HUAWEI_HEALTH",
            ];
            if (!validDeviceTypes.includes(deviceType)) {
                throw new Error(`Invalid device type: ${deviceType}`);
            }
            // Check if device type already exists for this user
            const existingDevice = await database_1.prisma.connectedDevice.findFirst({
                where: {
                    user_id,
                    device_type: deviceType,
                },
            });
            if (existingDevice) {
                // Update existing device
                const updatedDevice = await database_1.prisma.connectedDevice.update({
                    where: { connected_device_id: existingDevice.connected_device_id },
                    data: {
                        device_name: deviceName,
                        connection_status: "CONNECTED",
                        last_sync_time: new Date(),
                        access_token_encrypted: accessToken
                            ? this.encryptToken(accessToken)
                            : null,
                        refresh_token_encrypted: refreshToken
                            ? this.encryptToken(refreshToken)
                            : null,
                        token_expires_at: accessToken
                            ? new Date(Date.now() + 3600000)
                            : null, // 1 hour default
                        updated_at: new Date(),
                    },
                });
                console.log("✅ Updated existing device");
                return updatedDevice;
            }
            else {
                // Create new device
                const newDevice = await database_1.prisma.connectedDevice.create({
                    data: {
                        user_id,
                        device_name: deviceName,
                        device_type: deviceType,
                        connection_status: "CONNECTED",
                        last_sync_time: new Date(),
                        is_primary_device: true, // First device is primary
                        access_token_encrypted: accessToken
                            ? this.encryptToken(accessToken)
                            : null,
                        refresh_token_encrypted: refreshToken
                            ? this.encryptToken(refreshToken)
                            : null,
                        token_expires_at: accessToken
                            ? new Date(Date.now() + 3600000)
                            : null, // 1 hour default
                    },
                });
                console.log("✅ Created new device");
                return newDevice;
            }
        }
        catch (error) {
            console.error("💥 Error connecting device:", error);
            throw new Error("Failed to connect device");
        }
    }
    static async disconnectDevice(user_id, deviceId) {
        try {
            console.log("🔌 Disconnecting device:", deviceId, "for user:", user_id);
            const device = await database_1.prisma.connectedDevice.findFirst({
                where: {
                    connected_device_id: deviceId,
                    user_id,
                },
            });
            if (!device) {
                throw new Error("Device not found");
            }
            // Update device status to disconnected
            await database_1.prisma.connectedDevice.update({
                where: { connected_device_id: deviceId },
                data: {
                    connection_status: "DISCONNECTED",
                    access_token_encrypted: null,
                    refresh_token_encrypted: null,
                    token_expires_at: null,
                    updated_at: new Date(),
                },
            });
            console.log("✅ Device disconnected");
        }
        catch (error) {
            console.error("💥 Error disconnecting device:", error);
            throw new Error("Failed to disconnect device");
        }
    }
    static async syncDeviceData(user_id, deviceId, activityData) {
        try {
            console.log("🔄 Syncing device data:", deviceId, activityData);
            const device = await database_1.prisma.connectedDevice.findFirst({
                where: {
                    connected_device_id: deviceId,
                    user_id,
                },
            });
            if (!device) {
                throw new Error("Device not found");
            }
            const today = new Date().toISOString().split("T")[0];
            // Upsert daily activity summary
            const activitySummary = await database_1.prisma.dailyActivitySummary.upsert({
                where: {
                    user_id_device_id_date: {
                        user_id,
                        device_id: deviceId,
                        date: new Date(today),
                    },
                },
                update: {
                    steps: activityData.steps || 0,
                    calories_burned: activityData.caloriesBurned || 0,
                    active_minutes: activityData.activeMinutes || 0,
                    bmr_estimate: activityData.bmr || 0,
                    heart_rate_avg: activityData.heartRate,
                    weight_kg: activityData.weight,
                    body_fat_percentage: activityData.bodyFat,
                    sleep_hours: activityData.sleepHours,
                    distance_km: activityData.distance,
                    sync_timestamp: new Date(),
                    updated_at: new Date(),
                    raw_data: activityData,
                },
                create: {
                    user_id,
                    device_id: deviceId,
                    date: new Date(today),
                    steps: activityData.steps || 0,
                    calories_burned: activityData.caloriesBurned || 0,
                    active_minutes: activityData.activeMinutes || 0,
                    bmr_estimate: activityData.bmr || 0,
                    heart_rate_avg: activityData.heartRate,
                    weight_kg: activityData.weight,
                    body_fat_percentage: activityData.bodyFat,
                    sleep_hours: activityData.sleepHours,
                    distance_km: activityData.distance,
                    source_device: device.device_name,
                    sync_timestamp: new Date(),
                    raw_data: activityData,
                },
            });
            // Update device last sync time
            await database_1.prisma.connectedDevice.update({
                where: { connected_device_id: deviceId },
                data: {
                    last_sync_time: new Date(),
                    connection_status: "CONNECTED",
                    updated_at: new Date(),
                },
            });
            console.log("✅ Device data synced successfully");
            return activitySummary;
        }
        catch (error) {
            console.error("💥 Error syncing device data:", error);
            throw new Error("Failed to sync device data");
        }
    }
    static async getActivityData(user_id, startDate, endDate) {
        try {
            console.log("📊 Getting activity data for user:", user_id, {
                startDate,
                endDate,
            });
            const activityData = await database_1.prisma.dailyActivitySummary.findMany({
                where: {
                    user_id,
                    date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
                include: {
                    device: true,
                },
                orderBy: {
                    date: "desc",
                },
            });
            console.log("✅ Found", activityData.length, "activity records");
            return activityData;
        }
        catch (error) {
            console.error("💥 Error getting activity data:", error);
            throw new Error("Failed to fetch activity data");
        }
    }
    static async getDailyBalance(user_id, date) {
        try {
            console.log("⚖️ Calculating daily balance for user:", user_id, "date:", date);
            // Get calories consumed from meals
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            const meals = await database_1.prisma.meal.findMany({
                where: {
                    user_id,
                    createdAt: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
            });
            const caloriesIn = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
            // Get calories burned from activity data
            const activityData = await database_1.prisma.dailyActivitySummary.findFirst({
                where: {
                    user_id,
                    date: new Date(date),
                },
                orderBy: {
                    sync_timestamp: "desc",
                },
            });
            if (!activityData) {
                console.log("⚠️ No activity data found for date");
                return null;
            }
            const caloriesOut = (activityData.calories_burned || 0) + (activityData.bmr_estimate || 0);
            const balance = caloriesIn - caloriesOut;
            const balancePercent = caloriesOut > 0 ? Math.abs(balance) / caloriesOut : 0;
            let balanceStatus;
            if (balancePercent <= 0.1) {
                balanceStatus = "balanced";
            }
            else if (balancePercent <= 0.25) {
                balanceStatus = "slight_imbalance";
            }
            else {
                balanceStatus = "significant_imbalance";
            }
            const dailyBalance = {
                caloriesIn: Math.round(caloriesIn),
                caloriesOut: Math.round(caloriesOut),
                balance: Math.round(balance),
                balanceStatus,
            };
            console.log("✅ Daily balance calculated:", dailyBalance);
            return dailyBalance;
        }
        catch (error) {
            console.error("💥 Error calculating daily balance:", error);
            throw new Error("Failed to calculate daily balance");
        }
    }
    // TOKEN ENCRYPTION/DECRYPTION (Basic implementation - use proper encryption in production)
    static encryptToken(token) {
        // In production, use proper encryption like AES
        // For now, just base64 encode (NOT SECURE - for demo only)
        return Buffer.from(token).toString("base64");
    }
    static decryptToken(encryptedToken) {
        // In production, use proper decryption
        // For now, just base64 decode (NOT SECURE - for demo only)
        return Buffer.from(encryptedToken, "base64").toString();
    }
    static async getDeviceTokens(user_id, deviceId) {
        try {
            const device = await database_1.prisma.connectedDevice.findFirst({
                where: {
                    connected_device_id: deviceId,
                    user_id,
                },
            });
            if (!device) {
                return {};
            }
            return {
                accessToken: device.access_token_encrypted
                    ? this.decryptToken(device.access_token_encrypted)
                    : undefined,
                refreshToken: device.refresh_token_encrypted
                    ? this.decryptToken(device.refresh_token_encrypted)
                    : undefined,
            };
        }
        catch (error) {
            console.error("💥 Error getting device tokens:", error);
            return {};
        }
    }
    static async updateDeviceTokens(user_id, deviceId, accessToken, refreshToken) {
        try {
            await database_1.prisma.connectedDevice.updateMany({
                where: {
                    connected_device_id: deviceId,
                    user_id,
                },
                data: {
                    access_token_encrypted: accessToken
                        ? this.encryptToken(accessToken)
                        : undefined,
                    refresh_token_encrypted: refreshToken
                        ? this.encryptToken(refreshToken)
                        : undefined,
                    token_expires_at: accessToken
                        ? new Date(Date.now() + 3600000)
                        : undefined,
                    updated_at: new Date(),
                },
            });
            console.log("✅ Device tokens updated");
        }
        catch (error) {
            console.error("💥 Error updating device tokens:", error);
            throw new Error("Failed to update device tokens");
        }
    }
}
exports.DeviceService = DeviceService;
//# sourceMappingURL=devices.js.map