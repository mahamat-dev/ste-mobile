import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPaidMonthsForClient, formatCurrency } from '../services/mockDataService';

const PaidMonthsScreen = () => {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const [paidMonths, setPaidMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getPaidMonthsForClient(clientId as string);
        if (mounted) setPaidMonths(data);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mois payés</Text>
          <Text style={styles.subtitle}>Historique des paiements ({clientId})</Text>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Chargement...</Text>
        ) : paidMonths.length === 0 ? (
          <Text style={styles.emptyText}>Aucun paiement trouvé.</Text>
        ) : (
          paidMonths.map((billing, index) => (
            <View key={`${billing.factureNo}-${index}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.monthText}>{billing.moisFacturation}</Text>
                {/* Removed payment status badge for redundancy */}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <Text style={styles.label}>Numéro de facture</Text>
                  <Text style={styles.value}>{billing.factureNo}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Montant</Text>
                  <Text style={styles.value}>{formatCurrency(billing.amount)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Date de paiement</Text>
                  <Text style={styles.value}>{new Date(billing.paymentDate).toLocaleDateString('fr-FR')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Consommation</Text>
                  <Text style={styles.value}>{billing.consommationTotal} m³</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>← Retour</Text>
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
  scrollContent: {
    paddingBottom: 24,
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
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardBody: {
    padding: 16,
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
  backButton: {
    backgroundColor: '#6B7280',
    marginHorizontal: 16,
    marginTop: 8,
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

export default PaidMonthsScreen;