import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  showBorder?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  rightElement,
  showBorder = true 
}) => {
  return (
    <View style={[styles.header, showBorder && styles.headerBorder]}>
      {onBack ? (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>{I18nManager.isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      
      {rightElement || <View style={styles.placeholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    gap: Spacing.md,
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  backIcon: {
    fontSize: 20,
    color: Colors.primary[500],
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
});

export default Header;
