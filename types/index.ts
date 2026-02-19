export type ShiftType = 'evening' | 'night' | 'rotating' | 'custom';

export interface ShiftSchedule {
  type: ShiftType;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

export interface SleepEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  duration: number;
  notes: string;
}

export interface MealPlan {
  id: string;
  label: string;
  time: string;
  description: string;
  icon: string;
  calories: number;
}

export interface Workout {
  id: string;
  title: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  category: string;
  exercises: Exercise[];
  bestFor: string;
}

export interface Exercise {
  name: string;
  reps?: string;
  duration?: string;
}

export interface UserProfile {
  name: string;
  occupation: string;
  shiftSchedule: ShiftSchedule;
  sleepGoal: number;
  calorieGoal: number;
  exerciseGoal: number;
}

export interface WellnessScore {
  sleep: number;
  nutrition: number;
  exercise: number;
  overall: number;
}

export interface MoodEntry {
  id: string;
  timestamp: string;
  mood: number;
  energy: number;
  notes: string;
}

export type PlaceCategory = 'food' | 'grocery' | 'pharmacy' | 'gym' | 'cafe' | 'gas';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  distance: string;
  openUntil: string;
  isOpen24h: boolean;
  rating: number;
  priceLevel: number;
  tags: string[];
}
