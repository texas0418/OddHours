import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Utensils, Apple, Coffee, Sandwich, Clock, Lightbulb, ChevronRight,
  Dumbbell, Zap, Flame, ChevronDown, CheckCircle, Timer, Target, Heart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { eveningShiftMeals, nightShiftMeals, nutritionTips } from '@/mocks/meals';
import { workouts } from '@/mocks/workouts';

type WellnessTab = 'nutrition' | 'exercise';

const MEAL_ICONS: Record<string, React.ReactNode> = {
  Utensils: <Utensils size={20} color={Colors.dark.success} />,
  Apple: <Apple size={20} color={Colors.dark.success} />,
  Coffee: <Coffee size={20} color={Colors.dark.success} />,
  Sandwich: <Sandwich size={20} color={Colors.dark.success} />,
};

const INTENSITY_CONFIG = {
  low: { color: Colors.dark.accent, label: 'Low' },
  medium: { color: Colors.dark.amber, label: 'Medium' },
  high: { color: Colors.dark.danger, label: 'High' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Cardio: <Flame size={18} color={Colors.dark.amber} />,
  Stretch: <Target size={18} color={Colors.dark.accent} />,
  HIIT: <Zap size={18} color={Colors.dark.danger} />,
  Strength: <Dumbbell size={18} color={Colors.dark.purple} />,
  Mobility: <Timer size={18} color={Colors.dark.success} />,
};

export default function WellnessScreen() {
  const insets = useSafeAreaInsets();
  const { profile, completeWorkout, isWorkoutCompletedToday } = useUser();
  const [activeTab, setActiveTab] = useState<WellnessTab>('nutrition');
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScales = useRef<Record<string, Animated.Value>>({}).current;

  const meals = useMemo(() => {
    return profile.shiftSchedule.type === 'evening' ? eveningShiftMeals : nightShiftMeals;
  }, [profile.shiftSchedule.type]);

  const totalCalories = useMemo(() => meals.reduce((sum, m) => sum + m.calories, 0), [meals]);

  const switchTab = useCallback((tab: WellnessTab) => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === 'nutrition' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [slideAnim]);

  const getButtonScale = useCallback((id: string) => {
    if (!buttonScales[id]) {
      buttonScales[id] = new Animated.Value(1);
    }
    return buttonScales[id];
  }, [buttonScales]);

  const handleComplete = useCallback((workoutId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const scale = getButtonScale(workoutId);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    completeWorkout(workoutId);
  }, [completeWorkout, getButtonScale]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.title}>Wellness</Text>
        <Text style={styles.subtitle}>Nutrition & exercise for your schedule</Text>

        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'nutrition' && styles.tabActive]}
            onPress={() => switchTab('nutrition')}
            testID="wellness-tab-nutrition"
          >
            <Utensils size={16} color={activeTab === 'nutrition' ? Colors.dark.background : Colors.dark.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>
              Nutrition
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'exercise' && styles.tabActive]}
            onPress={() => switchTab('exercise')}
            testID="wellness-tab-exercise"
          >
            <Dumbbell size={16} color={activeTab === 'exercise' ? Colors.dark.background : Colors.dark.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'exercise' && styles.tabTextActive]}>
              Exercise
            </Text>
          </Pressable>
        </View>

        {activeTab === 'nutrition' ? (
          <View>
            <LinearGradient
              colors={['rgba(102, 187, 106, 0.12)', 'rgba(102, 187, 106, 0.03)']}
              style={styles.calorieCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.calorieLabel}>Daily Plan</Text>
              <View style={styles.calorieRow}>
                <Text style={styles.calorieValue}>{totalCalories}</Text>
                <Text style={styles.calorieUnit}>cal</Text>
                <View style={styles.calorieDivider} />
                <Text style={styles.calorieGoal}>Goal: {profile.calorieGoal} cal</Text>
              </View>
              <View style={styles.calorieBar}>
                <View
                  style={[
                    styles.calorieBarFill,
                    { width: `${Math.min((totalCalories / profile.calorieGoal) * 100, 100)}%` },
                  ]}
                />
              </View>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Meal Schedule</Text>
            <Text style={styles.sectionSubtitle}>
              Timed around your {profile.shiftSchedule.startTime} – {profile.shiftSchedule.endTime} shift
            </Text>

            {meals.map((meal) => (
              <Pressable
                key={meal.id}
                style={styles.mealCard}
                onPress={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
              >
                <View style={styles.mealHeader}>
                  <View style={styles.mealIconContainer}>
                    {MEAL_ICONS[meal.icon] || <Utensils size={20} color={Colors.dark.success} />}
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealLabel}>{meal.label}</Text>
                    <View style={styles.mealTimeRow}>
                      <Clock size={12} color={Colors.dark.textMuted} />
                      <Text style={styles.mealTime}>{meal.time}</Text>
                      <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={18}
                    color={Colors.dark.textMuted}
                    style={{
                      transform: [{ rotate: expandedMeal === meal.id ? '90deg' : '0deg' }],
                    }}
                  />
                </View>
                {expandedMeal === meal.id && (
                  <View style={styles.mealExpanded}>
                    <Text style={styles.mealDescription}>{meal.description}</Text>
                  </View>
                )}
              </Pressable>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Tips</Text>
            {nutritionTips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <View style={styles.tipBullet}>
                  <Lightbulb size={14} color={Colors.dark.amber} />
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {workouts.map((workout) => {
              const isExpanded = expandedWorkout === workout.id;
              const isCompleted = isWorkoutCompletedToday(workout.id);
              const intensity = INTENSITY_CONFIG[workout.intensity];

              return (
                <Pressable
                  key={workout.id}
                  style={[styles.workoutCard, isCompleted && styles.workoutCardCompleted]}
                  onPress={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                >
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutIconContainer}>
                      {CATEGORY_ICONS[workout.category] || <Dumbbell size={18} color={Colors.dark.purple} />}
                    </View>
                    <View style={styles.workoutInfo}>
                      <View style={styles.workoutTitleRow}>
                        <Text style={styles.workoutTitle}>{workout.title}</Text>
                        {isCompleted && <CheckCircle size={16} color={Colors.dark.success} />}
                      </View>
                      <View style={styles.workoutMeta}>
                        <Clock size={12} color={Colors.dark.textMuted} />
                        <Text style={styles.workoutMetaText}>{workout.duration} min</Text>
                        <View style={[styles.intensityDot, { backgroundColor: intensity.color }]} />
                        <Text style={[styles.workoutMetaText, { color: intensity.color }]}>
                          {intensity.label}
                        </Text>
                      </View>
                    </View>
                    <ChevronDown
                      size={18}
                      color={Colors.dark.textMuted}
                      style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                    />
                  </View>

                  <Text style={styles.bestFor}>{workout.bestFor}</Text>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.exerciseList}>
                        {workout.exercises.map((exercise, idx) => (
                          <View key={idx} style={styles.exerciseRow}>
                            <View style={styles.exerciseNumber}>
                              <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            <Text style={styles.exerciseDetail}>
                              {exercise.reps || exercise.duration}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {!isCompleted ? (
                        <Animated.View style={{ transform: [{ scale: getButtonScale(workout.id) }] }}>
                          <Pressable
                            style={styles.completeButton}
                            onPress={() => handleComplete(workout.id)}
                            testID={`complete-workout-${workout.id}`}
                          >
                            <CheckCircle size={18} color={Colors.dark.background} />
                            <Text style={styles.completeButtonText}>Mark Complete</Text>
                          </Pressable>
                        </Animated.View>
                      ) : (
                        <View style={styles.completedBanner}>
                          <CheckCircle size={16} color={Colors.dark.success} />
                          <Text style={styles.completedText}>Completed today!</Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: Colors.dark.amber,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: Colors.dark.background,
  },
  calorieCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  calorieLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 14,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.dark.success,
  },
  calorieUnit: {
    fontSize: 16,
    color: Colors.dark.success,
    fontWeight: '500' as const,
  },
  calorieDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.dark.border,
    marginHorizontal: 10,
  },
  calorieGoal: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  calorieBar: {
    height: 6,
    backgroundColor: Colors.dark.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  calorieBarFill: {
    height: 6,
    backgroundColor: Colors.dark.success,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: 14,
  },
  mealCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mealIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.dark.successDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  mealTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealTime: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginRight: 8,
  },
  mealCalories: {
    fontSize: 13,
    color: Colors.dark.success,
    fontWeight: '600' as const,
  },
  mealExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  mealDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 21,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.dark.amberDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  workoutCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  workoutCardCompleted: {
    borderColor: Colors.dark.success + '40',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  workoutIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.dark.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  workoutMetaText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginRight: 6,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bestFor: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 10,
    fontStyle: 'italic',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  exerciseList: {
    gap: 10,
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textSecondary,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.text,
    fontWeight: '500' as const,
  },
  exerciseDetail: {
    fontSize: 13,
    color: Colors.dark.amber,
    fontWeight: '600' as const,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.amber,
    borderRadius: 12,
    padding: 14,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.successDim,
    borderRadius: 12,
    padding: 14,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.success,
  },
});
