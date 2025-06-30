
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchMeals } from '../../src/store/mealSlice';
import { nutritionAPI } from '../../src/services/api';

interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await nutritionAPI.getDailyStats(today);
      setDailyStats(stats);
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchMeals()),
      loadDailyStats(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    dispatch(fetchMeals());
    loadDailyStats();
  }, [dispatch]);

  if (isLoading && !meals.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.welcome}>
        Welcome back, {user?.name || 'User'}!
      </Text>

      {dailyStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Nutrition</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(dailyStats.calories)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(dailyStats.protein)}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(dailyStats.carbs)}g</Text>
              <Text style={styles.statLabel}>Carbs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(dailyStats.fat)}g</Text>
              <Text style={styles.statLabel}>Fat</Text>
            </View>
          </View>
          <Text style={styles.mealCount}>
            {dailyStats.mealCount} meals logged today
          </Text>
        </View>
      )}

      <View style={styles.recentMeals}>
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        {meals.slice(0, 3).map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealCalories}>{Math.round(meal.calories)} cal</Text>
          </View>
        ))}
        {meals.length === 0 && (
          <Text style={styles.emptyText}>
            No meals logged yet. Start by analyzing a photo!
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    color: '#333',
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  mealCount: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  recentMeals: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealName: {
    fontSize: 16,
    color: '#333',
  },
  mealCalories: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
