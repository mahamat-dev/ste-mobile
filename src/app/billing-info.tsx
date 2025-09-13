import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BillingInfo, formatCurrency, formatConsumption, getPaymentStatusColor, getPaymentStatusText, getClientProfile } from '../services/mockDataService';

const BillingInfoScreen = () => {
  const router = useRouter();
  const { clientData } = useLocalSearchParams();
  
  // Parse the billing info from params
  const billingInfo: BillingInfo = JSON.parse(clientData as string);

  const [clientName, setClientName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const profile = await getClientProfile(billingInfo.clientId);
        if (mounted) setClientName(profile?.name ?? null);
      } catch (_) {
        // ignore errors, fallback to clientId
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, [billingInfo.clientId]);

  const handleBackPress = () => {
    router.back();
  };

  const handleViewPaidMonths = () => {
    router.push({
      pathname: '/paid-months',
      params: {
        clientId: billingInfo.clientId,
      },
    });
  };

  const StatusBadge = ({ status }: { status: 'paid' | 'unpaid' }) => {
    const backgroundColor = getPaymentStatusColor(status);
    const text = getPaymentStatusText(status);
    
    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={styles.statusText}>{text}</Text>
      </View>
    );
  };

  const BillingCard = ({ title, children, style }: { title: string; children: React.ReactNode; style?: any }) => (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Informations de Facturation</Text>
          <Text style={styles.clientId}>
            Client: {clientName ? `${clientName} (${billingInfo.clientId})` : billingInfo.clientId}
          </Text>
        </View>

        {/* Invoice Card */}
        <BillingCard title="📄 Facture" style={styles.invoiceCard}>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Numéro de facture</Text>
              <Text style={styles.infoValue}>{billingInfo.factureNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mois de facturation</Text>
              <Text style={styles.infoValue}>{billingInfo.moisFacturation}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'échéance</Text>
              <Text style={styles.infoValue}>{new Date(billingInfo.dueDate).toLocaleDateString('fr-FR')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.totalLabel}>Montant total</Text>
              <Text style={styles.totalValue}>{formatCurrency(billingInfo.amount)}</Text>
            </View>
          </View>
        </BillingCard>

        {/* Consumption Card */}
        <BillingCard title="💧 Consommation" style={styles.consumptionCard}>
          <View style={styles.cardContent}>
            <View style={styles.consumptionDisplay}>
              <Text style={styles.consumptionNumber}>{billingInfo.consommationTotal}</Text>
              <Text style={styles.consumptionUnit}>m³</Text>
            </View>
            <Text style={styles.consumptionLabel}>Consommation totale</Text>
            
            {/* Simple consumption indicator */}
            <View style={styles.consumptionIndicator}>
              <View style={styles.indicatorBar}>
                <View 
                  style={[
                    styles.indicatorFill,
                    { width: `${Math.min((billingInfo.consommationTotal / 100) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.indicatorText}>
                {billingInfo.consommationTotal < 50 ? 'Consommation normale' : 
                 billingInfo.consommationTotal < 75 ? 'Consommation élevée' : 'Consommation très élevée'}
              </Text>
            </View>
          </View>
        </BillingCard>

        {/* Payment Status Card */}
        <BillingCard title="💳 Statut de Paiement" style={styles.paymentCard}>
          <View style={styles.cardContent}>
            <View style={styles.paymentStatusContainer}>
              <StatusBadge status={billingInfo.status} />
              <Text style={styles.paymentDescription}>
                {billingInfo.status === 'paid' 
                  ? 'Votre facture a été payée avec succès.' 
                  : `Votre facture est en attente de paiement. Échéance: ${new Date(billingInfo.dueDate).toLocaleDateString('fr-FR')}`
                }
              </Text>
            </View>
          </View>
        </BillingCard>

        {/* View Paid Months Button */}
        <TouchableOpacity style={styles.paidMonthsButton} onPress={handleViewPaidMonths}>
          <Text style={styles.paidMonthsButtonText}>📅 Voir tous les mois payés</Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Nouvelle Recherche</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  clientId: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardContent: {
    padding: 20,
  },
  invoiceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  consumptionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#06B6D4',
  },
  paymentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  consumptionDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  consumptionNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  consumptionUnit: {
    fontSize: 20,
    color: '#6B7280',
    marginLeft: 4,
  },
  consumptionLabel: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  consumptionIndicator: {
    marginTop: 16,
  },
  indicatorBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  indicatorFill: {
    height: '100%',
    backgroundColor: '#06B6D4',
    borderRadius: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  paymentStatusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  paidMonthsButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  paidMonthsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6B7280',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BillingInfoScreen;