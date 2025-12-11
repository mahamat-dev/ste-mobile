import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { billingApi, customerApi } from '../services/api';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { Header, Badge, EmptyState } from '../components/ui';

interface Bill {
  id: string;
  reference: string;
  period: string;
  amount: number;
  status: 'paid' | 'unpaid';
  dueDate?: string;
  consumption: number;
  createdAt: string;
  customerCode: string;
}

const ClientBillsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [customerCode, setCustomerCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!customerCode.trim()) {
      Alert.alert(t('common.error'), t('dashboard.enterCustomerCode'));
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setCustomer(null);
    setBills([]);

    try {
      const customerResp = await customerApi.searchByCode(customerCode.trim());
      
      if (customerResp.success && customerResp.data) {
        setCustomer(customerResp.data);

        const billsResp = await billingApi.getByCustomerCode(customerCode.trim());
        
        if (billsResp.success) {
          const billsData = Array.isArray(billsResp.data?.data) ? billsResp.data.data : Array.isArray(billsResp.data) ? billsResp.data : [];

          const formattedBills: Bill[] = billsData.map((item: any) => ({
            id: item.billId || item.id,
            reference: item.invoiceNumber || `INV-${item.id}`,
            period: new Date(item.createdAt).toLocaleDateString('default', { month: 'long', year: 'numeric' }),
            amount: item.amount,
            status: item.status?.toLowerCase() === 'paid' ? 'paid' : 'unpaid',
            dueDate: item.dueDate,
            consumption: item.consumption,
            createdAt: item.createdAt,
            customerCode: item.customerCode,
          })).sort((a: Bill, b: Bill) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setBills(formattedBills);
        }
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('dashboard.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBillPress = (bill: Bill) => {
    router.push({
      pathname: '/bill-details',
      params: { billId: bill.id, billData: JSON.stringify(bill), customerName: customer?.name }
    });
  };

  const renderBillItem = ({ item }: { item: Bill }) => (
    <TouchableOpacity style={styles.billCard} onPress={() => handleBillPress(item)} activeOpacity={0.7}>
      <View style={styles.billHeader}>
        <Text style={styles.billRef}>{item.reference}</Text>
        <Badge text={item.status === 'paid' ? t('dashboard.paid') : t('dashboard.unpaid')} variant={item.status === 'paid' ? 'success' : 'error'} size="sm" />
      </View>

      <View style={styles.billDetails}>
        <View>
          <Text style={styles.billLabel}>{t('dashboard.billingPeriod')}</Text>
          <Text style={styles.billValue}>{item.period}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.billAmount}>{item.amount ? item.amount.toLocaleString() : '0'} FCFA</Text>
        </View>
      </View>

      {item.status === 'unpaid' && item.dueDate && (
        <View style={styles.dueDateContainer}>
          <Text style={styles.dueDateIcon}>⏰</Text>
          <Text style={styles.dueDateText}>{t('dashboard.dueDate')}: {new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <Header title={t('dashboard.checkBills')} onBack={() => router.back()} />

      <View style={styles.content}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>{t('dashboard.customerCode')}</Text>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={customerCode}
                onChangeText={setCustomerCode}
                placeholder={t('dashboard.customerCodePlaceholder')}
                placeholderTextColor={Colors.text.disabled}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity 
              style={[styles.searchButton, isLoading && styles.disabledButton]}
              onPress={handleSearch}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? <ActivityIndicator color={Colors.text.inverse} size="small" /> : <Text style={styles.searchButtonText}>{t('dashboard.search')}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Info */}
        {customer && (
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{customer.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerAddress}>{customer.address}</Text>
            </View>
          </View>
        )}

        {/* Results */}
        {hasSearched && !isLoading && (
          <FlatList
            data={bills}
            renderItem={renderBillItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon="📄" title={t('dashboard.noBillsFound')} description="Aucune facture trouvée pour ce client." />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    padding: Spacing['2xl'],
  },
  searchSection: {
    marginBottom: Spacing['2xl'],
  },
  searchLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: Typography.fontSize.lg,
    color: Colors.text.primary,
  },
  searchButton: {
    width: 100,
    height: 52,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing.md,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  listContent: {
    paddingBottom: Spacing['2xl'],
  },
  billCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  billRef: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  billLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  billValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.primary[600],
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.sm,
  },
  dueDateIcon: {
    fontSize: 14,
  },
  dueDateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error.main,
    fontWeight: '600',
  },
});

export default ClientBillsScreen;
