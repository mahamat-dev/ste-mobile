import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
  I18nManager,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { meterApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { Avatar, Badge, StatCard, EmptyState } from '../components/ui';

const AgentDashboardScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [readingQuery, setReadingQuery] = useState('');
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [stats, setStats] = useState({
    totalClients: 0,
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
      await new Promise(resolve => setTimeout(resolve, 800));
      setStats({ totalClients: 156, todayTasks: 12 });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const handleCheckBills = () => router.push('/client-bills');
  const handleMeterReading = () => router.push('/meter-reading');

  const handleViewReadings = async (page: number = 1) => {
    const query = readingQuery.trim();
    if (!query) {
      Alert.alert(t('common.warning'), t('dashboard.enterCustomerCode'));
      return;
    }

    setIsLoadingReadings(true);
    if (page === 1) setReadings([]);
    
    try {
      const search = await meterApi.getByCustomerCode(query);
      if (!search.success || !search.data) throw new Error(t('dashboard.meterNotFound'));
      
      const meter = search.data.meter;
      const customer = search.data.customer;
      if (!meter?.meterId) throw new Error(t('dashboard.meterNotFound'));
      
      setCustomerName(`${customer?.firstName || ''} ${customer?.lastName || ''}`.trim());
      
      let readingsData: any[] = meter.meterReading && Array.isArray(meter.meterReading) 
        ? meter.meterReading 
        : [];
      
      if (!readingsData.length) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const list = await meterApi.getReadings(meter.meterId, page, 10, threeMonthsAgo.toISOString().split('T')[0]);
        readingsData = Array.isArray(list?.data?.data) ? list.data.data : Array.isArray(list?.data) ? list.data : [];
      }
      
      readingsData.sort((a: any, b: any) => new Date(b.readingDate || b.createdAt || 0).getTime() - new Date(a.readingDate || a.createdAt || 0).getTime());
      
      setReadings(readingsData);
      setSelectedMeterId(meter.meterId);
      setCurrentPage(page);
      setTotalPages(Math.ceil(readingsData.length / 10));
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('dashboard.fetchError'));
    } finally {
      setIsLoadingReadings(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const displayName = user?.name || 'Agent User';
  const currentLang = i18n.language;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
          <Avatar name={displayName} size="lg" />
          <View style={styles.userTextContainer}>
            <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.name || t('dashboard.role')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary[500]]} />}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="📋" value={stats.todayTasks} label={t('dashboard.todayTasks')} variant="primary" />
          <StatCard icon="👥" value={stats.totalClients} label={t('dashboard.clients')} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickAction')}</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleMeterReading} activeOpacity={0.7}>
            <View style={[styles.actionIconBox, { backgroundColor: Colors.warning.light }]}>
              <Text style={styles.actionIcon}>💧</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('dashboard.newReading')}</Text>
              <Text style={styles.actionSubtitle}>{t('dashboard.recordIndex')}</Text>
            </View>
            <View style={styles.actionArrowContainer}>
              <Text style={styles.actionArrow}>{I18nManager.isRTL ? '←' : '→'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleCheckBills} activeOpacity={0.7}>
            <View style={[styles.actionIconBox, { backgroundColor: Colors.success.light }]}>
              <Text style={styles.actionIcon}>💰</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>{t('dashboard.checkBills')}</Text>
              <Text style={styles.actionSubtitle}>{t('dashboard.checkBillsDesc')}</Text>
            </View>
            <View style={styles.actionArrowContainer}>
              <Text style={styles.actionArrow}>{I18nManager.isRTL ? '←' : '→'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search & History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.searchHistory')}</Text>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={readingQuery}
                onChangeText={setReadingQuery}
                placeholder={t('dashboard.customerCodePlaceholder')}
                placeholderTextColor={Colors.text.disabled}
                keyboardType="numeric"
                textAlign={I18nManager.isRTL ? 'right' : 'left'}
              />
            </View>
            <TouchableOpacity 
              style={[styles.searchButton, isLoadingReadings && styles.searchButtonDisabled]}
              onPress={() => handleViewReadings(1)}
              disabled={isLoadingReadings}
              activeOpacity={0.8}
            >
              {isLoadingReadings ? (
                <ActivityIndicator color={Colors.text.inverse} size="small" />
              ) : (
                <Text style={styles.searchButtonText}>{t('dashboard.view')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {readings.length > 0 ? (
            <>
              {customerName && (
                <View style={styles.customerBanner}>
                  <Avatar name={customerName} size="sm" color={Colors.primary[600]} />
                  <Text style={styles.customerBannerText}>{customerName}</Text>
                </View>
              )}
              
              <View style={styles.resultsList}>
                {readings.map((item, idx) => {
                  const date = new Date(item.readingDate || item.createdAt);
                  const status = String(item.status || '').toLowerCase();
                  const indexValue = item.currentIndex ?? item.readingValue ?? 0;
                  const consumption = item.consumption ?? 0;
                  const hasImage = !!(item.evidencePhotoUrl || item.photoUrls);
                  
                  const statusVariant = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning';
                  const statusText = status === 'approved' ? t('dashboard.validated') : status === 'rejected' ? t('dashboard.rejected') : t('dashboard.pending');
                  
                  return (
                    <TouchableOpacity
                      key={`${item.meterReadingId || item.readingId || item.id}-${idx}`}
                      style={styles.resultCard}
                      onPress={() => {
                        const readingIdValue = item.meterReadingId || item.readingId || item.id;
                        if (selectedMeterId && readingIdValue) {
                          router.push({
                            pathname: '/reading-details',
                            params: { meterId: String(selectedMeterId), readingId: String(readingIdValue), customerName },
                          });
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resultDateBox}>
                        <Text style={styles.resultDay}>{date.getDate()}</Text>
                        <Text style={styles.resultMonth}>{date.toLocaleDateString(currentLang, { month: 'short' }).toUpperCase()}</Text>
                      </View>

                      <View style={styles.resultInfo}>
                        <View style={styles.resultValueRow}>
                          <Text style={styles.resultValue}>{indexValue} <Text style={styles.unit}>{t('dashboard.unit')}</Text></Text>
                          {hasImage && <Text style={styles.imageIndicator}>📷</Text>}
                        </View>
                        <Text style={styles.consumptionText}>Consommation: {consumption} {t('dashboard.unit')}</Text>
                        <Badge text={statusText} variant={statusVariant} size="sm" />
                      </View>

                      <Text style={styles.chevron}>{I18nManager.isRTL ? '‹' : '›'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => handleViewReadings(currentPage - 1)}
                    disabled={currentPage === 1 || isLoadingReadings}
                  >
                    <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>← Précédent</Text>
                  </TouchableOpacity>
                  <Text style={styles.paginationText}>Page {currentPage} / {totalPages}</Text>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                    onPress={() => handleViewReadings(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoadingReadings}
                  >
                    <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Suivant →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <EmptyState
              icon="📊"
              title={t('dashboard.readingHistory')}
              description={t('dashboard.searchInstruction')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingCard: {
    backgroundColor: Colors.background.primary,
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  loadingText: {
    marginTop: Spacing.lg,
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  userTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  name: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    color: Colors.primary[700],
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 26,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  actionArrowContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionArrow: {
    fontSize: 18,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    height: 52,
  },
  searchButton: {
    paddingHorizontal: Spacing.xl,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  searchButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
  searchButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
    fontSize: Typography.fontSize.md,
  },
  customerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing.md,
  },
  customerBannerText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  resultsList: {
    gap: Spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  resultDateBox: {
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  resultDay: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  resultMonth: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  resultInfo: {
    flex: 1,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  resultValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  unit: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  imageIndicator: {
    fontSize: 16,
  },
  consumptionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  chevron: {
    fontSize: 24,
    color: Colors.text.disabled,
    marginLeft: Spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  paginationButton: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  paginationButtonTextDisabled: {
    color: Colors.text.disabled,
  },
  paginationText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});

export default AgentDashboardScreen;
