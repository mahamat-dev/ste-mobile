import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  StatusBar,
  Modal,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { meterApi } from '../services/api';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { Header, Avatar, Badge, StatCard, EmptyState } from '../components/ui';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const BASE_URL = API_BASE_URL.replace(/\/api$/, '');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReadingDetailsPage() {
  const router = useRouter();
  const { meterId: meterIdParam, readingId: readingIdParam, customerName: customerNameParam } = useLocalSearchParams<{ meterId?: string; readingId?: string; customerName?: string }>();
  const meterId = useMemo(() => (meterIdParam ? Number(meterIdParam) : NaN), [meterIdParam]);
  const readingId = useMemo(() => (readingIdParam ? Number(readingIdParam) : NaN), [readingIdParam]);

  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<any | null>(null);
  const [meter, setMeter] = useState<any | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [isSharing, setIsSharing] = useState(false);
  
  const handleShare = async (imageUri: string) => {
    try {
      setIsSharing(true);
      await Share.share({ message: `Photo du compteur - Relevé #${readingId}`, url: imageUri });
    } catch (error: any) {
      if (error?.message !== 'User did not share') Alert.alert('Erreur', 'Impossible de partager l\'image.');
    } finally {
      setIsSharing(false);
    }
  };
  
  const openImageViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };
  
  const closeImageViewer = () => {
    setViewerVisible(false);
  };

  useEffect(() => {
    const load = async () => {
      if (!meterId || Number.isNaN(meterId) || !readingId || Number.isNaN(readingId)) {
        Alert.alert('Erreur', 'Paramètres de relevé invalides.', [{ text: 'OK', onPress: () => router.back() }]);
        setLoading(false);
        return;
      }
      try {
        const readingsRes = await meterApi.getReadings(meterId);
        const readingsData = Array.isArray(readingsRes?.data?.data) ? readingsRes.data.data : Array.isArray(readingsRes?.data) ? readingsRes.data : [];
        const found = readingsData.find((r: any) => Number(r.meterReadingId || r.readingId || r.id) === Number(readingId));
        
        if (!found) {
          Alert.alert('Erreur', 'Ce relevé n\'existe pas ou a été supprimé.', [{ text: 'OK', onPress: () => router.back() }]);
        } else {
          setMeter(found.meter || null);
          setReading(found);
        }
      } catch (e: any) {
        Alert.alert('Erreur', e?.message || 'Impossible de charger les détails du relevé.', [{ text: 'OK', onPress: () => router.back() }]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [meterId, readingId]);

  let photos: string[] = [];
  try {
    if (reading?.evidencePhotoUrl) {
      const photoUrl = reading.evidencePhotoUrl;
      photos = [photoUrl.startsWith('http') ? photoUrl : `${BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`];
    } else if (reading?.photoUrls) {
      const parsed = JSON.parse(reading.photoUrls) || [];
      photos = parsed.map((url: string) => url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`);
    }
  } catch { photos = []; }
  
  const status = String(reading?.status || '').toLowerCase();
  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 're_submitted';
  const isRejected = status === 'rejected';
  
  const indexValue = reading?.currentIndex ?? reading?.readingValue ?? 0;
  const previousValue = reading?.previousIndex ?? 0;
  const consumption = reading?.consumption ?? Math.max(0, indexValue - previousValue);

  const statusVariant = isApproved ? 'success' : isRejected ? 'error' : 'warning';
  const statusText = isApproved ? 'Approuvé' : isPending ? 'En attente' : isRejected ? 'Rejeté' : reading?.status;
  const statusIcon = isApproved ? '✓' : isPending ? '⏱' : isRejected ? '✕' : '•';

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={viewerVisible ? "light-content" : "dark-content"} backgroundColor={viewerVisible ? "#000000" : Colors.background.primary} />
        
        <Header title="Détails du Relevé" onBack={() => router.back()} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          </View>
        ) : !reading ? (
          <View style={styles.loadingContainer}>
            <EmptyState icon="📊" title="Relevé introuvable" description="Ce relevé n'existe pas ou a été supprimé." />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Status Banner */}
            <View style={[styles.statusBanner, isApproved && styles.statusBannerSuccess, isPending && styles.statusBannerPending, isRejected && styles.statusBannerError]}>
              <Text style={styles.statusIcon}>{statusIcon}</Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Statut du relevé</Text>
                <Text style={[styles.statusValue, isApproved && styles.statusValueSuccess, isPending && styles.statusValuePending, isRejected && styles.statusValueError]}>{statusText}</Text>
              </View>
            </View>

            {/* Reading Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations du Relevé</Text>
              <View style={styles.statsGrid}>
                <StatCard icon="📈" value={indexValue} label="Index Actuel" variant="primary" />
                <StatCard icon="📊" value={previousValue} label="Index Préc." />
                <StatCard icon="💧" value={consumption} label="Consommation" variant="success" />
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📅</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Date du relevé</Text>
                    <Text style={styles.infoValue}>{reading.readingDate ? new Date(reading.readingDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>🕐</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Heure</Text>
                    <Text style={styles.infoValue}>{reading.readingDate ? new Date(reading.readingDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Client Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations Client</Text>
              <View style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <Avatar name={customerNameParam || meter?.customer?.firstName || 'CL'} size="lg" />
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{customerNameParam || (meter?.customer?.firstName && meter?.customer?.lastName ? `${meter.customer.firstName} ${meter.customer.lastName}` : '—')}</Text>
                    <Text style={styles.clientDetail}>{meter?.customer?.phone || meter?.customer?.phoneNumber || 'Téléphone non disponible'}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Compteur</Text><Text style={styles.detailValue}>{meter?.meterNumber || '—'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Code Client</Text><Text style={styles.detailValue}>{meter?.customer?.customerCode || '—'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Adresse</Text><Text style={styles.detailValue}>{meter?.customer?.address ? `${meter.customer.address.streetName || ''} ${meter.customer.address.streetNumber || ''}, ${meter.customer.address.city?.cityName || ''}`.trim() : '—'}</Text></View>
              </View>
            </View>

            {/* Agent Information */}
            {reading?.agent && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Agent Releveur</Text>
                <View style={styles.agentCard}>
                  <Avatar name={`${reading.agent.firstName || ''} ${reading.agent.lastName || ''}`} size="md" color={Colors.success.main} />
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{reading.agent.firstName} {reading.agent.lastName}</Text>
                    <Text style={styles.agentDetail}>{reading.agent.email || '—'}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Access Reason */}
            {reading?.accessReason && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Accès au Compteur</Text>
                <View style={styles.accessCard}>
                  <Text style={styles.accessIcon}>{reading.accessReason === 'Accessed' ? '✓' : '🚪'}</Text>
                  <Text style={styles.accessText}>{reading.accessReason === 'Accessed' ? 'Compteur accessible' : reading.accessReason === 'Door_Closed' ? 'Porte fermée / Compteur inaccessible' : reading.accessReason}</Text>
                </View>
              </View>
            )}

            {/* Location */}
            {(reading?.longitude || reading?.latitude) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Localisation</Text>
                <View style={styles.locationCard}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Coordonnées GPS</Text>
                    <Text style={styles.locationValue}>Lat: {reading.latitude || '—'} | Long: {reading.longitude || '—'}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Comments */}
            {(reading?.comments || reading?.notes) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Commentaires</Text>
                <View style={styles.commentsCard}>
                  <Text style={styles.commentsText}>{reading.comments || reading.notes}</Text>
                </View>
              </View>
            )}

            {/* Photos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photo du Compteur</Text>
              {photos.length === 0 ? (
                <EmptyState icon="📷" title="Aucune photo" description="Aucune photo disponible pour ce relevé." />
              ) : (
                <View style={styles.photoGrid}>
                  {photos.map((uri, i) => (
                    <TouchableOpacity key={`${uri}-${i}`} style={styles.photoContainer} onPress={() => openImageViewer(i)} activeOpacity={0.8}>
                      <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                      <View style={styles.photoOverlay}>
                        <Text style={styles.photoOverlayText}>👁 Voir</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Fullscreen Image Viewer Modal */}
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={closeImageViewer} statusBarTranslucent>
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <View style={styles.viewerTopBar}>
            <TouchableOpacity style={styles.viewerCloseButton} onPress={closeImageViewer} activeOpacity={0.7}>
              <Text style={styles.viewerCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.viewerTitleText}>Photo du Compteur</Text>
            <TouchableOpacity style={[styles.viewerShareButton, isSharing && styles.viewerShareButtonDisabled]} onPress={() => photos[viewerIndex] && handleShare(photos[viewerIndex])} disabled={isSharing} activeOpacity={0.7}>
              {isSharing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.viewerShareText}>↗</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.viewerImageContainer}>
            {photos[viewerIndex] ? (
              <Image source={{ uri: photos[viewerIndex] }} style={styles.viewerFullImage} resizeMode="contain" />
            ) : (
              <View style={styles.viewerErrorContainer}>
                <Text style={styles.viewerErrorIcon}>📷</Text>
                <Text style={styles.viewerErrorText}>Image introuvable</Text>
              </View>
            )}
          </View>
          <View style={styles.viewerBottomBar}>
            <Text style={styles.viewerHintText}>Appuyez sur ✕ pour fermer</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  loadingCard: {
    backgroundColor: Colors.background.primary,
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  loadingText: {
    marginTop: Spacing.lg,
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border.default,
    marginBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  statusBannerSuccess: {
    backgroundColor: Colors.success.light,
    borderColor: '#86EFAC',
  },
  statusBannerPending: {
    backgroundColor: Colors.warning.light,
    borderColor: '#FDE68A',
  },
  statusBannerError: {
    backgroundColor: Colors.error.light,
    borderColor: '#FCA5A5',
  },
  statusIcon: {
    fontSize: 32,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusValueSuccess: {
    color: Colors.success.text,
  },
  statusValuePending: {
    color: Colors.warning.text,
  },
  statusValueError: {
    color: Colors.error.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
  },
  clientCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  clientDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing.md,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  agentDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  accessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing.md,
  },
  accessIcon: {
    fontSize: 24,
  },
  accessText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    gap: Spacing.md,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  locationValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  commentsCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  commentsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: '500',
    lineHeight: 22,
  },
  photoGrid: {
    gap: Spacing.md,
  },
  photoContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.md,
  },
  photo: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.neutral[100],
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: Spacing.md,
    alignItems: 'center',
  },
  photoOverlayText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  viewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  viewerTitleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  viewerShareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerShareButtonDisabled: {
    opacity: 0.5,
  },
  viewerShareText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  viewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  viewerFullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  viewerErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerErrorIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  viewerErrorText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
  },
  viewerBottomBar: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  viewerHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
});
