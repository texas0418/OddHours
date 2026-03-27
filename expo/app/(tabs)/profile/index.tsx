import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User, Briefcase, Clock, Moon, Sun, RotateCcw, Target, Utensils, Dumbbell, Save, ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { ShiftType, UserProfile } from '@/types';

const SHIFT_TYPES: { type: ShiftType; label: string; icon: React.ReactNode; hours: string }[] = [
  {
    type: 'evening',
    label: 'Evening',
    icon: <Sun size={20} color={Colors.dark.amber} />,
    hours: '3 PM – 11 PM',
  },
  {
    type: 'night',
    label: 'Night',
    icon: <Moon size={20} color={Colors.dark.accent} />,
    hours: '11 PM – 7 AM',
  },
  {
    type: 'rotating',
    label: 'Rotating',
    icon: <RotateCcw size={20} color={Colors.dark.purple} />,
    hours: 'Varies',
  },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();
  const [name, setName] = useState(profile.name);
  const [occupation, setOccupation] = useState(profile.occupation);
  const [shiftType, setShiftType] = useState<ShiftType>(profile.shiftSchedule.type);
  const [selectedDays, setSelectedDays] = useState<number[]>(profile.shiftSchedule.daysOfWeek);
  const [sleepGoal, setSleepGoal] = useState(String(profile.sleepGoal));
  const [calorieGoal, setCalorieGoal] = useState(String(profile.calorieGoal));

  const toggleDay = useCallback((day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSave = useCallback(() => {
    const shiftConfig = SHIFT_TYPES.find(s => s.type === shiftType);
    const updatedProfile: UserProfile = {
      name,
      occupation,
      shiftSchedule: {
        type: shiftType,
        startTime: shiftType === 'evening' ? '3:00 PM' : shiftType === 'night' ? '11:00 PM' : '7:00 PM',
        endTime: shiftType === 'evening' ? '11:00 PM' : shiftType === 'night' ? '7:00 AM' : '7:00 AM',
        daysOfWeek: selectedDays,
      },
      sleepGoal: parseFloat(sleepGoal) || 7,
      calorieGoal: parseInt(calorieGoal) || 2200,
      exerciseGoal: profile.exerciseGoal,
    };
    updateProfile(updatedProfile);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Saved', 'Your profile has been updated.');
  }, [name, occupation, shiftType, selectedDays, sleepGoal, calorieGoal, profile.exerciseGoal, updateProfile]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Set up your shift and wellness goals</Text>

        <Text style={styles.sectionTitle}>Personal Info</Text>
        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <User size={18} color={Colors.dark.textMuted} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.dark.textMuted}
              testID="profile-name-input"
            />
          </View>
          <View style={styles.inputDivider} />
          <View style={styles.inputRow}>
            <Briefcase size={18} color={Colors.dark.textMuted} />
            <TextInput
              style={styles.input}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="Occupation (e.g., RN, Warehouse)"
              placeholderTextColor={Colors.dark.textMuted}
              testID="profile-occupation-input"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Shift Type</Text>
        <View style={styles.shiftGrid}>
          {SHIFT_TYPES.map((shift) => (
            <Pressable
              key={shift.type}
              style={[
                styles.shiftOption,
                shiftType === shift.type && styles.shiftOptionActive,
              ]}
              onPress={() => setShiftType(shift.type)}
              testID={`shift-type-${shift.type}`}
            >
              {shift.icon}
              <Text style={[
                styles.shiftOptionLabel,
                shiftType === shift.type && styles.shiftOptionLabelActive,
              ]}>
                {shift.label}
              </Text>
              <Text style={styles.shiftOptionHours}>{shift.hours}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Work Days</Text>
        <View style={styles.daysRow}>
          {DAYS.map((day, index) => (
            <Pressable
              key={day}
              style={[
                styles.dayButton,
                selectedDays.includes(index) && styles.dayButtonActive,
              ]}
              onPress={() => toggleDay(index)}
            >
              <Text style={[
                styles.dayText,
                selectedDays.includes(index) && styles.dayTextActive,
              ]}>
                {day}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.inputGroup}>
          <View style={styles.goalRow}>
            <Moon size={18} color={Colors.dark.accent} />
            <Text style={styles.goalLabel}>Sleep Goal</Text>
            <TextInput
              style={styles.goalInput}
              value={sleepGoal}
              onChangeText={setSleepGoal}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.dark.textMuted}
              testID="sleep-goal-input"
            />
            <Text style={styles.goalUnit}>hrs</Text>
          </View>
          <View style={styles.inputDivider} />
          <View style={styles.goalRow}>
            <Utensils size={18} color={Colors.dark.success} />
            <Text style={styles.goalLabel}>Calorie Goal</Text>
            <TextInput
              style={styles.goalInput}
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="number-pad"
              placeholderTextColor={Colors.dark.textMuted}
              testID="calorie-goal-input"
            />
            <Text style={styles.goalUnit}>cal</Text>
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave} testID="save-profile-button">
          <Save size={18} color={Colors.dark.background} />
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </Pressable>

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
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 12,
    marginTop: 8,
  },
  inputGroup: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  inputDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginLeft: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
  },
  shiftGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  shiftOption: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  shiftOptionActive: {
    borderColor: Colors.dark.amber,
    backgroundColor: Colors.dark.amberDim,
  },
  shiftOptionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  shiftOptionLabelActive: {
    color: Colors.dark.amber,
  },
  shiftOptionHours: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.dark.amberDim,
    borderColor: Colors.dark.amber,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
  },
  dayTextActive: {
    color: Colors.dark.amber,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  goalLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
    fontWeight: '500' as const,
  },
  goalInput: {
    width: 70,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.amber,
    textAlign: 'right',
  },
  goalUnit: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    width: 28,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.amber,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
});
