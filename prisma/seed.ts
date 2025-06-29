import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'testuser',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
      height: 175,
      weight: 70,
      activityLevel: 'MODERATE',
    },
  });

  // Create nutrition goals for test user
  await prisma.nutritionGoal.upsert({
    where: { id: 'test-goal-1' },
    update: {},
    create: {
      id: 'test-goal-1',
      userId: testUser.id,
      dailyCalories: 2000,
      dailyProtein: 150,
      dailyCarbs: 250,
      dailyFat: 67,
      dailyFiber: 25,
      dailySugar: 50,
      isActive: true,
    },
  });

  // Create sample meal for test user
  await prisma.meal.upsert({
    where: { id: 'test-meal-1' },
    update: {},
    create: {
      id: 'test-meal-1',
      userId: testUser.id,
      description: 'Grilled chicken breast with quinoa and vegetables',
      totalCalories: 450,
      totalProtein: 35,
      totalCarbs: 40,
      totalFat: 12,
      totalFiber: 8,
      totalSugar: 6,
      healthScore: 8,
      recommendations: 'Great balanced meal with lean protein and complex carbs!',
      mealType: 'LUNCH',
      foodItems: {
        create: [
          {
            name: 'Grilled Chicken Breast',
            quantity: '150g',
            calories: 250,
            protein: 30,
            carbs: 0,
            fat: 6,
          },
          {
            name: 'Quinoa',
            quantity: '100g cooked',
            calories: 120,
            protein: 4,
            carbs: 22,
            fat: 2,
          },
          {
            name: 'Mixed Vegetables',
            quantity: '150g',
            calories: 80,
            protein: 1,
            carbs: 18,
            fat: 4,
          },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@example.com / admin123');
  console.log('👤 Test user: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });