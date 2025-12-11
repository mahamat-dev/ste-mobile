import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantColors = {
  default: {
    bg: Colors.neutral[50],
    iconBg: Colors.neutral[100],
    value: Colors.text.primary,
  },
  primary: {
    bg: Colors.primary[50],
    iconBg: Colors.primary[100],
    value: Colors.primary[700],
  },
  success: {
    bg: Colors.success.light,
    iconBg: '#D1FAE5',
    value: Colors.success.dark,
  },
  warning: {
    bg: Colors.warning.light,
    iconBg: '#FEF3C7',
    value: Colors.warning.dark,
  },
};

export const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  value, 
  label,
  variant = 'default',
}) => {
  const colors = variantColors[variant];
  
  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color: colors.value }]} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    ...Shadows.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  value: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatCard;
