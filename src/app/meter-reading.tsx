import React, { useState } from 'react';
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

  const isSameBillingMonth = (dateStr: string): boolean => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } catch {
      return false;
    }
  };

  // Derived capability: only allow taking a reading when status validated, not blocked, and access is possible
  const canTakeReading = statusValidated && !isBlocked && !isInaccessible;

  const handleSearch = async () => {
    const trimmedId = searchId.trim();
    if (!trimmedId) {
      Alert.alert('Erreur', 'Veuillez entrer un identifiant client ou un numéro de compteur.');
      return;
    }

    setIsSearching(true);

    try {
      // If numeric, search by customerId; otherwise, try meter number
      const isNumeric = /^\d+$/.test(trimmedId);
      const response = isNumeric
        ? await meterApi.getByCustomerId(trimmedId)
        : await meterApi.getByMeterNumber(trimmedId);

      if (response.success && response.data) {
        const data = response.data as {
          meter: any;
          customer: any;
          lastReading: { readingValue?: number } | null;
        };
        const { meter, customer, lastReading } = data;

        if (!customer || !meter) {
          throw new Error("Client ou compteur introuvable.");
        }

        // Extract client information from API response
        const info = {
          customerId: customer.customerId,
          meterId: meter.meterId,
          name: `${customer.firstName} ${customer.lastName}`,
          meterNumber: meter.meterNumber,
          // Backend Address.withRef exposes area.name, district.name, city.cityName
          zoneCode: customer.address?.area?.name || customer.address?.district?.name || 'N/A',
          longitude: customer.address?.longitude || '0.0',
          latitude: customer.address?.latitude || '0.0',
          previousIndex:
            (typeof lastReading?.readingValue === 'number'
              ? lastReading.readingValue
              : Number(lastReading?.readingValue)) || Number(meter.installationIndex) || 0,
          address: customer.address ? `${customer.address.streetName || ''} ${customer.address.streetNumber || ''}, ${customer.address.city?.cityName || ''}` : 'N/A',
        } as ClientInfo;
        setClientInfo(info);
        // Prefill current index input with the latest known index (leave blank if 0)
        if (info.previousIndex && Number(info.previousIndex) > 0) {
          setCurrentIndex(String(info.previousIndex));
        } else {
          setCurrentIndex('');
        }

        // Load latest reading status for blocking logic with billing cycle validation
        setStatusCheckLoading(true);
        try {
          const readings = await meterApi.getReadings(info.meterId);
          const items = Array.isArray(readings?.data) ? readings.data : [];
          if (items.length === 0) {
            setLatestStatus(null);
            setIsBlocked(false);
            setBlockedReason(null);
            setStatusValidated(true);
          } else {
            const latest = [...items]
              .sort((a: any, b: any) => {
                const bx = new Date(b?.updatedAt || b?.readingDate || 0).getTime();
                const ax = new Date(a?.updatedAt || a?.readingDate || 0).getTime();
                return bx - ax;
              })[0];
            const statusRaw = String(latest?.status || '').toLowerCase();
            setLatestStatus(latest?.status || null);

            if (statusRaw === 'pending') {
              setIsBlocked(true);
              setBlockedReason('Relevé en attente d\'approbation');
              setStatusValidated(true);
            } else if (statusRaw === 'approved') {
              const sameMonth = isSameBillingMonth(String(latest?.readingDate || ''));
              if (sameMonth) {
                setIsBlocked(true);
                setBlockedReason('Relevé déjà approuvé pour ce cycle de facturation');
                setStatusValidated(true);
              } else {
                setIsBlocked(false);
                setBlockedReason(null);
                setStatusValidated(true);
              }
            } else if (statusRaw === 'rejected' || statusRaw === 're_submitted' || statusRaw === 're_submited') {
              setIsBlocked(false);
              setBlockedReason(null);
              setStatusValidated(true);
            } else {
              // Unknown status: default to enabling
              setIsBlocked(false);
              setBlockedReason(null);
              setStatusValidated(true);
            }
          }
        } catch (e) {
          // If status cannot be loaded, do not block, but show neutral state
          setLatestStatus(null);
          setIsBlocked(false);
          setBlockedReason(null);
          setStatusValidated(false);
        } finally {
          setStatusCheckLoading(false);
        }
      } else {
        Alert.alert(
          'Client non trouvé',
          `L'identifiant "${trimmedId}" n'existe pas. Veuillez vérifier et réessayer.`,
          [
            {
              text: 'Réessayer',
              onPress: () => setSearchId('')
            }
          ]
        );
      }
    } catch (error: any) {
      console.warn('Search warning:', error?.message || error);
      Alert.alert(
        'Erreur',
        error?.message?.includes('401') || error?.message?.toLowerCase().includes('unauthorized')
          ? 'Accès non autorisé. Veuillez vous connecter pour rechercher un client.'
          : (error.message || 'Une erreur est survenue lors de la recherche du client. Veuillez réessayer.')
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleChoosePhoto = async () => {
    // On web, camera is not supported; open library directly
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

    // Native: prefer camera, but gracefully fallback if unavailable (e.g., simulator)
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
      } catch (e) {
        // Swallow camera not available errors on simulator and fallback to library
      }
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
      Alert.alert('Erreur', 'Veuillez entrer l\'index actuel ou cocher "Porte fermée ou Compteur non accessible".');
      return;
    }

    if (!isInaccessible && !selectedImage) {
      Alert.alert('Erreur', 'Veuillez ajouter une photo du compteur.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize index (support comma decimals) and validate
      const normalizedIndex = currentIndex.replace(/,/g, '.').trim();
      const parsedIndex = Number(normalizedIndex);
      if (!isInaccessible && (Number.isNaN(parsedIndex))) {
        throw new Error('Index invalide. Veuillez saisir un nombre.');
      }

      const payload = {
        meterId: clientInfo.meterId,
        currentIndex: isInaccessible ? undefined : parsedIndex,
        previousIndex: clientInfo.previousIndex,
        isInaccessible,
        imageUri: selectedImage || undefined,
        longitude: clientInfo.longitude,
        latitude: clientInfo.latitude,
      };

      const response = await meterApi.submitReading(payload);
      setSubmitError(null);

      // Refresh latest reading for this client to always display the newest index
      const refreshed = await meterApi.getByCustomerId(clientInfo.customerId);
      if (refreshed.success && refreshed.data) {
        const { meter, customer, lastReading } = refreshed.data as any;
        const info: ClientInfo = {
          customerId: customer.customerId,
          meterId: meter?.meterId || clientInfo.meterId,
          name: `${customer.firstName} ${customer.lastName}`,
          meterNumber: meter?.meterNumber || clientInfo.meterNumber,
          zoneCode: customer.address?.area?.name || customer.address?.district?.name || 'N/A',
          longitude: customer.address?.longitude || clientInfo.longitude,
          latitude: customer.address?.latitude || clientInfo.latitude,
          previousIndex:
            (typeof lastReading?.readingValue === 'number'
              ? lastReading.readingValue
              : Number(lastReading?.readingValue)) || Number(meter?.installationIndex) || clientInfo.previousIndex || 0,
          address: customer.address ? `${customer.address.streetName || ''} ${customer.address.streetNumber || ''}, ${customer.address.city?.cityName || ''}` : 'N/A',
        };
        setClientInfo(info);
        // Clear inputs but keep client info visible
        setCurrentIndex('');
        setSelectedImage(null);
        setIsInaccessible(false);
      }
    } catch (error: any) {
      setSubmitError(error?.message || 'Impossible d\'enregistrer le relevé. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex('');
    setSelectedImage(null);
    setIsInaccessible(false);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {isSubmitting && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loaderText}>Envoi en cours…</Text>
        </View>
      )}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header - now scrolls with content */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Relevé de Compteur</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Rechercher Client</Text>
          <Text style={styles.label}>ID Client ou Numéro de Compteur</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>🔎</Text>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              value={searchId}
              onChangeText={setSearchId}
              placeholder="Ex: 101 ou MTR-001"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchId.length > 0 && (
              <TouchableOpacity style={styles.inputClear} onPress={() => setSearchId('')} accessibilityLabel="Effacer la saisie">
                <Text style={styles.inputClearText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.inputHint}>Saisir un ID numérique ou un numéro de compteur alphanumérique</Text>
          <TouchableOpacity 
            style={[styles.searchButton, styles.buttonShadow, isSearching && styles.buttonDisabled]} 
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.searchButtonText}>Rechercher</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Client Information */}
        {clientInfo && (
          <View style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>{clientInfo.name.charAt(0)}</Text>
              </View>
              <View style={styles.clientHeaderInfo}>
                <Text style={styles.clientName}>{clientInfo.name}</Text>
                <Text style={styles.clientId}>ID: {clientInfo.customerId}</Text>
                <View style={styles.chipRow}>
                  <View style={styles.chip}><Text style={styles.chipText}>Zone: {clientInfo.zoneCode}</Text></View>
                  <View style={styles.chip}><Text style={styles.chipText}>Compteur: {clientInfo.meterNumber}</Text></View>
                  {latestStatus && (
                    <View style={styles.chip}><Text style={styles.chipText}>Statut: {latestStatus}</Text></View>
                  )}
                </View>
              </View>
            </View>

            {statusCheckLoading ? (
              <View style={styles.loadingNotice}>
                <Text style={styles.loadingNoticeText}>Vérification du statut…</Text>
              </View>
            ) : isBlocked ? (
              <View style={styles.blockedNotice}>
                <Text style={styles.blockedNoticeText}>{blockedReason || 'Actions désactivées'}</Text>
              </View>
            ) : null}

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>📊</Text>
                  </View>
                  <Text style={styles.infoCardLabel}>Compteur</Text>
                  <Text style={styles.infoCardValue}>{clientInfo.meterNumber}</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>📈</Text>
                  </View>
                  <Text style={styles.infoCardLabel}>Index Préc.</Text>
                  <Text style={styles.infoCardValue}>{clientInfo.previousIndex}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>📍</Text>
                  </View>
                  <Text style={styles.infoCardLabel}>Zone</Text>
                  <Text style={styles.infoCardValue}>{clientInfo.zoneCode}</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIcon}>🌍</Text>
                  </View>
                  <Text style={styles.infoCardLabel}>GPS</Text>
                  <Text style={styles.infoCardValue}>{clientInfo.latitude.substring(0, 6)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Meter Reading Section */}
        {clientInfo && (
          <View style={styles.readingCard}>
            <Text style={styles.sectionTitle}>Saisies Agent</Text>
            
            <View style={styles.indexSection}>
              <Text style={styles.label}>Index Actuel</Text>
              <TextInput
                style={[styles.input, (!canTakeReading || statusCheckLoading) && styles.inputDisabled]}
                value={currentIndex}
                onChangeText={setCurrentIndex}
                placeholder=">> 1200"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={canTakeReading && !statusCheckLoading}
              />
            </View>

            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.label}>Photos (capturer ou télécharger) *</Text>
              
              {selectedImage ? (
                <View style={styles.thumbnailWrapper}>
                  <TouchableOpacity onPress={!canTakeReading || statusCheckLoading ? undefined : handleChoosePhoto} activeOpacity={0.85} disabled={!canTakeReading || statusCheckLoading}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel="Remove photo"
                    style={[styles.thumbnailClose, ((!canTakeReading) || statusCheckLoading) && styles.buttonDisabled]}
                    onPress={() => {
                      if (!canTakeReading || statusCheckLoading) return;
                      setSelectedImage(null);
                      // Immediately prompt to pick another photo after removing
                      setTimeout(() => handleChoosePhoto(), 100);
                    }}
                    disabled={!canTakeReading || statusCheckLoading}
                  >
                    <Text style={styles.thumbnailCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TouchableOpacity 
                      style={[styles.photoButton, styles.buttonShadow, ((!canTakeReading) || statusCheckLoading) && styles.buttonDisabled]} 
                    onPress={handleChoosePhoto}
                    disabled={!canTakeReading || statusCheckLoading}
                  >
                      <Text style={styles.photoButtonText}>Choisir une photo</Text>
                  </TouchableOpacity>
                    <Text style={styles.photoHint}>Aucune photo sélectionnée</Text>
                </View>
              )}
            </View>

            {/* Access Indicator */}
            <View style={styles.accessSection}>
              <Text style={styles.label}>Indicateurs d'Accès</Text>
              <TouchableOpacity 
                style={[styles.checkboxContainer, (isBlocked || statusCheckLoading) && { opacity: 0.6 }]} 
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
                <Text style={styles.checkboxLabel}>
                  Porte fermée ou Compteur non accessible
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            {submitError && (
              <Text style={styles.errorText}>{submitError}</Text>
            )}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.resetButton, styles.buttonShadow, ((!canTakeReading) || statusCheckLoading) && styles.buttonDisabled]} onPress={!canTakeReading || statusCheckLoading ? undefined : handleReset} disabled={!canTakeReading || statusCheckLoading}>
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, styles.buttonShadow, (isSubmitting || !statusValidated || isBlocked || statusCheckLoading) && styles.buttonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting || !statusValidated || isBlocked || statusCheckLoading}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.submitButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  inputRow: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    fontSize: 18,
    color: '#6B7280',
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 40,
  },
  inputClear: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputClearText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clientHeaderInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  clientId: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  blockedNotice: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  blockedNoticeText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  successNotice: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  successNoticeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingNotice: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  loadingNoticeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  indexSection: {
    marginBottom: 24,
  },
  photoSection: {
    marginBottom: 24,
  },
  thumbnailWrapper: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    alignSelf: 'flex-start',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  thumbnailCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 16,
  },
  photoPreviewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  photoPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  viewPhotoButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  viewPhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removePhotoButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  removePhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  changePhotoButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  changePhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  photoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  accessSection: {
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 32,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MeterReadingScreen;