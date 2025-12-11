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
  StatusBar,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { meterApi } from '../services/api';
import { useTranslation } from 'react-i18next';

const AgentDashboardScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [readingQuery, setReadingQuery] = useState('');
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [stats, setStats] = useState({
    totalClients: 0,
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
        unpaidBills: 23,
        todayTasks: 12,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };




  const handleCheckBills = () => {
    router.push('/client-bills');
  };

  const handleMeterReading = () => {
    router.push('/meter-reading');
  };

  const handleViewReadings = async (page: number = 1) => {
    const query = readingQuery.trim();
    if (!query) {
      Alert.alert(t('common.warning'), t('dashboard.enterCustomerCode'));
      return;
    }

    setIsLoadingReadings(true);
    if (page === 1) {
      setReadings([]);
    }
    
    try {
      // Search by customer ID (e.g., 138533800005)
      const search = await meterApi.getByCustomerCode(query);

      if (!search.success || !search.data) {
        throw new Error(t('dashboard.meterNotFound'));
      }
      
      const meter = search.data.meter;
      const customer = search.data.customer;
      
      if (!meter?.meterId) {
        throw new Error(t('dashboard.meterNotFound'));
      }
      
      const meterId = meter.meterId;
      const customerFullName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim();
      setCustomerName(customerFullName);
      
      // Get readings from meter's meterReading array if available
      let readingsData: any[] = [];
      
      if (meter.meterReading && Array.isArray(meter.meterReading)) {
        // Use readings from the meter object directly
        readingsData = meter.meterReading;
      } else {
        // Fallback: fetch readings via API
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const startDate = threeMonthsAgo.toISOString().split('T')[0];
        
        const list = await meterApi.getReadings(meterId, page, 10, startDate);
        readingsData = Array.isArray(list?.data?.data) 
          ? list.data.data 
          : Array.isArray(list?.data) 
          ? list.data 
          : [];
      }
      
      // Sort by date descending
      readingsData.sort((a: any, b: any) => {
        const dateA = new Date(a.readingDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.readingDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setReadings(readingsData);
      setSelectedMeterId(meterId);
      setCurrentPage(page);
      setTotalPages(Math.ceil(readingsData.length / 10));
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('dashboard.fetchError'));
    } finally {
      setIsLoadingReadings(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handleViewReadings(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handleViewReadings(currentPage - 1);
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
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.roleText}>{user?.role?.name || t('dashboard.role')}</Text>
            </View>
          </TouchableOpacity>
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

        </View>

        {/* Main Action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickAction')}</Text>
          <View style={styles.actionsGrid}>
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

            <TouchableOpacity
              style={[styles.actionCard, { marginTop: 12 }]}
              onPress={handleCheckBills}
              activeOpacity={0.8}
            >
              <View style={styles.actionContent}>
                <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={styles.actionIcon}>💰</Text>
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{t('dashboard.checkBills')}</Text>
                  <Text style={styles.actionSubtitle}>{t('dashboard.checkBillsDesc')}</Text>
                </View>
                <Text style={styles.actionArrow}>{I18nManager.isRTL ? '←' : '→'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.searchHistory')}</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={readingQuery}
              onChangeText={setReadingQuery}
              placeholder={t('dashboard.customerCodePlaceholder')}
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              textAlign={I18nManager.isRTL ? 'right' : 'left'}
            />
            <TouchableOpacity 
              style={[styles.searchButton, isLoadingReadings && styles.searchButtonDisabled]}
              onPress={() => handleViewReadings(1)}
              disabled={isLoadingReadings}
            >
              {isLoadingReadings ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>{t('dashboard.view')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {readings.length > 0 ? (
            <>
              {customerName && (
                <View style={styles.customerBanner}>
                  <Text style={styles.customerBannerIcon}>👤</Text>
                  <Text style={styles.customerBannerText}>{customerName}</Text>
                </View>
              )}
              
              <View style={styles.resultsList}>
                {readings.map((item, idx) => {
                  const date = new Date(item.readingDate || item.createdAt);
                  const status = String(item.status || '').toLowerCase();
                  const indexValue = item.currentIndex ?? item.readingValue ?? 0;
                  const consumption = item.consumption ?? 0;
                  
                  // Determine status styling
                  const isApproved = status === 'approved';
                  const isPending = status === 'pending' || status === 're_submitted';
                  const isRejected = status === 'rejected';
                  
                  // Check if there's an image
                  const hasImage = !!(item.evidencePhotoUrl || item.photoUrls);
                  
                  return (
                    <TouchableOpacity
                      key={`${item.meterReadingId || item.readingId || item.id}-${idx}`}
                      style={styles.resultCard}
                      onPress={() => {
                        const readingIdValue = item.meterReadingId || item.readingId || item.id;
                        
                        if (selectedMeterId && readingIdValue) {
                          router.push({
                            pathname: '/reading-details',
                            params: {
                              meterId: String(selectedMeterId),
                              readingId: String(readingIdValue),
                              customerName: customerName,
                            },
                          });
                        } else {
                          Alert.alert('Erreur', 'Impossible d\'ouvrir les détails de ce relevé.');
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
                          <View style={styles.resultValueRow}>
                            <Text style={styles.resultValue}>
                              {indexValue} <Text style={styles.unit}>{t('dashboard.unit')}</Text>
                            </Text>
                            {hasImage && <Text style={styles.imageIndicator}>📷</Text>}
                          </View>
                          <Text style={styles.consumptionText}>
                            Consommation: {consumption} {t('dashboard.unit')}
                          </Text>
                          <View style={[
                            styles.statusBadge, 
                            isApproved && styles.statusSuccess,
                            isPending && styles.statusPending,
                            isRejected && styles.statusRejected
                          ]}>
                            <Text style={[
                              styles.statusText, 
                              isApproved && styles.textSuccess,
                              isPending && styles.textPending,
                              isRejected && styles.textRejected
                            ]}>
                              {isApproved ? t('dashboard.validated') : 
                               isPending ? t('dashboard.pending') : 
                               isRejected ? t('dashboard.rejected') : 
                               item.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.chevron}>{I18nManager.isRTL ? '‹' : '›'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    onPress={handlePrevPage}
                    disabled={currentPage === 1 || isLoadingReadings}
                  >
                    <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                      ← Précédent
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.paginationInfo}>
                    <Text style={styles.paginationText}>
                      Page {currentPage} / {totalPages}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages || isLoadingReadings}
                  >
                    <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                      Suivant →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
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
    alignItems: 'center',
    marginBottom: 0,
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
    backgroundColor: '#3B82F6', // Primary Blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
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
  actionsGrid: {
    flexDirection: 'column',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'left',
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
    backgroundColor: '#3B82F6', // Primary Blue
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
    marginRight: 16,
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
  statusRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
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
  textRejected: {
    color: '#DC2626',
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
  customerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  customerBannerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  customerBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  imageIndicator: {
    fontSize: 16,
  },
  consumptionText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  paginationButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  paginationButtonTextDisabled: {
    color: '#94A3B8',
  },
  paginationInfo: {
    paddingHorizontal: 12,
  },
  paginationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});


export default AgentDashboardScreen;
