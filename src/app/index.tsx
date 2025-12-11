import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

const SplashScreen = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (hasNavigated) return;
    
    const timer = setTimeout(() => {
      if (!isLoading && !hasNavigated) {
        setHasNavigated(true);
        if (isAuthenticated) {
          router.replace('/agent-dashboard');
        } else {
          router.replace('/agent-login');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, hasNavigated]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Image
              source={require('../../assets/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.logoRing} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.brandName}>STE</Text>
          <Text style={styles.tagline}>Société Tchadienne des Eaux</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.footerText}>Chargement...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: Spacing['3xl'],
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius['3xl'],
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoRing: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: BorderRadius['3xl'] + 12,
    borderWidth: 2,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
  },
  textContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: Typography.fontSize['5xl'],
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: Spacing['4xl'],
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral[300],
  },
  dotActive: {
    backgroundColor: Colors.primary[500],
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.disabled,
    fontWeight: '500',
  },
});

export default SplashScreen;
