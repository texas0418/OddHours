import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Moon, Sun, Sunrise, Coffee, TrendingUp, Clock, Zap, Heart,
  Smile, Frown, Meh, Battery, BatteryLow, BatteryFull,
  Calendar, AlertCircle, X, ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import ProgressBar from '@/components/ProgressBar';

const MOOD_OPTIONS = [
  { value: 1, label: 'Rough', emoji: '😩', color: Colors.dark.danger },
  { value: 2, label: 'Low', emoji: '😔', color: Colors.dark.warning },
  { value: 3, label: 'Okay', emoji: '😐', color: Colors.dark.amber },
  { value: 4, label: 'Good', emoji: '🙂', color: Colors.dark.accent },
  { value: 5, label: 'Great', emoji: '😊', color: Colors.dark.success },
];

const ENERGY_OPTIONS = [
  { value: 1, label: 'Drained', color: Colors.dark.danger },
  { value: 2, label: 'Low', color: Colors.dark.warning },
  { value: 3, label: 'Moderate', color: Colors.dark.amber },
  { value: 4, label: 'Energized', color: Colors.dark.accent },
  { value: 5, label: 'Wired', color: Colors.dark.success },
];

function getGreeting(): { text: string; icon: React.ReactNode; subtitle: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      text: 'Good Morning',
      icon: <Sunrise size={24} color={Colors.dark.amberLight} />,
      subtitle: 'Time to wind down after your shift',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      text: 'Good Afternoon',
      icon: <Sun size={24} color={Colors.dark.amber} />,
      subtitle: 'Rest well — your body is recharging',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      text: 'Good Evening',
      icon: <Coffee size={24} color={Colors.dark.amberLight} />,
      subtitle: 'Getting ready for your shift?',
    };
  } else {
    return {
      text: 'Good Night',
      icon: <Moon size={24} color={Colors.dark.accent} />,
      subtitle: "You're in the zone. Stay strong tonight.",
    };
  }
}

