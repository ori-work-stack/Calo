import { prisma } from '../lib/database';

export async function resetDailyLimits() {
  try {
    const now = new Date();
    
    await prisma.user.updateMany({
      data: {
        aiRequestsCount: 0,
        aiRequestsResetAt: now,
      }
    });

    console.log(`✅ Daily AI request limits reset at ${now.toISOString()}`);
  } catch (error) {
    console.error('❌ Error resetting daily limits:', error);
  }
}