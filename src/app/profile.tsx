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
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              router.replace('/');
            }
          }
        }
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
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>{I18nManager.isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userRole}>{user?.role?.name || 'AGENT'}</Text>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('auth.email')}</Text>
              <Text style={styles.infoValue}>{user?.email || 'agent@example.com'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.role')}</Text>
              <Text style={styles.infoValue}>{user?.role?.name || 'AGENT'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.agentId')}</Text>
              <Text style={styles.infoValue}>{user?.id ? `#${user.id}` : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <Text style={styles.sectionSubtitle}>{t('profile.selectLanguage')}</Text>
          
          <View style={styles.languageContainer}>
            {['en', 'fr', 'ar'].map((lang) => (
              <TouchableOpacity 
                key={lang} 
                style={[
                  styles.langOption, 
                  currentLang === lang && styles.langOptionActive
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <View style={styles.langRadio}>
                  {currentLang === lang && <View style={styles.langRadioInner} />}
                </View>
                <Text style={[
                  styles.langText,
                  currentLang === lang && styles.langTextActive
                ]}>
                  {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backIcon: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'left',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'left',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  languageContainer: {
    gap: 12,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  langOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  langRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  langText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  langTextActive: {
    color: '#3B82F6', // Primary Blue
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
