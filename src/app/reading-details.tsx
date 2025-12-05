import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  Animated,
  PanResponder,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { meterApi } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReadingDetailsPage() {
  const router = useRouter();
  const { 
    meterId: meterIdParam, 
    readingId: readingIdParam,
    customerName: customerNameParam 
  } = useLocalSearchParams<{ meterId?: string; readingId?: string; customerName?: string }>();
  const meterId = useMemo(() => (meterIdParam ? Number(meterIdParam) : NaN), [meterIdParam]);
  const readingId = useMemo(() => (readingIdParam ? Number(readingIdParam) : NaN), [readingIdParam]);

  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<any | null>(null);
  const [meter, setMeter] = useState<any | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [isSharing, setIsSharing] = useState(false);
  
  // Zoom state
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  
  // Double tap detection
  const lastTap = useRef<number>(0);
  
  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };
  
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      if (lastScale.current > 1) {
        resetZoom();
      } else {
        Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }).start();
        lastScale.current = 2.5;
      }
    }
    lastTap.current = now;
  };
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        handleDoubleTap();
      },
      onPanResponderMove: (_, gestureState) => {
        if (lastScale.current > 1) {
          translateX.setValue(lastTranslateX.current + gestureState.dx);
          translateY.setValue(lastTranslateY.current + gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        lastTranslateX.current += gestureState.dx;
        lastTranslateY.current += gestureState.dy;
      },
    })
  ).current;
  
  const handleShare = async (imageUri: string) => {
    try {
      setIsSharing(true);
      
      await Share.share({
        message: `Photo du compteur - Relevé #${readingId}`,
        url: imageUri,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share error:', error);
        Alert.alert('Erreur', 'Impossible de partager l\'image.');
      }
    } finally {
      setIsSharing(false);
    }
  };
  
  const openImageViewer = (index: number) => {
    setViewerIndex(index);
    resetZoom();
    setViewerVisible(true);
  };
  
  const closeImageViewer = () => {
    setViewerVisible(false);
    resetZoom();
  };

  useEffect(() => {
    const load = async () => {
      if (!meterId || Number.isNaN(meterId) || !readingId || Number.isNaN(readingId)) {
        Alert.alert('Erreur', 'Paramètres de relevé invalides.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        setLoading(false);
        return;
      }
      try {
        // Only fetch readings - meter data is included in the reading object
        const readingsRes = await meterApi.getReadings(meterId);
        
        // Extract readings from response
        const readingsData = Array.isArray(readingsRes?.data?.data) 
          ? readingsRes.data.data 
          : Array.isArray(readingsRes?.data) 
          ? readingsRes.data 
          : [];
        
        // Try multiple ID fields
        const found = readingsData.find((r: any) => {
          const rId = r.meterReadingId || r.readingId || r.id;
          return Number(rId) === Number(readingId);
        });
        
        if (!found) {
          Alert.alert('Erreur', 'Ce relevé n\'existe pas ou a été supprimé.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          // Extract meter data from the reading object
          setMeter(found.meter || null);
          setReading(found);
        }
      } catch (e: any) {
        Alert.alert('Erreur', e?.message || 'Impossible de charger les détails du relevé.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [meterId, readingId]);

  let photos: string[] = [];
  try {
    if (reading?.evidencePhotoUrl) {
      // Single photo URL
      photos = [reading.evidencePhotoUrl];
    } else if (reading?.photoUrls) {
      // Multiple photos (JSON array)
      photos = JSON.parse(reading.photoUrls) || [];
    }
  } catch {
    photos = [];
  }
  
  const status = String(reading?.status || '').toLowerCase();
  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 're_submitted';
  const isRejected = status === 'rejected';
  
  const indexValue = reading?.currentIndex ?? reading?.readingValue ?? 0;
  const previousValue = reading?.previousIndex ?? 0;
  const consumption = reading?.consumption ?? Math.max(0, indexValue - previousValue);

  return (
    <>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={viewerVisible ? "light-content" : "dark-content"} backgroundColor={viewerVisible ? "#000000" : "#FFFFFF"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Relevé</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : !reading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyStateIcon}>📊</Text>
          <Text style={styles.emptyStateTitle}>Relevé introuvable</Text>
          <Text style={styles.emptyStateText}>Ce relevé n'existe pas ou a été supprimé.</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Status Badge */}
          <View style={styles.section}>
            <View style={[
              styles.statusCard,
              isApproved && styles.statusCardSuccess,
              isPending && styles.statusCardPending,
              isRejected && styles.statusCardRejected
            ]}>
              <Text style={styles.statusIcon}>
                {isApproved ? '✓' : isPending ? '⏱' : isRejected ? '✕' : '•'}
              </Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Statut du relevé</Text>
                <Text style={[
                  styles.statusValue,
                  isApproved && styles.statusValueSuccess,
                  isPending && styles.statusValuePending,
                  isRejected && styles.statusValueRejected
                ]}>
                  {isApproved ? 'Approuvé' : isPending ? 'En attente' : isRejected ? 'Rejeté' : reading.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Reading Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations du Relevé</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📈</Text>
                <Text style={styles.statValue}>{indexValue}</Text>
                <Text style={styles.statLabel}>Index Actuel</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statValue}>{previousValue}</Text>
                <Text style={styles.statLabel}>Index Préc.</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💧</Text>
                <Text style={styles.statValue}>{consumption}</Text>
                <Text style={styles.statLabel}>Consommation</Text>
              </View>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📅</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date du relevé</Text>
                  <Text style={styles.infoValue}>
                    {reading.readingDate 
                      ? new Date(reading.readingDate).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🕐</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Heure</Text>
                  <Text style={styles.infoValue}>
                    {reading.readingDate 
                      ? new Date(reading.readingDate).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '—'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Client Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations Client</Text>
            <View style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {customerNameParam 
                      ? customerNameParam.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : (meter?.customer?.firstName?.[0] || '') + (meter?.customer?.lastName?.[0] || 'CL')}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>
                    {customerNameParam || 
                     (meter?.customer?.firstName && meter?.customer?.lastName 
                       ? `${meter.customer.firstName} ${meter.customer.lastName}` 
                       : meter?.customer?.name || '—')}
                  </Text>
                  <Text style={styles.clientDetail}>
                    {meter?.customer?.phone || meter?.customer?.phoneNumber || 'Téléphone non disponible'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Compteur</Text>
                <Text style={styles.detailValue}>{meter?.meterNumber || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Code Client</Text>
                <Text style={styles.detailValue}>{meter?.customer?.customerCode || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Adresse</Text>
                <Text style={styles.detailValue}>
                  {meter?.customer?.address 
                    ? `${meter.customer.address.streetName || ''} ${meter.customer.address.streetNumber || ''}, ${meter.customer.address.city?.cityName || ''}`.trim()
                    : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Agent Information */}
          {reading?.agent && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agent Releveur</Text>
              <View style={styles.agentCard}>
                <View style={styles.agentHeader}>
                  <View style={styles.agentAvatarContainer}>
                    <Text style={styles.agentAvatarText}>
                      {(reading.agent.firstName?.[0] || '') + (reading.agent.lastName?.[0] || '')}
                    </Text>
                  </View>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>
                      {reading.agent.firstName} {reading.agent.lastName}
                    </Text>
                    <Text style={styles.agentDetail}>
                      {reading.agent.email || '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Access Reason */}
          {reading?.accessReason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Accès au Compteur</Text>
              <View style={styles.accessCard}>
                <Text style={styles.accessIcon}>
                  {reading.accessReason === 'Accessed' ? '✓' : '🚪'}
                </Text>
                <Text style={styles.accessText}>
                  {reading.accessReason === 'Accessed' 
                    ? 'Compteur accessible' 
                    : reading.accessReason === 'Door_Closed'
                    ? 'Porte fermée / Compteur inaccessible'
                    : reading.accessReason}
                </Text>
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
                  <Text style={styles.locationValue}>
                    Lat: {reading.latitude || '—'} | Long: {reading.longitude || '—'}
                  </Text>
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
              <View style={styles.emptyPhotoCard}>
                <Text style={styles.emptyPhotoIcon}>📷</Text>
                <Text style={styles.emptyPhotoText}>Aucune photo disponible</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((uri, i) => (
                  <TouchableOpacity 
                    key={`${uri}-${i}`} 
                    style={styles.photoContainer}
                    onPress={() => openImageViewer(i)}
                  >
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
      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          {/* Top Bar */}
          <View style={styles.viewerTopBar}>
            <TouchableOpacity 
              style={styles.viewerCloseButton} 
              onPress={closeImageViewer}
              activeOpacity={0.7}
            >
              <Text style={styles.viewerCloseText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.viewerTitleText}>Photo du Compteur</Text>
            
            <TouchableOpacity 
              style={[styles.viewerShareButton, isSharing && styles.viewerShareButtonDisabled]} 
              onPress={() => photos[viewerIndex] && handleShare(photos[viewerIndex])}
              disabled={isSharing}
              activeOpacity={0.7}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.viewerShareText}>↗</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Image Container with Zoom */}
          <View style={styles.viewerImageContainer} {...panResponder.panHandlers}>
            {photos[viewerIndex] ? (
              <Animated.Image 
                source={{ uri: photos[viewerIndex] }} 
                style={[
                  styles.viewerFullImage,
                  {
                    transform: [
                      { scale },
                      { translateX },
                      { translateY },
                    ],
                  },
                ]} 
                resizeMode="contain" 
              />
            ) : (
              <View style={styles.viewerErrorContainer}>
                <Text style={styles.viewerErrorIcon}>📷</Text>
                <Text style={styles.viewerErrorText}>Image introuvable</Text>
              </View>
            )}
          </View>
          
          {/* Bottom Hint */}
          <View style={styles.viewerBottomBar}>
            <Text style={styles.viewerHintText}>Double-tap pour zoomer • Glisser pour déplacer</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backArrow: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'left',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  statusCardSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  statusCardPending: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  statusCardRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusValueSuccess: {
    color: '#166534',
  },
  statusValuePending: {
    color: '#C2410C',
  },
  statusValueRejected: {
    color: '#DC2626',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  clientCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  commentsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentsText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    lineHeight: 20,
  },
  photoGrid: {
    gap: 12,
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8FAFC',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    alignItems: 'center',
  },
  photoOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyPhotoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyPhotoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyPhotoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
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
    fontSize: 16,
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
    marginBottom: 16,
  },
  viewerErrorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  viewerBottomBar: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  viewerHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  agentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  agentAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  agentDetail: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  accessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accessIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  accessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
});