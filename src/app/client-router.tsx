import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface Stats {
  monthlyConsumption: number;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
}

interface CustomerData {
  clientId?: string;
  customerCode?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phone?: string;
  phoneNumber?: string;
  stats?: Stats;
}

const ClientRouterScreen = () => {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const [clientProfile, setClientProfile] = useState<CustomerData | null>(null);
  const [stats, setStats] = useState<Stats>({
    monthlyConsumption: 0,
    totalBills: 0,
    paidBills: 0,
    unpaidBills: 0,
  });

  useEffect(() => {
    const loadClientData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('customer_data');
        if (storedData) {
          const profile = JSON.parse(storedData);
          setClientProfile(profile);
          
          // Use stats from stored data (fetched during customer search)
          if (profile.stats) {
            setStats(profile.stats);
          }
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      }
    };
    loadClientData();
  }, [clientId]);

  const handleCheckPaymentStatus = async () => {
    const idToUse = clientProfile?.clientId || clientProfile?.customerCode || (clientId as string);
    router.push({
      pathname: '/billing-info',
      params: { clientId: idToUse },
    });
  };

  const handleComplain = () => {
    router.push({
      pathname: '/complaint-form',
      params: { clientId: clientProfile?.clientId || clientProfile?.customerCode || (clientId as string) },
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  // Build display name from available fields
  const getDisplayName = () => {
    if (clientProfile?.name) return clientProfile.name;
    if (clientProfile?.firstName || clientProfile?.lastName) {
      return `${clientProfile.firstName || ''} ${clientProfile.lastName || ''}`.trim();
    }
    return 'Client';
  };

  const fullName = getDisplayName();
  const displayName = fullName.split(' ')[0] || 'Client';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CL';

  const displayClientId = clientProfile?.clientId || clientProfile?.customerCode || (clientId as string);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Espace</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName}</Text>
              <Text style={styles.profileId}>{displayClientId}</Text>
            </View>
          </View>
          {clientProfile?.address && (
            <View style={styles.profileDetail}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{clientProfile.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bonjour, {displayName} 👋</Text>
          <Text style={styles.welcomeSubtitle}>Que souhaitez-vous faire aujourd'hui ?</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCheckPaymentStatus}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>💳</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes Factures</Text>
              <Text style={styles.actionDescription}>
                Consultez vos factures et l'historique de vos paiements
              </Text>
            </View>
            <View style={styles.actionArrowContainer}>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleComplain}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, styles.actionIconOrange]}>
              <Text style={styles.actionIcon}>📝</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Réclamation</Text>
              <Text style={styles.actionDescription}>
                Signalez un problème ou déposez une réclamation
              </Text>
            </View>
            <View style={styles.actionArrowContainer}>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCheckPaymentStatus}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, styles.actionIconGreen]}>
              <Text style={styles.actionIcon}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ma Consommation</Text>
              <Text style={styles.actionDescription}>
                Suivez votre consommation d'eau mensuelle
              </Text>
            </View>
            <View style={styles.actionArrowContainer}>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Aperçu rapide</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💧</Text>
              <Text style={styles.statValue}>{stats.monthlyConsumption}</Text>
              <Text style={styles.statLabel}>m³ ce mois</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📄</Text>
              <Text style={styles.statValue}>{stats.totalBills}</Text>
              <Text style={styles.statLabel}>Factures</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{stats.paidBills}</Text>
              <Text style={styles.statLabel}>Payées</Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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
  backArrow: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIconOrange: {
    backgroundColor: '#FFF7ED',
  },
  actionIconGreen: {
    backgroundColor: '#F0FDF4',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  actionArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionArrow: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ClientRouterScreen;
