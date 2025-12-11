import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { Header, Badge } from '../components/ui';

interface BillingInfo {
  clientId: string;
  factureNo: string;
  moisFacturation: string;
  dueDate: string;
  amount: number;
  consommationTotal: number;
  status: 'paid' | 'unpaid';
}

const formatCurrency = (amount: number): string => `${amount.toLocaleString()} FCFA`;

const BillingInfoScreen = () => {
  const router = useRouter();
  const { clientData } = useLocalSearchParams();
  const billingInfo: BillingInfo = clientData ? JSON.parse(clientData as string) : null;

  useEffect(() => {
    if (!billingInfo) {
      router.back();
    }
  }, [billingInfo]);

  if (!billingInfo) return null;

  const displayValue = billingInfo.consommationTotal;

  const consumptionLevel = billingInfo.consommationTotal < 50 ? 'normal' : billingInfo.consommationTotal < 75 ? 'high' : 'very-high';
  const consumptionText = consumptionLevel === 'normal' ? 'Consommation normale' : consumptionLevel === 'high' ? 'Consommation élevée' : 'Consommation très élevée';
  const consumptionColor = consumptionLevel === 'normal' ? Colors.success.main : consumptionLevel === 'high' ? Colors.warning.main : Colors.error.main;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Informations de Facturation" onBack={() => router.back()} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Invoice Card */}
        <View style={[styles.card, styles.invoiceCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📄</Text>
            <Text style={styles.cardTitle}>Facture</Text>
          </View>
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
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Montant total</Text>
              <Text style={styles.totalValue}>{formatCurrency(billingInfo.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Consumption Card */}
        <View style={[styles.card, styles.consumptionCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💧</Text>
            <Text style={styles.cardTitle}>Consommation</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.consumptionDisplay}>
              <Text style={styles.consumptionNumber}>{displayValue}</Text>
              <Text style={styles.consumptionUnit}>m³</Text>
            </View>
            <Text style={styles.consumptionLabel}>Consommation totale</Text>
            
            <View style={styles.consumptionIndicator}>
              <View style={styles.indicatorBar}>
                <View style={[styles.indicatorFill, { width: `${Math.min((billingInfo.consommationTotal / 100) * 100, 100)}%`, backgroundColor: consumptionColor }]} />
              </View>
              <Text style={[styles.indicatorText, { color: consumptionColor }]}>{consumptionText}</Text>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.statusSection}>
          <Badge text={billingInfo.status === 'paid' ? 'Payé' : 'Impayé'} variant={billingInfo.status === 'paid' ? 'success' : 'error'} />
          <Text style={styles.statusDescription}>
            {billingInfo.status === 'paid'
              ? 'Votre facture a été payée avec succès.'
              : `Votre facture est en attente de paiement. Échéance: ${new Date(billingInfo.dueDate).toLocaleDateString('fr-FR')}`
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => router.push({ pathname: '/paid-months', params: { clientId: billingInfo.clientId } })}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonIcon}>📅</Text>
            <Text style={styles.primaryButtonText}>Mois payés</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.push({ pathname: '/unpaid-months', params: { clientId: billingInfo.clientId } })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonIcon}>📋</Text>
            <Text style={styles.secondaryButtonText}>Mois impayés</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    ...Shadows.md,
  },
  invoiceCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  consumptionCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.info.main,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: Spacing.sm,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cardContent: {
    padding: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginVertical: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.primary[600],
  },
  consumptionDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  consumptionNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.info.dark,
  },
  consumptionUnit: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  consumptionLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  consumptionIndicator: {
    marginTop: Spacing.md,
  },
  indicatorBar: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  indicatorFill: {
    height: '100%',
    borderRadius: 4,
  },
  indicatorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    padding: Spacing.xl,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  statusDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  primaryButtonIcon: {
    fontSize: 18,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary[500],
    gap: Spacing.sm,
  },
  secondaryButtonIcon: {
    fontSize: 18,
  },
  secondaryButtonText: {
    color: Colors.primary[600],
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
});

export default BillingInfoScreen;