function getShiftStatus(startTime: string, endTime: string): { label: string; color: string; detail: string } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const parseTime = (t: string): number => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const nowMins = hour * 60 + minute;
  const startMins = parseTime(startTime);
  const endMins = parseTime(endTime);

  let isOnShift = false;
  if (startMins > endMins) {
    isOnShift = nowMins >= startMins || nowMins < endMins;
  } else {
    isOnShift = nowMins >= startMins && nowMins < endMins;
  }

  if (isOnShift) {
    let minsLeft: number;
    if (endMins > nowMins) {
      minsLeft = endMins - nowMins;
    } else {
      minsLeft = (24 * 60 - nowMins) + endMins;
    }
    const hoursLeft = Math.floor(minsLeft / 60);
    const minsRemainder = minsLeft % 60;
    return {
      label: 'On Shift',
      color: Colors.dark.success,
      detail: `${hoursLeft}h ${minsRemainder}m remaining`,
    };
  }

  let minsUntil: number;
  if (startMins > nowMins) {
    minsUntil = startMins - nowMins;
  } else {
    minsUntil = (24 * 60 - nowMins) + startMins;
  }
  const hoursUntil = Math.floor(minsUntil / 60);
  const minsRemainder = minsUntil % 60;

  if (minsUntil <= 120) {
    return {
      label: 'Starting Soon',
      color: Colors.dark.warning,
      detail: `Starts in ${hoursUntil}h ${minsRemainder}m`,
    };
  }

  return {
    label: 'Off Shift',
    color: Colors.dark.textMuted,
    detail: `Next shift in ${hoursUntil}h ${minsRemainder}m`,
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, wellnessScore, sleepEntries, moodEntries, addMoodEntry } = useUser();
  const greeting = useMemo(() => getGreeting(), []);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(3);
  const [selectedEnergy, setSelectedEnergy] = useState(3);
  const moodScaleAnims = useRef(MOOD_OPTIONS.map(() => new Animated.Value(1))).current;
  const energyScaleAnims = useRef(ENERGY_OPTIONS.map(() => new Animated.Value(1))).current;

  const lastSleep = sleepEntries.length > 0 ? sleepEntries[0] : null;

  const shiftStatus = useMemo(() => {
    return getShiftStatus(profile.shiftSchedule.startTime, profile.shiftSchedule.endTime);
  }, [profile.shiftSchedule.startTime, profile.shiftSchedule.endTime]);

  const todayMood = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return moodEntries.find(e => e.timestamp.startsWith(today));
  }, [moodEntries]);

  const recentMoodAvg = useMemo(() => {
    if (moodEntries.length === 0) return null;
    const recent = moodEntries.slice(0, 7);
    const avgMood = recent.reduce((s, e) => s + e.mood, 0) / recent.length;
    const avgEnergy = recent.reduce((s, e) => s + e.energy, 0) / recent.length;
    return { mood: avgMood, energy: avgEnergy };
  }, [moodEntries]);

  const handleMoodSelect = useCallback((index: number) => {
    setSelectedMood(index + 1);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(moodScaleAnims[index], { toValue: 1.25, duration: 100, useNativeDriver: true }),
      Animated.timing(moodScaleAnims[index], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [moodScaleAnims]);

  const handleEnergySelect = useCallback((index: number) => {
    setSelectedEnergy(index + 1);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(energyScaleAnims[index], { toValue: 1.25, duration: 100, useNativeDriver: true }),
      Animated.timing(energyScaleAnims[index], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [energyScaleAnims]);

  const handleSaveMood = useCallback(() => {
    addMoodEntry({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mood: selectedMood,
      energy: selectedEnergy,
      notes: '',
    });
    setShowMoodModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [selectedMood, selectedEnergy, addMoodEntry]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            {greeting.icon}
            <Text style={styles.greetingText}>{greeting.text}</Text>
          </View>
          <Text style={styles.subtitle}>{greeting.subtitle}</Text>
          {profile.name ? (
            <Text style={styles.userName}>{profile.name}</Text>
          ) : null}
        </View>

        <View style={styles.shiftStatusCard}>
          <View style={styles.shiftStatusLeft}>
            <View style={[styles.shiftStatusDot, { backgroundColor: shiftStatus.color }]} />
            <View>
              <Text style={[styles.shiftStatusLabel, { color: shiftStatus.color }]}>{shiftStatus.label}</Text>
              <Text style={styles.shiftStatusDetail}>{shiftStatus.detail}</Text>
            </View>
          </View>
          <View style={styles.shiftTimeChip}>
            <Clock size={13} color={Colors.dark.amber} />
            <Text style={styles.shiftTimeText}>
              {profile.shiftSchedule.startTime} – {profile.shiftSchedule.endTime}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.moodCheckIn}
          onPress={() => setShowMoodModal(true)}
          testID="mood-checkin-button"
        >
          <LinearGradient
            colors={['rgba(79, 195, 247, 0.1)', 'rgba(171, 123, 247, 0.08)']}
            style={styles.moodCheckInGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.moodCheckInContent}>
              <View style={styles.moodCheckInLeft}>
                <Text style={styles.moodCheckInEmoji}>
                  {todayMood ? MOOD_OPTIONS[todayMood.mood - 1].emoji : '✨'}
                </Text>
                <View>
                  <Text style={styles.moodCheckInTitle}>
                    {todayMood ? 'Mood Logged' : 'How are you feeling?'}
                  </Text>
                  <Text style={styles.moodCheckInSub}>
                    {todayMood
                      ? `${MOOD_OPTIONS[todayMood.mood - 1].label} · Energy: ${ENERGY_OPTIONS[todayMood.energy - 1].label}`
                      : 'Tap to log your mood & energy'
                    }
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.dark.textMuted} />
            </View>

            {recentMoodAvg && (
              <View style={styles.moodTrend}>
                <Text style={styles.moodTrendLabel}>7-day avg</Text>
                <View style={styles.moodTrendBars}>
                  <View style={styles.moodTrendItem}>
                    <Smile size={12} color={Colors.dark.accent} />
                    <View style={styles.moodTrendBarTrack}>
                      <View style={[styles.moodTrendBarFill, {
                        width: `${(recentMoodAvg.mood / 5) * 100}%`,
                        backgroundColor: Colors.dark.accent,
                      }]} />
                    </View>
                    <Text style={styles.moodTrendValue}>{recentMoodAvg.mood.toFixed(1)}</Text>
                  </View>
                  <View style={styles.moodTrendItem}>
                    <Zap size={12} color={Colors.dark.purple} />
                    <View style={styles.moodTrendBarTrack}>
                      <View style={[styles.moodTrendBarFill, {
                        width: `${(recentMoodAvg.energy / 5) * 100}%`,
                        backgroundColor: Colors.dark.purple,
                      }]} />
                    </View>
                    <Text style={styles.moodTrendValue}>{recentMoodAvg.energy.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
            )}
          </LinearGradient>
        </Pressable>

        <LinearGradient
          colors={['rgba(245, 166, 35, 0.12)', 'rgba(245, 166, 35, 0.03)']}
          style={styles.scoreCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.scoreHeader}>
            <View style={styles.scoreHeaderLeft}>
              <TrendingUp size={18} color={Colors.dark.amber} />
              <Text style={styles.scoreTitle}>Wellness Score</Text>
            </View>
            <View style={styles.overallBadge}>
              <Text style={styles.overallScore}>{wellnessScore.overall}</Text>
            </View>
          </View>

          <ProgressBar progress={wellnessScore.sleep} color={Colors.dark.accent} label="Sleep" />
          <ProgressBar progress={wellnessScore.nutrition} color={Colors.dark.success} label="Nutrition" />
          <ProgressBar progress={wellnessScore.exercise} color={Colors.dark.purple} label="Exercise" />
        </LinearGradient>

        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.dark.accentDim }]}>
            <Moon size={20} color={Colors.dark.accent} />
            <Text style={styles.statValue}>
              {lastSleep ? `${lastSleep.duration.toFixed(1)}h` : '—'}
            </Text>
            <Text style={styles.statLabel}>Last Sleep</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.dark.successDim }]}>
            <Heart size={20} color={Colors.dark.success} />
            <Text style={styles.statValue}>
              {lastSleep ? `${lastSleep.quality}/5` : '—'}
            </Text>
            <Text style={styles.statLabel}>Quality</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.dark.purpleDim }]}>
            <Zap size={20} color={Colors.dark.purple} />
            <Text style={styles.statValue}>{profile.sleepGoal}h</Text>
            <Text style={styles.statLabel}>Sleep Goal</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Night Shift Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Circadian Anchor</Text>
            <Text style={styles.tipText}>
              Keep your sleep and wake times consistent — even on days off. Your body's clock needs a reliable anchor, especially when it's fighting natural light cues.
            </Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>🕶️</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Sunglasses on the Drive Home</Text>
            <Text style={styles.tipText}>
              Wear dark sunglasses after your shift. Morning sunlight tells your brain to wake up — blocking it helps you fall asleep faster.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showMoodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check In</Text>
              <Pressable onPress={() => setShowMoodModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>How are you feeling?</Text>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((opt, index) => (
                <Pressable
                  key={opt.value}
                  onPress={() => handleMoodSelect(index)}
                  testID={`mood-${opt.value}`}
                >
                  <Animated.View style={[
                    styles.moodOption,
                    {
                      transform: [{ scale: moodScaleAnims[index] }],
                      backgroundColor: selectedMood === opt.value ? opt.color + '20' : Colors.dark.card,
                      borderColor: selectedMood === opt.value ? opt.color : Colors.dark.border,
                    },
                  ]}>
                    <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.moodLabel, {
                      color: selectedMood === opt.value ? opt.color : Colors.dark.textSecondary,
                    }]}>{opt.label}</Text>
                  </Animated.View>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Energy Level</Text>
            <View style={styles.energyRow}>
              {ENERGY_OPTIONS.map((opt, index) => (
                <Pressable
                  key={opt.value}
                  onPress={() => handleEnergySelect(index)}
                  testID={`energy-${opt.value}`}
                >
                  <Animated.View style={[
                    styles.energyOption,
                    {
                      transform: [{ scale: energyScaleAnims[index] }],
                      backgroundColor: selectedEnergy === opt.value ? opt.color + '20' : Colors.dark.card,
                      borderColor: selectedEnergy === opt.value ? opt.color : Colors.dark.border,
                    },
                  ]}>
                    <View style={[styles.energyBar, {
                      height: 4 + (index * 5),
                      backgroundColor: selectedEnergy === opt.value ? opt.color : Colors.dark.textMuted,
                    }]} />
                    <Text style={[styles.energyLabel, {
                      color: selectedEnergy === opt.value ? opt.color : Colors.dark.textSecondary,
                    }]}>{opt.label}</Text>
                  </Animated.View>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.saveButton} onPress={handleSaveMood} testID="save-mood-button">
              <Text style={styles.saveButtonText}>Log Check-In</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  header: {
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    color: Colors.dark.amber,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  shiftStatusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  shiftStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shiftStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shiftStatusLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  shiftStatusDetail: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  shiftTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.dark.amberDim,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shiftTimeText: {
    fontSize: 11,
    color: Colors.dark.amber,
    fontWeight: '600' as const,
  },
  moodCheckIn: {
    marginBottom: 20,
  },
  moodCheckInGradient: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  moodCheckInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodCheckInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodCheckInEmoji: {
    fontSize: 28,
  },
  moodCheckInTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  moodCheckInSub: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  moodTrend: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  moodTrendLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  moodTrendBars: {
    gap: 6,
  },
  moodTrendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodTrendBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  moodTrendBarFill: {
    height: 6,
    borderRadius: 3,
  },
  moodTrendValue: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '600' as const,
    width: 30,
    textAlign: 'right',
  },
  scoreCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  overallBadge: {
    backgroundColor: Colors.dark.amberDim,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  overallScore: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.amber,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 14,
  },
  tipEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.dark.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.textMuted,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodOption: {
    width: 62,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  energyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 28,
  },
  energyOption: {
    width: 62,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
    justifyContent: 'flex-end',
  },
  energyBar: {
    width: 20,
    borderRadius: 3,
  },
  energyLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  saveButton: {
    backgroundColor: Colors.dark.amber,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
});
