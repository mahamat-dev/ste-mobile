import React, { useState, useEffect } from 'react';
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
      // 1. Search for customer first to validate existence
      const customerResp = await customerApi.searchByCode(customerCode.trim());
      
      if (customerResp.success && customerResp.data) {
        setCustomer(customerResp.data);

        // 2. Fetch bills
        const billsResp = await billingApi.getByCustomerCode(customerCode.trim());
        
        if (billsResp.success) {
          // Transform API response to Bill interface
          const billsData = Array.isArray(billsResp.data?.data) 
            ? billsResp.data.data 
            : Array.isArray(billsResp.data) 
            ? billsResp.data 
            : [];

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
      params: { 
        billId: bill.id,
        billData: JSON.stringify(bill),
        customerName: customer?.name
      }
    });
  };

  const renderBillItem = ({ item }: { item: Bill }) => (
    <TouchableOpacity 
      style={styles.billCard}
      onPress={() => handleBillPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.billHeader}>
        <Text style={styles.billRef}>{item.reference}</Text>
        <View style={[
          styles.statusBadge, 
          item.status === 'paid' ? styles.statusPaid : styles.statusUnpaid
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'paid' ? styles.textPaid : styles.textUnpaid
          ]}>
            {item.status === 'paid' ? t('dashboard.paid') : t('dashboard.unpaid')}
          </Text>
        </View>
      </View>

      <View style={styles.billDetails}>
        <View>
          <Text style={styles.billLabel}>{t('dashboard.billingPeriod')}</Text>
          <Text style={styles.billValue}>{item.period}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.billAmount}>
            {item.amount ? item.amount.toLocaleString() : '0'} FCFA
          </Text>
        </View>
      </View>

      {item.status === 'unpaid' && item.dueDate && (
        <View style={styles.dueDateContainer}>
          <Text style={styles.dueDateText}>
            {t('dashboard.dueDate')}: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{I18nManager.isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dashboard.checkBills')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>{t('dashboard.customerCode')}</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={customerCode}
              onChangeText={setCustomerCode}
              placeholder="CUST-001"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={[styles.searchButton, isLoading && styles.disabledButton]}
              onPress={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>{t('dashboard.search')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Section */}
        {customer && (
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerAddress}>{customer.address}</Text>
          </View>
        )}

        {hasSearched && !isLoading && (
          <FlatList
            data={bills}
            renderItem={renderBillItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={styles.emptyText}>{t('dashboard.noBillsFound')}</Text>
              </View>
            }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  searchButton: {
    width: 100,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customerInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    paddingBottom: 24,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billRef: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusUnpaid: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textPaid: {
    color: '#166534',
  },
  textUnpaid: {
    color: '#991B1B',
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  billLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  billValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  dueDateContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dueDateText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },
});

export default ClientBillsScreen;
