import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { Header, Badge, Card } from '../components/ui';

const BillDetailsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  
  const bill = params.billData ? JSON.parse(params.billData as string) : null;
  const customerName = params.customerName as string;

  if (!bill) return null;

  const handleDownload = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 24px; color: #1E293B; background: #F8FAFC; }
            .header { text-align: center; margin-bottom: 32px; padding: 24px; background: white; border-radius: 16px; }
            .logo { font-size: 28px; font-weight: bold; color: #3B82F6; margin-bottom: 8px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { font-size: 14px; color: #64748B; }
            .section { margin-bottom: 20px; background: white; padding: 20px; border-radius: 16px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 16px; color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .label { color: #64748B; font-size: 14px; }
            .value { font-weight: 600; color: #0F172A; font-size: 14px; }
            .total { font-size: 20px; font-weight: bold; color: #3B82F6; margin-top: 16px; border-top: 2px solid #E2E8F0; padding-top: 16px; }
            .status { text-align: center; font-weight: bold; padding: 12px 24px; border-radius: 12px; margin-bottom: 24px; display: inline-block; }
            .paid { background-color: #ECFDF5; color: #065F46; }
            .unpaid { background-color: #FEF2F2; color: #991B1B; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94A3B8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">💧 STE</div>
            <div class="title">Facture d'Eau</div>
            <div class="subtitle">Société Tchadienne des Eaux</div>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <span class="status ${bill.status === 'paid' ? 'paid' : 'unpaid'}">${bill.status === 'paid' ? '✓ PAYÉ' : '⏱ IMPAYÉ'}</span>
          </div>
          <div class="section">
            <div class="section-title">👤 Informations Client</div>
            <div class="row"><span class="label">Nom Client:</span><span class="value">${customerName || 'N/A'}</span></div>
            <div class="row"><span class="label">Code Client:</span><span class="value">${bill.customerCode}</span></div>
          </div>
          <div class="section">
            <div class="section-title">📄 Détails de la Facture</div>
            <div class="row"><span class="label">Référence:</span><span class="value">${bill.reference}</span></div>
            <div class="row"><span class="label">Période:</span><span class="value">${bill.period}</span></div>
            <div class="row"><span class="label">Date d'émission:</span><span class="value">${new Date(bill.createdAt).toLocaleDateString()}</span></div>
            ${bill.dueDate ? `<div class="row"><span class="label">Date d'échéance:</span><span class="value">${new Date(bill.dueDate).toLocaleDateString()}</span></div>` : ''}
          </div>
          <div class="section">
            <div class="section-title">💧 Consommation</div>
            <div class="row"><span class="label">Consommation Totale:</span><span class="value">${bill.consumption} m³</span></div>
          </div>
          <div class="section">
            <div class="section-title">💰 Paiement</div>
            <div class="row"><span class="label">Montant HT:</span><span class="value">${bill.amount ? bill.amount.toLocaleString() : '0'} FCFA</span></div>
            <div class="row"><span class="label">TVA (0%):</span><span class="value">0 FCFA</span></div>
            <div class="row total"><span class="label">Total à Payer:</span><span class="value">${bill.amount ? bill.amount.toLocaleString() : '0'} FCFA</span></div>
          </div>
          <div class="footer"><p>Merci de votre confiance.</p><p>STE - Société Tchadienne des Eaux</p></div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert(t('common.error'), 'Impossible de générer le PDF');
    }
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
      
      <Header 
        title={t('dashboard.billDetails')} 
        onBack={() => router.back()} 
        rightElement={
          <TouchableOpacity onPress={handleDownload} style={styles.downloadButton} activeOpacity={0.7}>
            <Text style={styles.downloadIcon}>⬇️</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, bill.status === 'paid' ? styles.statusPaid : styles.statusUnpaid]}>
          <Text style={styles.statusIcon}>{bill.status === 'paid' ? '✓' : '⏱'}</Text>
          <Text style={[styles.statusBannerText, bill.status === 'paid' ? styles.textPaid : styles.textUnpaid]}>
            {bill.status === 'paid' ? t('dashboard.billPaid') : t('dashboard.billUnpaid')}
          </Text>
        </View>

        {/* Bill Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.invoiceInfo')}</Text>
          <DetailRow label={t('dashboard.invoiceRef')} value={bill.reference} />
          <DetailRow label={t('dashboard.billingPeriod')} value={bill.period} />
          <DetailRow label={t('dashboard.issueDate')} value={new Date(bill.createdAt).toLocaleDateString()} />
          {bill.dueDate && <DetailRow label={t('dashboard.dueDate')} value={new Date(bill.dueDate).toLocaleDateString()} />}
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
          <View style={styles.consumptionDisplay}>
            <Text style={styles.consumptionValue}>{bill.consumption}</Text>
            <Text style={styles.consumptionUnit}>m³</Text>
          </View>
          <Text style={styles.consumptionLabel}>{t('dashboard.totalConsumption')}</Text>
        </View>

        {/* Amount Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.paymentDetails')}</Text>
          <DetailRow label={t('dashboard.amount')} value={`${bill.amount ? bill.amount.toLocaleString() : '0'} FCFA`} />
          <DetailRow label={t('dashboard.vat')} value="0 FCFA" />
          <View style={styles.divider} />
          <DetailRow label={t('dashboard.totalToPay')} value={`${bill.amount ? bill.amount.toLocaleString() : '0'} FCFA`} isTotal />
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDownload} activeOpacity={0.8}>
          <Text style={styles.actionButtonIcon}>📥</Text>
          <Text style={styles.actionButtonText}>{t('dashboard.downloadInvoice')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  downloadIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
    borderWidth: 2,
  },
  statusPaid: {
    backgroundColor: Colors.success.light,
    borderColor: '#86EFAC',
  },
  statusUnpaid: {
    backgroundColor: Colors.error.light,
    borderColor: '#FCA5A5',
  },
  statusIcon: {
    fontSize: 20,
  },
  statusBannerText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  textPaid: {
    color: Colors.success.text,
  },
  textUnpaid: {
    color: Colors.error.text,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
  },
  detailValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.primary[600],
  },
  consumptionDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  consumptionValue: {
    fontSize: 48,
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
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginVertical: Spacing.md,
  },
  footer: {
    padding: Spacing['2xl'],
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
});

export default BillDetailsScreen;
