import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors, fontFamily, type } from '@/theme/tokens';

export interface ScoreRingSvgProps {
  value: number;
  label?: string;
  size?: number;
}

export function ScoreRingSvg({
  value,
  label = 'hadir',
  size = 76,
}: ScoreRingSvgProps) {
  const safeVal = Math.max(0, Math.min(100, Math.round(value)));
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - safeVal / 100);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Jalur latar */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceMuted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progres: diputar -90 derajat agar mulai dari jam 12 */}
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </G>
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.valueText}>{safeVal}%</Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 17,
    lineHeight: 20,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  labelText: {
    ...type.micro,
    color: colors.textMuted,
    marginTop: 1,
  },
});