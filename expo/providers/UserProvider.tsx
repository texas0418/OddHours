import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShiftSchedule, SleepEntry, UserProfile, WellnessScore, MoodEntry } from '@/types';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  occupation: '',
  shiftSchedule: {
    type: 'night',
    startTime: '11:00 PM',
    endTime: '7:00 AM',
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  sleepGoal: 7,
  calorieGoal: 2200,
  exerciseGoal: 3,
};

const STORAGE_KEYS = {
  profile: 'nightowl_profile',
  sleepEntries: 'nightowl_sleep',
  completedWorkouts: 'nightowl_workouts_completed',
  onboarded: 'nightowl_onboarded',
  moodEntries: 'nightowl_mood',
};

export const [UserProvider, useUser] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.profile);
      return stored ? JSON.parse(stored) as UserProfile : DEFAULT_PROFILE;
    },
  });

  const sleepQuery = useQuery({
    queryKey: ['sleepEntries'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.sleepEntries);
      return stored ? JSON.parse(stored) as SleepEntry[] : [];
    },
  });

  const onboardedQuery = useQuery({
    queryKey: ['onboarded'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.onboarded);
      return stored === 'true';
    },
  });

  const workoutsQuery = useQuery({
    queryKey: ['completedWorkouts'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.completedWorkouts);
      return stored ? JSON.parse(stored) as string[] : [];
    },
  });

  const moodQuery = useQuery({
    queryKey: ['moodEntries'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.moodEntries);
      return stored ? JSON.parse(stored) as MoodEntry[] : [];
    },
  });

  useEffect(() => {
    if (profileQuery.data) setProfile(profileQuery.data);
  }, [profileQuery.data]);

  useEffect(() => {
    if (sleepQuery.data) setSleepEntries(sleepQuery.data);
  }, [sleepQuery.data]);

  useEffect(() => {
    if (onboardedQuery.data !== undefined) setIsOnboarded(onboardedQuery.data);
  }, [onboardedQuery.data]);

  useEffect(() => {
    if (workoutsQuery.data) setCompletedWorkouts(workoutsQuery.data);
  }, [workoutsQuery.data]);

  useEffect(() => {
    if (moodQuery.data) setMoodEntries(moodQuery.data);
  }, [moodQuery.data]);

  const saveProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(newProfile));
      return newProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const saveSleepMutation = useMutation({
    mutationFn: async (entries: SleepEntry[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.sleepEntries, JSON.stringify(entries));
      return entries;
    },
    onSuccess: (data) => {
      setSleepEntries(data);
      queryClient.invalidateQueries({ queryKey: ['sleepEntries'] });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.onboarded, 'true');
      return true;
    },
    onSuccess: () => {
      setIsOnboarded(true);
    },
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const key = `${workoutId}_${today}`;
      const updated = [...completedWorkouts, key];
      await AsyncStorage.setItem(STORAGE_KEYS.completedWorkouts, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setCompletedWorkouts(data);
    },
  });

  const saveMoodMutation = useMutation({
    mutationFn: async (entries: MoodEntry[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.moodEntries, JSON.stringify(entries));
      return entries;
    },
    onSuccess: (data) => {
      setMoodEntries(data);
      queryClient.invalidateQueries({ queryKey: ['moodEntries'] });
    },
  });

  const updateProfile = useCallback((newProfile: UserProfile) => {
    saveProfileMutation.mutate(newProfile);
  }, [saveProfileMutation]);

  const addSleepEntry = useCallback((entry: SleepEntry) => {
    const updated = [entry, ...sleepEntries];
    saveSleepMutation.mutate(updated);
  }, [sleepEntries, saveSleepMutation]);

  const completeOnboarding = useCallback(() => {
    completeOnboardingMutation.mutate();
  }, [completeOnboardingMutation]);

  const completeWorkout = useCallback((workoutId: string) => {
    completeWorkoutMutation.mutate(workoutId);
  }, [completeWorkoutMutation]);

  const addMoodEntry = useCallback((entry: MoodEntry) => {
    const today = new Date().toISOString().split('T')[0];
    const filtered = moodEntries.filter(e => !e.timestamp.startsWith(today));
    const updated = [entry, ...filtered];
    saveMoodMutation.mutate(updated);
  }, [moodEntries, saveMoodMutation]);

  const isWorkoutCompletedToday = useCallback((workoutId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return completedWorkouts.includes(`${workoutId}_${today}`);
  }, [completedWorkouts]);

  const wellnessScore = useMemo((): WellnessScore => {
    const recentSleep = sleepEntries.slice(0, 7);
    const avgSleepQuality = recentSleep.length > 0
      ? recentSleep.reduce((sum, e) => sum + e.quality, 0) / recentSleep.length
      : 0;
    const sleepScore = Math.round((avgSleepQuality / 5) * 100);

    const today = new Date().toISOString().split('T')[0];
    const todayWorkouts = completedWorkouts.filter(w => w.endsWith(today)).length;
    const exerciseScore = Math.min(Math.round((todayWorkouts / Math.max(1, profile.exerciseGoal / 7)) * 100), 100);

    const nutritionScore = 65;

    const overall = Math.round((sleepScore + nutritionScore + exerciseScore) / 3);

    return { sleep: sleepScore, nutrition: nutritionScore, exercise: exerciseScore, overall };
  }, [sleepEntries, completedWorkouts, profile.exerciseGoal]);

  const isLoading = profileQuery.isLoading || sleepQuery.isLoading || onboardedQuery.isLoading || moodQuery.isLoading;

  return {
    profile,
    updateProfile,
    sleepEntries,
    addSleepEntry,
    completedWorkouts,
    completeWorkout,
    isWorkoutCompletedToday,
    wellnessScore,
    moodEntries,
    addMoodEntry,
    isOnboarded,
    completeOnboarding,
    isLoading,
  };
});
