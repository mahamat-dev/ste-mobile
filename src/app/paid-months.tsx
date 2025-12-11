import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { billingApi } from '../services/api';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { Header, EmptyState, Badge } from '../components/ui';

const formatCurrency = (amount: number): string => `${amount.toLocaleString()} FCFA`;

const PaidMonthsScreen = () => {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const [paidMonths, setPaidMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await billingApi.getByCustomerCode(clientId as string);
        const bills = resp?.data?.data || resp?.data || [];
        const billsArray = Array.isArray(bills) ? bills : [];
        
        const paidBills = billsArray
          .filter((b: any) => b.status?.toUpperCase() === 'PAID')
          .map((b: any) => ({
            factureNo: b.invoiceNumber || `INV-${b.billId || b.id}`,
            moisFacturation: new Date(b.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            amount: b.amount || 0,
            paymentDate: b.paidAt || b.updatedAt || b.createdAt,
            consommationTotal: b.consumption || 0,
          }))
          .slice(0, 6);
        
        if (mounted) setPaidMonths(paidBills);
      } catch {
        if (mounted) setPaidMonths([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [clientId]);

  const renderPaidMonthCard = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.monthBadge}>
          <Text style={styles.monthText}>{item.moisFacturation}</Text>
        </View>
        <Badge text="Payé" variant="success" size="sm" icon="✓" />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Numéro de facture</Text>
          <Text style={styles.value}>{item.factureNo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Montant</Text>
          <Text style={styles.valueHighlight}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date de paiement</Text>
          <Text style={styles.value}>{new Date(item.paymentDate).toLocaleDateString('fr-FR')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Consommation</Text>
          <Text style={styles.value}>{item.consommationTotal} m³</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Mois payés" onBack={() => router.back()} />
      
      <View style={styles.content}>
        <View style={styles.subheader}>
          <Text style={styles.subtitle}>Historique des paiements</Text>
          <View style={styles.clientBadge}>
            <Text style={styles.clientBadgeText}>{clientId}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : paidMonths.length === 0 ? (
          <EmptyState icon="📅" title="Aucun paiement" description="Aucun paiement trouvé pour ce client." />
        ) : (
          <FlatList
            data={paidMonths}
            renderItem={renderPaidMonthCard}
            keyExtractor={(item, index) => `${item.factureNo}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
    padding: Spacing['2xl'],
  },
  subheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  clientBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  clientBadgeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  flatListContent: {
    paddingBottom: Spacing['4xl'],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success.main,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  monthBadge: {
    flex: 1,
  },
  monthText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  cardBody: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
  },
  value: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  valueHighlight: {
    fontSize: Typography.fontSize.md,
    color: Colors.success.dark,
    fontWeight: '700',
  },
});

export default PaidMonthsScreen;
