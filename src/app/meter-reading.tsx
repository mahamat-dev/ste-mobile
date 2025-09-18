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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getClientBillingInfo, getClientMeterInfo } from '../services/mockDataService';
import * as ImagePicker from 'expo-image-picker';

interface ClientInfo {
  id: string;
  name: string;
  meterNumber: string;
  zoneCode: string;
  longitude: string;
  latitude: string;
  previousIndex: number;
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

  const handleSearch = async () => {
    if (!searchId.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un ID client valide.');
      return;
    }

    setIsSearching(true);
    const trimmedId = searchId.trim().toUpperCase();

    try {
      const meterInfo = await getClientMeterInfo(trimmedId);
      
      if (meterInfo) {
        // Extract client information from meter data
        setClientInfo({
          id: meterInfo.clientId,
          name: meterInfo.clientName,
          meterNumber: meterInfo.meterNumber,
          zoneCode: meterInfo.zoneCode,
          longitude: meterInfo.longitude,
          latitude: meterInfo.latitude,
          previousIndex: meterInfo.currentIndex,
        });
      } else {
        Alert.alert(
          'Client non trouvé',
          `L'ID "${trimmedId}" n'existe pas dans notre système. Veuillez vérifier et réessayer.`,
          [
            {
              text: 'Réessayer',
              onPress: () => setSearchId('')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la recherche. Veuillez réessayer.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleChoosePhoto = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin de l\'autorisation d\'accéder à votre galerie pour sélectionner des photos.'
      );
      return;
    }

    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: async () => {
            // Request camera permissions
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraPermission.status !== 'granted') {
              Alert.alert(
                'Permission requise',
                'Nous avons besoin de l\'autorisation d\'accéder à votre caméra pour prendre des photos.'
              );
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setSelectedImage(result.assets[0].uri);
              Alert.alert('Photo prise', 'Photo capturée avec succès');
            }
          }
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setSelectedImage(result.assets[0].uri);
              Alert.alert('Photo sélectionnée', 'Photo choisie depuis la galerie');
            }
          }
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const message = isInaccessible 
        ? 'Relevé enregistré avec indication d\'inaccessibilité.'
        : `Relevé enregistré avec succès.\nIndex: ${currentIndex}\nPhoto: ${selectedImage}`;
      
      Alert.alert(
        'Succès',
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setClientInfo(null);
              setSearchId('');
              setCurrentIndex('');
              setSelectedImage(null);
              setIsInaccessible(false);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le relevé. Veuillez réessayer.');
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
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relevé de Compteur</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Rechercher</Text>
          <Text style={styles.label}>ID Client</Text>
          <TextInput
            style={styles.input}
            value={searchId}
            onChangeText={setSearchId}
            placeholder="CL-1001"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={[styles.searchButton, isSearching && styles.buttonDisabled]} 
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchId('')}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Client Information */}
        {clientInfo && (
          <View style={styles.clientCard}>
            <Text style={styles.sectionTitle}>Informations Client</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>NOM COMPLET DU CLIENT</Text>
                <Text style={styles.infoValue}>{clientInfo.name}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ID CLIENT</Text>
                <Text style={styles.infoValue}>{clientInfo.id}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>NUMÉRO DE COMPTEUR</Text>
                <Text style={styles.infoValue}>{clientInfo.meterNumber}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>INDEX PRÉCÉDENT</Text>
                <Text style={styles.infoValue}>{clientInfo.previousIndex}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>CODE DE ZONE</Text>
                <Text style={styles.infoValue}>{clientInfo.zoneCode}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>LONGITUDE</Text>
                <Text style={styles.infoValue}>{clientInfo.longitude}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>LATITUDE</Text>
                <Text style={styles.infoValue}>{clientInfo.latitude}</Text>
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
                style={[styles.input, isInaccessible && styles.inputDisabled]}
                value={currentIndex}
                onChangeText={setCurrentIndex}
                placeholder=">> 1200"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={!isInaccessible}
              />
            </View>

            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.label}>Photos (capturer ou télécharger) *</Text>
              
              {selectedImage ? (
                <View style={styles.photoPreviewContainer}>
                  <View style={styles.photoPreview}>
                    <Image 
                      source={{ uri: 'https://via.placeholder.com/300x200/1E40AF/FFFFFF?text=Photo+Preview' }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.photoName}>{selectedImage}</Text>
                  </View>
                  
                  <View style={styles.photoActions}>
                    <TouchableOpacity 
                      style={styles.viewPhotoButton}
                      onPress={() => Alert.alert('Aperçu Photo', `Affichage de: ${selectedImage}`)}
                    >
                      <Text style={styles.viewPhotoButtonText}>👁 Voir</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => {
                        Alert.alert(
                          'Supprimer Photo',
                          'Êtes-vous sûr de vouloir supprimer cette photo?',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { 
                              text: 'Supprimer', 
                              style: 'destructive',
                              onPress: () => setSelectedImage(null)
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.removePhotoButtonText}>🗑 Supprimer</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.changePhotoButton}
                      onPress={handleChoosePhoto}
                    >
                      <Text style={styles.changePhotoButtonText}>📷 Changer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <TouchableOpacity 
                    style={[styles.photoButton, isInaccessible && styles.buttonDisabled]} 
                    onPress={handleChoosePhoto}
                    disabled={isInaccessible}
                  >
                    <Text style={styles.photoButtonText}>Choose Files</Text>
                  </TouchableOpacity>
                  <Text style={styles.photoHint}>No file chosen</Text>
                </View>
              )}
            </View>

            {/* Access Indicator */}
            <View style={styles.accessSection}>
              <Text style={styles.label}>Indicateurs d'Accès</Text>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => {
                  setIsInaccessible(!isInaccessible);
                  if (!isInaccessible) {
                    setCurrentIndex('');
                    setSelectedImage(null);
                  }
                }}
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
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
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
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
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
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  searchButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 12,
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
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  indexSection: {
    marginBottom: 24,
  },
  photoSection: {
    marginBottom: 24,
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
    backgroundColor: '#6B7280',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 12,
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
});

export default MeterReadingScreen;