import React from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import Colors from '@/constants/colors';

interface ScoreRingProps {
  score: number;
  size: number;
  label: string;
  color: string;
}

export default function ScoreRing({ score, size, label, color }: ScoreRingProps) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: Colors.dark.border }]}>
        <View
          style={[
            styles.progress,
            {
              width: size - 6,
              height: size - 6,
              borderRadius: (size - 6) / 2,
              borderColor: color,
              borderTopColor: score > 25 ? color : 'transparent',
              borderRightColor: score > 50 ? color : 'transparent',
              borderBottomColor: score > 75 ? color : 'transparent',
              borderLeftColor: score > 0 ? color : 'transparent',
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        />
        <View style={styles.inner}>
          <Text style={[styles.score, { fontSize: size * 0.28, color }]}>{score}</Text>
          <Text style={[styles.label, { fontSize: size * 0.12 }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    position: 'absolute',
    borderWidth: 3,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontWeight: '700' as const,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
});
