import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  accentColor?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  style,
  variant = 'default',
  accentColor,
}) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor },
    style,
  ];

  return (
    <View style={cardStyle}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  elevated: {
    ...Shadows.lg,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: 'transparent',
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
});

export default Card;
