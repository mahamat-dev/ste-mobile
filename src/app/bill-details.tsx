import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';

const BillDetailsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  
  const bill = params.billData ? JSON.parse(params.billData as string) : null;
  const customerName = params.customerName as string;

  if (!bill) return null;

  const handleDownload = () => {
    Alert.alert(t('common.info'), t('dashboard.downloadNotAvailable'));
  };

  const DetailRow = ({ label, value, isTotal = false }: { label: string, value: string, isTotal?: boolean }) => (
    <View style={[styles.detailRow, isTotal && styles.totalRow]}>
      <Text style={[styles.detailLabel, isTotal && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.detailValue, isTotal && styles.totalValue]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{I18nManager.isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dashboard.billDetails')}</Text>
        <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
          <Text style={styles.downloadIcon}>⬇️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[
          styles.statusBanner,
          bill.status === 'paid' ? styles.statusPaid : styles.statusUnpaid
        ]}>
          <Text style={[
            styles.statusBannerText,
            bill.status === 'paid' ? styles.textPaid : styles.textUnpaid
          ]}>
            {bill.status === 'paid' ? t('dashboard.billPaid') : t('dashboard.billUnpaid')}
          </Text>
        </View>

        {/* Bill Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.invoiceInfo')}</Text>
          <DetailRow label={t('dashboard.invoiceRef')} value={bill.reference} />
          <DetailRow label={t('dashboard.billingPeriod')} value={bill.period} />
          <DetailRow label={t('dashboard.issueDate')} value={new Date(bill.createdAt).toLocaleDateString()} />
          {bill.dueDate && (
            <DetailRow label={t('dashboard.dueDate')} value={new Date(bill.dueDate).toLocaleDateString()} />
          )}
        </View>

        {/* Customer Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.customerInfo')}</Text>
          <DetailRow label={t('dashboard.customerName')} value={customerName || 'N/A'} />
          <DetailRow label={t('dashboard.customerCode')} value={bill.customerCode} />
        </View>

        {/* Consumption Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.consumptionDetails')}</Text>
          <DetailRow 
            label={t('dashboard.totalConsumption')} 
            value={`${bill.consumption} m³`} 
          />
        </View>

        {/* Amount Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.paymentDetails')}</Text>
          <DetailRow label={t('dashboard.amount')} value={`${bill.amount ? bill.amount.toLocaleString() : '0'} FCFA`} />
          <DetailRow label={t('dashboard.vat')} value="0 FCFA" />
          <View style={styles.divider} />
          <DetailRow 
            label={t('dashboard.totalToPay')} 
            value={`${bill.amount ? bill.amount.toLocaleString() : '0'} FCFA`} 
            isTotal 
          />
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDownload}
        >
          <Text style={styles.actionButtonText}>{t('dashboard.downloadInvoice')}</Text>
        </TouchableOpacity>
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
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusUnpaid: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textPaid: {
    color: '#166534',
  },
  textUnpaid: {
    color: '#991B1B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BillDetailsScreen;
