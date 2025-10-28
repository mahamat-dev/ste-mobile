import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { TextInput } from 'react-native';
import { meterApi } from '../services/api';

const AgentDashboardScreen = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  
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
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/agent-login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to load dashboard statistics
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      setStats({
        totalClients: 156,
        pendingComplaints: 8,
        unpaidBills: 23,
        todayTasks: 12,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données du tableau de bord.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
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

  const handleClientSearch = () => {
    router.push('/client-input');
  };

  const handleComplaints = () => {
    router.push('/complaint-form');
  };

  const handleMeterReading = () => {
    router.push('/meter-reading');
  };

  const handleBillingManagement = () => {
    Alert.alert(
      'Gestion de Facturation',
      'Fonctionnalité en cours de développement.\nVous pourrez bientôt gérer la facturation des clients.'
    );
  };

  const handleReports = () => {
    Alert.alert(
      'Rapports',
      'Fonctionnalité en cours de développement.\nVous pourrez bientôt générer des rapports détaillés.'
    );
  };

  const handleViewReadings = async () => {
    const query = readingQuery.trim();
    if (!query) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de compteur.');
      return;
    }

    setIsLoadingReadings(true);
    setReadings([]);
    try {
      const search = await meterApi.getByMeterNumber(query);
      if (!search.success || !search.data?.meter?.meterId) {
        throw new Error('Compteur introuvable');
      }
      const meterId = search.data.meter.meterId;
      const list = await meterApi.getReadings(meterId);
      setReadings(list.data || []);
      setSelectedMeterId(meterId);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || "Impossible d'afficher les relevés.");
    } finally {
      setIsLoadingReadings(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleLabel = user?.role?.name || user?.userType || user?.department;
  const displayName = (user?.name || '').trim();
  const shouldHideName = displayName && (
    (roleLabel && displayName.toLowerCase() === String(roleLabel).toLowerCase()) ||
    displayName.toLowerCase() === 'agent'
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  {!shouldHideName && displayName ? (
                    <Text style={styles.userName}>{displayName}</Text>
                  ) : null}
                </View>
                {roleLabel ? (
                  <View style={styles.roleChip}>
                    <Text style={styles.roleText}>{roleLabel}</Text>
                  </View>
                ) : null}
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>⎋</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCardFull, styles.statCardSuccess]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>✓</Text>
              </View>
              <Text style={styles.statNumber}>{stats.todayTasks}</Text>
              <Text style={styles.statLabel}>Tâches du jour</Text>
            </View>
          </View>
        </View>

        {/* Action principale */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Action Principale</Text>
          <View style={styles.actionsGridSingle}>
            <TouchableOpacity style={styles.actionCardHero} onPress={handleMeterReading}>
              <View style={styles.actionCardHeader}>
                <View style={[styles.actionIconHero, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={styles.actionIconTextHero}>📏</Text>
                </View>
              </View>
              <Text style={styles.actionTitleHero}>Relevé de Compteur</Text>
              <Text style={styles.actionDescriptionHero}>Commencer un nouveau relevé</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Historique des Relevés */}
        <Text style={styles.sectionTitle}>Historique des Relevés</Text>
        <View style={styles.readingsCard}>
          <Text style={styles.readingsLabel}>Numéro de Compteur</Text>
          <TextInput
            style={styles.readingsInput}
            value={readingQuery}
            onChangeText={setReadingQuery}
            placeholder="Ex: STE001234"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={[styles.readingsButton, isLoadingReadings && styles.buttonDisabled]} 
            onPress={handleViewReadings}
            disabled={isLoadingReadings}
          >
            {isLoadingReadings ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.readingsButtonText}>Voir relevés</Text>
            )}
          </TouchableOpacity>

          {readings.length > 0 ? (
            <View style={styles.readingsList}>
              {readings.map((item, idx) => {
                const date = new Date(item.readingDate);
                let photosCount = 0;
                try {
                  photosCount = item.photoUrls ? JSON.parse(item.photoUrls)?.length || 0 : 0;
                } catch {}
                return (
                  <TouchableOpacity
                    key={`${item.readingId}-${idx}`}
                    style={styles.readingRow}
                    onPress={() => {
                      if (!selectedMeterId) {
                        Alert.alert('Erreur', 'Compteur introuvable pour ce relevé.');
                        return;
                      }
                      router.push({
                        pathname: '/reading-details',
                        params: {
                          meterId: String(selectedMeterId),
                          readingId: String(item.readingId),
                        },
                      });
                    }}
                  >
                    <View style={styles.readingRowLeft}>
                      <Text style={styles.readingDate}>{date.toLocaleString()}</Text>
                      <Text style={styles.readingValue}>Index: {Number(item.readingValue)}</Text>
                      <Text style={styles.readingStatus}>Statut: {item.status}</Text>
                    </View>
                    <View style={styles.readingRowRight}>
                      <View style={[styles.photoBadge, photosCount > 0 ? styles.photoBadgeActive : styles.photoBadgeMuted]}>
                        <Text style={styles.photoBadgeText}>{photosCount} Photo(s)</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.readingsEmpty}>Aucun relevé trouvé pour ce compteur.</Text>
          )}
        </View>

        <View style={styles.spacer} />
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    gap: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
    position: 'relative',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#111827',
  },
  avatarBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 6,
  },
  roleChip: {
    backgroundColor: '#EBF5FF',
    padding: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexGrow: 0,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',

  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 18,
    color: '#DC2626',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionsGridSingle: {
    flexDirection: 'column',
    gap: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statCardFull: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statCardPrimary: {
    backgroundColor: '#EBF5FF',
    borderColor: '#DBEAFE',
  },
  statCardWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statCardDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statCardSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 28,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCardLarge: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionCardHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  actionCardHeader: {
    marginBottom: 16,
  },
  actionIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconHero: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconTextLarge: {
    fontSize: 32,
  },
  actionIconTextHero: {
    fontSize: 36,
  },
  actionTitleLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionTitleHero: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  actionDescriptionLarge: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionDescriptionHero: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  spacer: {
    height: 32,
  },
  readingsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  readingsLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  readingsInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#111827',
  },
  readingsButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  readingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  readingsList: {
    marginTop: 8,
    gap: 8,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  readingRowLeft: {
    flex: 1,
  },
  readingRowRight: {
    marginLeft: 12,
  },
  readingDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  readingValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },
  readingStatus: {
    fontSize: 13,
    color: '#374151',
    marginTop: 4,
  },
  photoBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  photoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  photoBadgeActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  photoBadgeMuted: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readingsEmpty: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AgentDashboardScreen;