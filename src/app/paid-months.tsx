import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { billingApi } from '../services/api';

const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString()} FCFA`;
};

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
        
        // Filter paid bills and format them
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
      } catch (e) {
        if (mounted) setPaidMonths([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [clientId]);

  const goBack = () => router.back();

  const renderPaidMonthCard = ({ item, index }: { item: any; index: number }) => (
    <View key={`${item.factureNo}-${index}`} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.monthText}>{item.moisFacturation}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Numéro de facture</Text>
          <Text style={styles.value}>{item.factureNo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Montant</Text>
          <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
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
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backArrow} onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mois payés</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
         <View style={styles.header}>
           <Text style={styles.subtitle}>Historique des paiements ({clientId})</Text>
         </View>

         {loading ? (
           <View style={styles.centerContainer}>
             <Text style={styles.loadingText}>Chargement...</Text>
           </View>
         ) : paidMonths.length === 0 ? (
           <View style={styles.centerContainer}>
             <Text style={styles.emptyText}>Aucun paiement trouvé.</Text>
           </View>
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
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 44,
  },
  backArrow: {
    paddingLeft: 10,
  },
  backArrowText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#3B82F6',
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  content: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    borderLeftWidth: 6,
    borderLeftColor: '#10B981',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFBFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardBody: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default PaidMonthsScreen;