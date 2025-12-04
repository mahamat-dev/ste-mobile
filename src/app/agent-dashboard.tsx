import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  StatusBar,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { meterApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AgentDashboardScreen = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [readingQuery, setReadingQuery] = useState('');
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingComplaints: 0,
    unpaidBills: 0,
    todayTasks: 0,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/agent-login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setStats({
        totalClients: 156,
        pendingComplaints: 8,
        unpaidBills: 23,
        todayTasks: 12,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      // In a real production app, you'd want to reload here using Updates.reloadAsync() 
      // or native modules. For this demo, we'll let the user know or rely on re-render.
      // Since I18nManager requires a restart for layout direction changes in many cases:
      Alert.alert(t('common.warning'), t('common.restart_msg'));
    }
  };

  const handleMeterReading = () => {
    router.push('/meter-reading');
  };

  const handleViewReadings = async () => {
    const query = readingQuery.trim();
    if (!query) {
      Alert.alert(t('common.warning'), t('dashboard.enterMeterNumber'));
      return;
    }

    setIsLoadingReadings(true);
    setReadings([]);
    try {
      const search = await meterApi.getByMeterNumber(query);
      if (!search.success || !search.data?.meter?.meterId) {
        throw new Error(t('dashboard.meterNotFound'));
      }
      const meterId = search.data.meter.meterId;
      const list = await meterApi.getReadings(meterId);
      setReadings(list.data || []);
      setSelectedMeterId(meterId);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('dashboard.fetchError'));
    } finally {
      setIsLoadingReadings(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const displayName = user?.name || 'Agent User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const currentLang = i18n.language;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.roleText}>{user?.role?.name || t('dashboard.role')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* Language Switcher */}
        <View style={styles.langSwitcher}>
          {['en', 'fr', 'ar'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langBtn, currentLang === lang && styles.langBtnActive]}
              onPress={() => handleLanguageChange(lang)}
            >
              <Text style={[styles.langText, currentLang === lang && styles.langTextActive]}>
                {lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statValue}>{stats.todayTasks}</Text>
            <Text style={styles.statLabel}>{t('dashboard.todayTasks')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{stats.totalClients}</Text>
            <Text style={styles.statLabel}>{t('dashboard.clients')}</Text>
            </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚠️</Text>
            <Text style={styles.statValue}>{stats.pendingComplaints}</Text>
            <Text style={styles.statLabel}>{t('dashboard.complaints')}</Text>
          </View>
        </View>

        {/* Main Action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickAction')}</Text>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleMeterReading}
            activeOpacity={0.8}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconBox}>
                <Text style={styles.actionIcon}>⚡️</Text>
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{t('dashboard.newReading')}</Text>
                <Text style={styles.actionSubtitle}>{t('dashboard.recordIndex')}</Text>
              </View>
              <Text style={styles.actionArrow}>{I18nManager.isRTL ? '←' : '→'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search & History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.searchHistory')}</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={readingQuery}
              onChangeText={setReadingQuery}
              placeholder={t('dashboard.meterPlaceholder')}
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              textAlign={I18nManager.isRTL ? 'right' : 'left'}
            />
            <TouchableOpacity 
              style={[styles.searchButton, isLoadingReadings && styles.searchButtonDisabled]}
              onPress={handleViewReadings}
              disabled={isLoadingReadings}
            >
              {isLoadingReadings ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>{t('dashboard.view')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {readings.length > 0 ? (
            <View style={styles.resultsList}>
              {readings.map((item, idx) => {
                const date = new Date(item.readingDate);
                return (
                  <TouchableOpacity
                    key={`${item.readingId}-${idx}`}
                    style={styles.resultCard}
                    onPress={() => {
                      if (selectedMeterId) {
                        router.push({
                          pathname: '/reading-details',
                          params: {
                            meterId: String(selectedMeterId),
                            readingId: String(item.readingId),
                          },
                        });
                      }
                    }}
                  >
                    <View style={styles.resultCardContent}>
                      <View style={styles.resultDateBox}>
                        <Text style={styles.resultDay}>{date.getDate()}</Text>
                        <Text style={styles.resultMonth}>
                          {date.toLocaleDateString(currentLang, { month: 'short' }).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.resultInfo}>
                        <Text style={styles.resultValue}>{item.readingValue} <Text style={styles.unit}>{t('dashboard.unit')}</Text></Text>
                        <View style={[styles.statusBadge, item.status === 'COMPLETED' ? styles.statusSuccess : styles.statusPending]}>
                          <Text style={[styles.statusText, item.status === 'COMPLETED' ? styles.textSuccess : styles.textPending]}>
                            {item.status === 'COMPLETED' ? t('dashboard.validated') : item.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.chevron}>{I18nManager.isRTL ? '‹' : '›'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>📊</Text>
                <Text style={styles.emptyStateTitle}>{t('dashboard.readingHistory')}</Text>
                <Text style={styles.emptyStateText}>
                  {t('dashboard.searchInstruction')}
                </Text>
              </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  name: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  roleText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  logoutIcon: {
    fontSize: 20,
    color: '#EF4444',
  },
  langSwitcher: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'left', // Ensure alignment is correct in RTL if not auto
  },
  actionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
    textAlign: 'left',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'left',
  },
  actionArrow: {
    fontSize: 20,
    color: '#94A3B8',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
    height: 48,
  },
  searchButton: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultDateBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16, // Will need flip in RTL? Flexbox handles row direction, so margins might need start/end logic if not auto.
    // In React Native, 'marginRight' refers to physical right. In RTL, we want margin between elements.
    // Using 'gap' in parent is better, but keeping support.
    // To be safe for RTL, we can use marginEnd if available or just rely on gap.
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  resultInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'left',
  },
  unit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#166534',
  },
  textPending: {
    color: '#C2410C',
  },
  chevron: {
    fontSize: 20,
    color: '#94A3B8',
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AgentDashboardScreen;
