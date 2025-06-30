
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchMeals } from '../../src/store/mealSlice';
import { Meal } from '../../src/types';

export default function MealsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);

  useEffect(() => {
    dispatch(fetchMeals());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchMeals());
  };

  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={styles.mealCard}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.mealImage} />
      )}
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.mealDescription}>{item.description}</Text>
        )}
        <Text style={styles.mealDate}>
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.calories)}</Text>
            <Text style={styles.nutritionLabel}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.protein)}g</Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.carbs)}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.fat)}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading && meals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        renderItem={renderMeal}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={meals.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No meals yet</Text>
            <Text style={styles.emptyText}>
              Start by taking a photo of your meal to analyze its nutrition!
            </Text>
          </View>
        }
      />
    </View>
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
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 150,
  },
  mealInfo: {
    padding: 15,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  mealDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
});
