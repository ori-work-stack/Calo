import { prisma } from '../lib/database';

export async function resetDailyLimits() {
  try {
    const now = new Date();
    
    await prisma.user.updateMany({
      data: {
        ai_requests_count: 0,
        ai_requests_reset_at: now,
      }
    });

    console.log(`✅ Daily AI request limits reset at ${now.toISOString()}`);
  } catch (error) {
    console.error('❌ Error resetting daily limits:', error);
  }
}