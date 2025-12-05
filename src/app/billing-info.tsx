import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for billing info
export interface BillingInfo {
  factureNo: string;
  clientId: string;
  consommationTotal: number;
  moisFacturation: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
  paymentDate?: string;
}

// Helper functions
const formatCurrency = (amount: number): string => `${amount.toFixed(2)} FCFA`;
const getPaymentStatusColor = (status: 'paid' | 'unpaid'): string => status === 'paid' ? '#10B981' : '#EF4444';
const getPaymentStatusText = (status: 'paid' | 'unpaid'): string => status === 'paid' ? 'Payé' : 'Impayé';

const BillingInfoScreen = () => {
  const router = useRouter();
  const { clientData } = useLocalSearchParams();
  
  // Parse the billing info from params
  const billingInfo: BillingInfo = clientData ? JSON.parse(clientData as string) : null;

  const [clientName, setClientName] = useState<string | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    if (!billingInfo) {
        router.back();
        return;
    }

    const loadProfile = async () => {
      try {
        // Get name from stored session
        const stored = await AsyncStorage.getItem('customer_data');
        if (stored) {
            const data = JSON.parse(stored);
            // Verify it matches the current billing info
            if ((data.clientId === billingInfo.clientId || data.customerCode === billingInfo.clientId) && mounted) {
                setClientName(data.name);
                return;
            }
        }
      } catch (_) {
        // ignore errors
      }
    };
    loadProfile();
    
    // Animate consumption number
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });
    
    Animated.timing(animatedValue, {
      toValue: billingInfo.consommationTotal,
      duration: 2000,
      useNativeDriver: false,
    }).start();
    
    return () => {
      mounted = false;
      animatedValue.removeListener(listener);
    };
  }, [billingInfo?.clientId, billingInfo?.consommationTotal]);

  if (!billingInfo) return null;

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

  const handleViewUnpaidMonths = () => {
    router.push({
      pathname: '/unpaid-months',
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informations de Facturation</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.spacer} />

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
              <Text style={styles.consumptionNumber}>{displayValue}</Text>
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

        {/* Payment Status */}
        <View style={styles.paymentStatusSection}>
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

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewPaidMonths}>
            <Text style={styles.actionButtonText}>📅 Mois payés</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleViewUnpaidMonths}>
            <Text style={styles.actionButtonSecondaryText}>📋 Mois impayés</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 15,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 44,
  },

  backArrowText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#3B82F6',
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scrollView: {
    flex: 1,
  },
  spacer: {
    height: 20,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
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
    marginBottom: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFBFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 20,
  },
  invoiceCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#FEFEFF',
  },
  consumptionCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#06B6D4',
    backgroundColor: '#FEFFFE',
  },
  paymentStatusSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
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
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '700',
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
    fontSize: 52,
    fontWeight: '800',
    color: '#0891B2',
    letterSpacing: -1,
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
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    flex: 1,
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonSecondaryText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BillingInfoScreen;