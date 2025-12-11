import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: string;
}

const variantStyles = {
  success: {
    bg: Colors.success.light,
    text: Colors.success.text,
    border: '#86EFAC',
  },
  warning: {
    bg: Colors.warning.light,
    text: Colors.warning.text,
    border: '#FDE68A',
  },
  error: {
    bg: Colors.error.light,
    text: Colors.error.text,
    border: '#FCA5A5',
  },
  info: {
    bg: Colors.info.light,
    text: Colors.info.text,
    border: '#7DD3FC',
  },
  neutral: {
    bg: Colors.neutral[100],
    text: Colors.text.secondary,
    border: Colors.border.default,
  },
};

export const Badge: React.FC<BadgeProps> = ({ 
  text, 
  variant = 'neutral',
  size = 'md',
  icon,
}) => {
  const colors = variantStyles[variant];
  
  return (
    <View style={[
      styles.badge,
      size === 'sm' && styles.badgeSm,
      { backgroundColor: colors.bg, borderColor: colors.border },
    ]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[
        styles.text,
        size === 'sm' && styles.textSm,
        { color: colors.text },
      ]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  icon: {
    fontSize: 12,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  textSm: {
    fontSize: Typography.fontSize.xs,
  },
});

export default Badge;
