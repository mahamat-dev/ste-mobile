import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { meterApi } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

interface ClientInfo {
  customerId: number;
  meterId: number;
  name: string;
  meterNumber: string;
  zoneCode: string;
  longitude: string;
  latitude: string;
  previousIndex: number;
  address?: string;
}

const MeterReadingScreen = () => {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [currentIndex, setCurrentIndex] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isInaccessible, setIsInaccessible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestStatus, setLatestStatus] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [statusCheckLoading, setStatusCheckLoading] = useState<boolean>(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [statusValidated, setStatusValidated] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for loading
  useEffect(() => {
    if (isSubmitting && !showSuccessAnimation) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSubmitting, showSuccessAnimation]);

  // Success animation
  useEffect(() => {
    if (showSuccessAnimation) {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      successScaleAnim.setValue(0);
    }
  }, [showSuccessAnimation]);

  // Error shake animation
  useEffect(() => {
    if (submitError) {
      Animated.sequence([
        Animated.timing(errorShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [submitError]);

  const isSameBillingMonth = (dateStr: string): boolean => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } catch {
      return false;
    }
  };

  const hasApprovedReadingThisMonth = (readings: any[]): boolean => {
    if (!readings || readings.length === 0) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return readings.some((reading: any) => {
      const readingDate = new Date(reading?.readingDate || reading?.createdAt || 0);
      const status = String(reading?.status || '').toLowerCase();
      
      return (
        readingDate.getFullYear() === currentYear &&
        readingDate.getMonth() === currentMonth &&
        status === 'approved'
      );
    });
  };

  const hasPendingReading = (readings: any[]): boolean => {
    if (!readings || readings.length === 0) return false;
    
    return readings.some((reading: any) => {
      const status = String(reading?.status || '').toLowerCase();
      return status === 'pending' || status === 're_submitted';
    });
  };

  // Allow taking reading when status is validated and not blocked
  // isInaccessible is a valid state for submission (door closed, etc.)
  const canTakeReading = statusValidated && !isBlocked;

  const handleSearch = async () => {
    const trimmedId = searchId.trim();
    if (!trimmedId) {
      Alert.alert('Erreur', 'Veuillez entrer un code client (ex: CUST-001).');
      return;
    }

    setIsSearching(true);

    try {
      const response = await meterApi.getByCustomerCode(trimmedId);

      if (response.success && response.data) {
        const data = response.data as {
          meter: any;
          customer: any;
          lastReading: { readingValue?: number } | null;
        };
        const { meter, customer, lastReading } = data;

        if (!customer) {
          throw new Error('Client introuvable.');
        }

        if (!meter) {
          throw new Error("Aucun compteur associé à ce client. Veuillez contacter l'administrateur.");
        }

        const info = {
          customerId: customer.customerId,
          meterId: meter.meterId,
          name: `${customer.firstName} ${customer.lastName}`,
          meterNumber: meter.meterNumber,
          zoneCode: customer.address?.area?.name || customer.address?.district?.name || 'N/A',
          longitude: customer.address?.longitude || '0.0',
          latitude: customer.address?.latitude || '0.0',
          previousIndex:
            (typeof lastReading?.readingValue === 'number'
              ? lastReading.readingValue
              : Number(lastReading?.readingValue)) || Number(meter.installationIndex) || 0,
          address: customer.address
            ? `${customer.address.streetName || ''} ${customer.address.streetNumber || ''}, ${customer.address.city?.cityName || ''}`
            : 'N/A',
        } as ClientInfo;
        setClientInfo(info);

        if (info.previousIndex && Number(info.previousIndex) > 0) {
          setCurrentIndex(String(info.previousIndex));
        } else {
          setCurrentIndex('');
        }

        setStatusCheckLoading(true);
        try {
          const readings = await meterApi.getReadings(info.meterId);
          const items = Array.isArray(readings?.data?.data) ? readings.data.data : Array.isArray(readings?.data) ? readings.data : [];
          
          if (items.length === 0) {
            setLatestStatus(null);
            setIsBlocked(false);
            setBlockedReason(null);
            setStatusValidated(true);
          } else {
            // Check for pending readings first
            if (hasPendingReading(items)) {
              setIsBlocked(true);
              setBlockedReason("Relevé en attente d'approbation");
              setStatusValidated(true);
              setLatestStatus('PENDING');
            }
            // Check for approved reading this month
            else if (hasApprovedReadingThisMonth(items)) {
              setIsBlocked(true);
              setBlockedReason('Relevé déjà approuvé pour ce mois');
              setStatusValidated(true);
              setLatestStatus('APPROVED');
            }
            // No blocking conditions - allow retake if rejected or no recent reading
            else {
              setIsBlocked(false);
              setBlockedReason(null);
              setStatusValidated(true);
              
              // Get latest status for display
              const latest = [...items].sort((a: any, b: any) => {
                const bx = new Date(b?.readingDate || b?.createdAt || 0).getTime();
                const ax = new Date(a?.readingDate || a?.createdAt || 0).getTime();
                return bx - ax;
              })[0];
              const latestStatus = String(latest?.status || '').toLowerCase();
              setLatestStatus(latest?.status || null);
              
              // Show helpful message if last reading was rejected
              if (latestStatus === 'rejected') {
                setBlockedReason('Dernier relevé rejeté - Vous pouvez soumettre un nouveau relevé');
              }
            }
          }
        } catch (err) {
          console.warn('Status check failed:', err);
          setLatestStatus(null);
          setIsBlocked(false);
          setBlockedReason(null);
          setStatusValidated(false);
        } finally {
          setStatusCheckLoading(false);
        }
      } else {
        Alert.alert('Client non trouvé', `L'identifiant "${trimmedId}" n'existe pas.`, [
          { text: 'Réessayer', onPress: () => setSearchId('') },
        ]);
      }
    } catch (error: any) {
      console.warn('Search warning:', error?.message || error);
      Alert.alert(
        'Erreur',
        error?.message?.includes('401') || error?.message?.toLowerCase().includes('unauthorized')
          ? 'Accès non autorisé. Veuillez vous connecter.'
          : error.message || 'Une erreur est survenue.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleChoosePhoto = async () => {
    if (Platform.OS === 'web') {
      const libResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!libResult.canceled && libResult.assets[0]) {
        setSelectedImage(libResult.assets[0].uri);
      }
      return;
    }

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status === 'granted') {
      try {
        const camResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!camResult.canceled && camResult.assets[0]) {
          setSelectedImage(camResult.assets[0].uri);
          return;
        }
      } catch {}
    }

    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libraryPermission.status === 'granted') {
      const libResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!libResult.canceled && libResult.assets[0]) {
        setSelectedImage(libResult.assets[0].uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!clientInfo) {
      Alert.alert('Erreur', 'Aucun client sélectionné.');
      return;
    }

    if (!isInaccessible && !currentIndex.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer l\'index actuel.');
      return;
    }

    if (!isInaccessible && !selectedImage) {
      Alert.alert('Erreur', 'Veuillez ajouter une photo du compteur.');
      return;
    }

    // Double-check for duplicate submissions
    if (isBlocked) {
      Alert.alert('Erreur', blockedReason || 'Ce relevé ne peut pas être soumis.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-validate before submission
      const readings = await meterApi.getReadings(clientInfo.meterId);
      const items = Array.isArray(readings?.data?.data) ? readings.data.data : Array.isArray(readings?.data) ? readings.data : [];
      
      if (hasPendingReading(items)) {
        throw new Error("Un relevé est déjà en attente d'approbation pour ce compteur.");
      }
      
      if (hasApprovedReadingThisMonth(items)) {
        throw new Error('Un relevé a déjà été approuvé pour ce mois.');
      }

      const normalizedIndex = currentIndex.replace(/,/g, '.').trim();
      const parsedIndex = Number(normalizedIndex);
      if (!isInaccessible && Number.isNaN(parsedIndex)) {
        throw new Error('Index invalide.');
      }

      // Validate index is not less than previous
      if (!isInaccessible && parsedIndex < clientInfo.previousIndex) {
        Alert.alert(
          'Attention',
          `L'index actuel (${parsedIndex}) est inférieur à l'index précédent (${clientInfo.previousIndex}). Voulez-vous continuer ?`,
          [
            { text: 'Annuler', style: 'cancel', onPress: () => setIsSubmitting(false) },
            { 
              text: 'Continuer', 
              onPress: async () => {
                await submitReadingData(parsedIndex);
              }
            }
          ]
        );
        return;
      }

      await submitReadingData(parsedIndex);
    } catch (error: any) {
      setSubmitError(error?.message || "Impossible d'enregistrer le relevé.");
      setIsSubmitting(false);
    }
  };

  const submitReadingData = async (parsedIndex: number) => {
    try {
      setUploadProgress('Préparation des données...');
      await new Promise(resolve => setTimeout(resolve, 300));

      const payload = {
        meterId: clientInfo!.meterId,
        currentIndex: isInaccessible ? undefined : parsedIndex,
        previousIndex: clientInfo!.previousIndex,
        isInaccessible,
        imageUri: selectedImage || undefined,
        longitude: clientInfo!.longitude,
        latitude: clientInfo!.latitude,
      };

      setUploadProgress('Envoi de la photo...');
      await new Promise(resolve => setTimeout(resolve, 400));

      setUploadProgress('Enregistrement du relevé...');
      await meterApi.submitReading(payload);
      
      setUploadProgress('Finalisation...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSubmitError(null);
      setShowSuccessAnimation(true);

      // Wait for animation then show alert
      setTimeout(() => {
        setShowSuccessAnimation(false);
        Alert.alert('✅ Succès', 'Relevé enregistré avec succès.', [
          {
            text: 'OK',
            onPress: () => {
              setCurrentIndex('');
              setSelectedImage(null);
              setIsInaccessible(false);
              setUploadProgress('');
              // Refresh status
              setIsBlocked(true);
              setBlockedReason("Relevé en attente d'approbation");
            },
          },
        ]);
      }, 1000);
    } catch (error: any) {
      setUploadProgress('');
      setShowSuccessAnimation(false);
      setSubmitError(error?.message || "Impossible d'enregistrer le relevé.");
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setUploadProgress('');
      }, 1200);
    }
  };

  const handleReset = () => {
    setCurrentIndex('');
    setSelectedImage(null);
    setIsInaccessible(false);
  };

  const initials = clientInfo?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {isSubmitting && (
        <View style={styles.loaderOverlay}>
          <Animated.View style={[styles.loaderCard, { transform: [{ scale: pulseAnim }] }]}>
            {showSuccessAnimation ? (
              <>
                <Animated.View style={[styles.successCircle, { transform: [{ scale: successScaleAnim }] }]}>
                  <Text style={styles.successIcon}>✓</Text>
                </Animated.View>
                <Text style={styles.successText}>Relevé enregistré !</Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loaderText}>{uploadProgress || 'Envoi en cours…'}</Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relevé de Compteur</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rechercher Client</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchId}
              onChangeText={setSearchId}
              placeholder="Code Client (ex: CUST-001)"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Rechercher</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Client Information */}
        {clientInfo && (
          <>
            <View style={styles.section}>
              <View style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{clientInfo.name}</Text>
                    <Text style={styles.clientId}>ID: {clientInfo.customerId}</Text>
                  </View>
                </View>

                {statusCheckLoading ? (
                  <View style={styles.statusBadgePending}>
                    <Text style={styles.statusTextPending}>Vérification…</Text>
                  </View>
                ) : isBlocked ? (
                  <View style={styles.statusBadgeBlocked}>
                    <Text style={styles.statusTextBlocked}>{blockedReason}</Text>
                  </View>
                ) : blockedReason ? (
                  <View style={styles.statusBadgeWarning}>
                    <Text style={styles.statusTextWarning}>{blockedReason}</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadgeSuccess}>
                    <Text style={styles.statusTextSuccess}>Prêt pour relevé</Text>
                  </View>
                )}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>📊</Text>
                  <Text style={styles.statValue}>{clientInfo.meterNumber}</Text>
                  <Text style={styles.statLabel}>Compteur</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>📈</Text>
                  <Text style={styles.statValue}>{clientInfo.previousIndex}</Text>
                  <Text style={styles.statLabel}>Index Préc.</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>📍</Text>
                  <Text style={styles.statValue}>{clientInfo.zoneCode}</Text>
                  <Text style={styles.statLabel}>Zone</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>🏠</Text>
                  <Text style={styles.statValue} numberOfLines={2}>{clientInfo.address}</Text>
                  <Text style={styles.statLabel}>Adresse</Text>
                </View>
              </View>

              {/* GPS Coordinates */}
              <View style={styles.gpsCard}>
                <Text style={styles.gpsIcon}>🌍</Text>
                <View style={styles.gpsInfo}>
                  <Text style={styles.gpsLabel}>Coordonnées GPS</Text>
                  <Text style={styles.gpsValue}>
                    Lat: {clientInfo.latitude} | Long: {clientInfo.longitude}
                  </Text>
                </View>
              </View>
            </View>

            {/* Reading Input Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saisie du Relevé</Text>

              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>Index Actuel</Text>
                <TextInput
                  style={[styles.input, (!canTakeReading || statusCheckLoading) && styles.inputDisabled]}
                  value={currentIndex}
                  onChangeText={setCurrentIndex}
                  placeholder="Entrez l'index"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  editable={canTakeReading && !statusCheckLoading}
                />

                <Text style={styles.inputLabel}>Photo du Compteur</Text>
                {selectedImage ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => setSelectedImage(null)}
                      disabled={!canTakeReading || statusCheckLoading}
                    >
                      <Text style={styles.removePhotoText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.photoButton, (!canTakeReading || statusCheckLoading) && styles.buttonDisabled]}
                    onPress={handleChoosePhoto}
                    disabled={!canTakeReading || statusCheckLoading}
                  >
                    <Text style={styles.photoButtonIcon}>📷</Text>
                    <Text style={styles.photoButtonText}>Prendre une photo</Text>
                  </TouchableOpacity>
                )}

                {/* Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => {
                    if (isBlocked || statusCheckLoading) return;
                    setIsInaccessible(!isInaccessible);
                    if (!isInaccessible) {
                      setCurrentIndex('');
                      setSelectedImage(null);
                    }
                  }}
                  disabled={isBlocked || statusCheckLoading}
                >
                  <View style={[styles.checkbox, isInaccessible && styles.checkboxChecked]}>
                    {isInaccessible && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Compteur non accessible</Text>
                </TouchableOpacity>

                {submitError && (
                  <Animated.View style={[styles.errorCard, { transform: [{ translateX: errorShakeAnim }] }]}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{submitError}</Text>
                  </Animated.View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.resetButton, (!canTakeReading || statusCheckLoading) && styles.buttonDisabled]}
                    onPress={handleReset}
                    disabled={!canTakeReading || statusCheckLoading}
                  >
                    <Text style={styles.resetButtonText}>Réinitialiser</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (isSubmitting || !statusValidated || isBlocked || statusCheckLoading) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !statusValidated || isBlocked || statusCheckLoading}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <View style={styles.submitButtonContent}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.submitButtonTextLoading}>Envoi...</Text>
                      </View>
                    ) : (
                      <View style={styles.submitButtonContent}>
                        <Text style={styles.submitButtonText}>Enregistrer</Text>
                        <Text style={styles.submitButtonIcon}>→</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Empty State */}
        {!clientInfo && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>Rechercher un client</Text>
            <Text style={styles.emptyStateText}>Entrez le code client pour commencer le relevé de compteur.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


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
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
    height: 48,
  },
  searchButton: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  clientCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 2,
  },
  clientId: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusTextPending: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeBlocked: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusTextBlocked: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusTextSuccess: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusTextWarning: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
    fontSize: 20,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  gpsInfo: {
    flex: 1,
  },
  gpsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  gpsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  inputCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 20,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
  },
  photoButtonIcon: {
    fontSize: 20,
  },
  photoButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreview: {
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  removePhotoButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removePhotoText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonTextLoading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    width: '100%',
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },
});

export default MeterReadingScreen;
