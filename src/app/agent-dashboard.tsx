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
import { useRouter, useLocalSearchParams } from 'expo-router';

const AgentDashboardScreen = () => {
  const router = useRouter();
  const { agentId, agentName, department } = useLocalSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingComplaints: 0,
    unpaidBills: 0,
    todayTasks: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

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
          onPress: () => router.push('/')
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.agentInfo}>
            <Text style={styles.welcomeText}>Bienvenue</Text>
            <Text style={styles.agentName}>{agentName}</Text>
            <Text style={styles.department}>{department}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistiques du Jour</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Text style={styles.statNumber}>{stats.totalClients}</Text>
              <Text style={styles.statLabel}>Clients Totaux</Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardWarning]}>
              <Text style={styles.statNumber}>{stats.pendingComplaints}</Text>
              <Text style={styles.statLabel}>Plaintes en Attente</Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardDanger]}>
              <Text style={styles.statNumber}>{stats.unpaidBills}</Text>
              <Text style={styles.statLabel}>Factures Impayées</Text>
            </View>
            
            <View style={[styles.statCard, styles.statCardSuccess]}>
              <Text style={styles.statNumber}>{stats.todayTasks}</Text>
              <Text style={styles.statLabel}>Tâches du Jour</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleClientSearch}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>🔍</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Rechercher un Client</Text>
              <Text style={styles.actionDescription}>Accéder aux informations de facturation</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleComplaints}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📋</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestion des Plaintes</Text>
              <Text style={styles.actionDescription}>Traiter les plaintes clients</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleMeterReading}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📏</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Relevé de Compteur</Text>
              <Text style={styles.actionDescription}>Effectuer des relevés de compteurs</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleBillingManagement}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>💰</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gestion de Facturation</Text>
              <Text style={styles.actionDescription}>Gérer les factures et paiements</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleReports}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Rapports</Text>
              <Text style={styles.actionDescription}>Générer des rapports détaillés</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  agentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 2,
  },
  department: {
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
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
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statCardDanger: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  spacer: {
    height: 32,
  },
});

export default AgentDashboardScreen;