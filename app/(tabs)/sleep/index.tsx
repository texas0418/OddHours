import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Modal, Animated, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Moon, Plus, Star, Clock, Calendar, ChevronDown, X, BedDouble,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useUser } from '@/providers/UserProvider';
import { sleepTips } from '@/mocks/sleepTips';
import { SleepEntry } from '@/types';

const QUALITY_LABELS = ['Terrible', 'Poor', 'Fair', 'Good', 'Great'];
const QUALITY_COLORS = [
  Colors.dark.danger,
  Colors.dark.warning,
  Colors.dark.amber,
  Colors.dark.success,
  Colors.dark.accent,
];

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const { sleepEntries, addSleepEntry, profile } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [quality, setQuality] = useState(3);
  const [hours, setHours] = useState('7');
  const [notes, setNotes] = useState('');
  const scaleAnims = useRef(QUALITY_LABELS.map(() => new Animated.Value(1))).current;

  const handleQualityPress = useCallback((index: number) => {
    setQuality(index + 1);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnims[index], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [scaleAnims]);

  const handleSave = useCallback(() => {
    const duration = parseFloat(hours) || 0;
    if (duration <= 0 || duration > 24) {
      Alert.alert('Invalid Duration', 'Please enter a valid number of hours (1-24).');
      return;
    }

    const now = new Date();
    const entry: SleepEntry = {
      id: Date.now().toString(),
      date: now.toISOString().split('T')[0],
      bedtime: '',
      wakeTime: '',
      quality,
      duration,
      notes,
    };
    addSleepEntry(entry);
    setShowAddModal(false);
    setQuality(3);
    setHours('7');
    setNotes('');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [hours, quality, notes, addSleepEntry]);

  const avgQuality = sleepEntries.length > 0
    ? (sleepEntries.reduce((s, e) => s + e.quality, 0) / sleepEntries.length).toFixed(1)
    : '—';

  const avgDuration = sleepEntries.length > 0
    ? (sleepEntries.reduce((s, e) => s + e.duration, 0) / sleepEntries.length).toFixed(1)
    : '—';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Sleep Tracker</Text>
            <Text style={styles.subtitle}>Optimized for your shift schedule</Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            testID="add-sleep-button"
          >
            <Plus size={20} color={Colors.dark.background} />
          </Pressable>
        </View>

        <LinearGradient
          colors={['rgba(79, 195, 247, 0.12)', 'rgba(79, 195, 247, 0.03)']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Clock size={18} color={Colors.dark.accent} />
              <Text style={styles.summaryValue}>{avgDuration}h</Text>
              <Text style={styles.summaryLabel}>Avg Duration</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Star size={18} color={Colors.dark.amber} />
              <Text style={styles.summaryValue}>{avgQuality}</Text>
              <Text style={styles.summaryLabel}>Avg Quality</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <BedDouble size={18} color={Colors.dark.purple} />
              <Text style={styles.summaryValue}>{profile.sleepGoal}h</Text>
              <Text style={styles.summaryLabel}>Goal</Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Sleep Tips for Night Workers</Text>
        {sleepTips.map((tip) => (
          <View key={tip.id} style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Moon size={18} color={Colors.dark.accent} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDescription}>{tip.description}</Text>
            </View>
          </View>
        ))}

        {sleepEntries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Recent Entries</Text>
            {sleepEntries.slice(0, 7).map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                  <Text style={styles.entryDuration}>{entry.duration}h sleep</Text>
                </View>
                <View style={styles.entryRight}>
                  <View style={[styles.qualityBadge, { backgroundColor: QUALITY_COLORS[entry.quality - 1] + '25' }]}>
                    <Text style={[styles.qualityText, { color: QUALITY_COLORS[entry.quality - 1] }]}>
                      {QUALITY_LABELS[entry.quality - 1]}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Sleep</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>How long did you sleep?</Text>
            <View style={styles.hoursRow}>
              <TextInput
                style={styles.hoursInput}
                value={hours}
                onChangeText={setHours}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.dark.textMuted}
                testID="sleep-hours-input"
              />
              <Text style={styles.hoursUnit}>hours</Text>
            </View>

            <Text style={styles.fieldLabel}>Sleep Quality</Text>
            <View style={styles.qualityRow}>
              {QUALITY_LABELS.map((label, index) => (
                <Pressable
                  key={label}
                  onPress={() => handleQualityPress(index)}
                  testID={`quality-${index}`}
                >
                  <Animated.View
                    style={[
                      styles.qualityStar,
                      {
                        transform: [{ scale: scaleAnims[index] }],
                        backgroundColor: index < quality ? QUALITY_COLORS[quality - 1] + '25' : Colors.dark.surface,
                        borderColor: index < quality ? QUALITY_COLORS[quality - 1] : Colors.dark.border,
                      },
                    ]}
                  >
                    <Star
                      size={20}
                      color={index < quality ? QUALITY_COLORS[quality - 1] : Colors.dark.textMuted}
                      fill={index < quality ? QUALITY_COLORS[quality - 1] : 'transparent'}
                    />
                  </Animated.View>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.qualityLabel, { color: QUALITY_COLORS[quality - 1] }]}>
              {QUALITY_LABELS[quality - 1]}
            </Text>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did you feel? Any disturbances?"
              placeholderTextColor={Colors.dark.textMuted}
              multiline
              numberOfLines={3}
              testID="sleep-notes-input"
            />

            <Pressable style={styles.saveButton} onPress={handleSave} testID="save-sleep-button">
              <Text style={styles.saveButtonText}>Save Entry</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.dark.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.dark.border,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 14,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 14,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
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
  tipDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  entryLeft: {},
  entryDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  entryDuration: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  entryRight: {},
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600' as const,
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
    marginBottom: 10,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  hoursInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    width: 90,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  hoursUnit: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  qualityStar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
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
