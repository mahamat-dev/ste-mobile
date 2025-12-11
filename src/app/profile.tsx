import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { Header, Avatar, Card } from '../components/ui';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('common.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              router.replace('/agent-login');
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = async (lang: string) => {
    await AsyncStorage.setItem('user-language', lang);
    i18n.changeLanguage(lang);
    
    const isRTL = lang === 'ar';
    if (isRTL !== I18nManager.isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      Alert.alert(t('common.warning'), t('common.restart_msg'));
    }
  };

  const displayName = user?.name || 'Agent User';

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <Header title={t('profile.title')} onBack={() => router.back()} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileBackground} />
          <View style={styles.profileContent}>
            <Avatar name={displayName} size="xl" />
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.name || 'AGENT'}</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>✉️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('auth.email')}</Text>
                <Text style={styles.infoValue}>{user?.email || 'agent@example.com'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.role')}</Text>
                <Text style={styles.infoValue}>{user?.role?.name || 'AGENT'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>🆔</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.agentId')}</Text>
                <Text style={styles.infoValue}>{user?.id ? `#${user.id}` : 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <Text style={styles.sectionSubtitle}>{t('profile.selectLanguage')}</Text>
          
          <View style={styles.languageContainer}>
            {languages.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[styles.langOption, currentLang === lang.code && styles.langOptionActive]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langText, currentLang === lang.code && styles.langTextActive]}>{lang.name}</Text>
                <View style={[styles.langRadio, currentLang === lang.code && styles.langRadioActive]}>
                  {currentLang === lang.code && <View style={styles.langRadioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>STE Agent v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  profileCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.lg,
  },
  profileBackground: {
    height: 80,
    backgroundColor: Colors.primary[500],
  },
  profileContent: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    marginTop: -36,
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    marginBottom: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.lg,
  },
  languageContainer: {
    gap: Spacing.md,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  langOptionActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  langFlag: {
    fontSize: 24,
  },
  langText: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  langTextActive: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  langRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langRadioActive: {
    borderColor: Colors.primary[500],
  },
  langRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[500],
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.error.main,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
    ...Shadows.md,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  versionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.disabled,
    textAlign: 'center',
  },
});

export default ProfileScreen;
