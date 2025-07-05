"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDailyLimits = resetDailyLimits;
const database_1 = require("../lib/database");
async function resetDailyLimits() {
    try {
        const now = new Date();
        await database_1.prisma.user.updateMany({
            data: {
                aiRequestsCount: 0,
                aiRequestsResetAt: now,
            }
        });
        console.log(`✅ Daily AI request limits reset at ${now.toISOString()}`);
    }
    catch (error) {
        console.error('❌ Error resetting daily limits:', error);
    }
}
//# sourceMappingURL=cron.js.map