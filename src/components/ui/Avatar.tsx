import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography } from '../../constants/theme';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

const sizeMap = {
  sm: { container: 32, text: 12 },
  md: { container: 44, text: 16 },
  lg: { container: 56, text: 20 },
  xl: { container: 72, text: 28 },
};

export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = 'md',
  color = Colors.primary[500],
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
    
  const dimensions = sizeMap[size];
  
  return (
    <View style={[
      styles.container, 
      { 
        width: dimensions.container, 
        height: dimensions.container,
        borderRadius: dimensions.container / 2,
        backgroundColor: color,
      }
    ]}>
      <Text style={[styles.text, { fontSize: dimensions.text }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Colors.text.inverse,
    fontWeight: '700',
  },
});

export default Avatar;
