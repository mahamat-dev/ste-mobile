import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

type ComplaintType = 'billing' | 'service' | 'quality' | 'other';

interface ComplaintOption {
  id: ComplaintType;
  title: string;
  icon: string;
}

const ComplaintFormScreen = () => {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const complaintTypes: ComplaintOption[] = [
    { id: 'billing', title: 'Problème de Facturation', icon: '💳' },
    { id: 'service', title: 'Interruption de Service', icon: '🚰' },
    { id: 'quality', title: 'Qualité de l\'Eau', icon: '💧' },
    { id: 'other', title: 'Autre', icon: '📝' },
  ];

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de réclamation.');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un objet pour votre réclamation.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire votre réclamation.');
      return;
    }

    if (!contactPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone de contact.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Réclamation Envoyée',
        'Votre réclamation a été enregistrée avec succès. Nous vous contacterons dans les plus brefs délais.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'envoi de votre réclamation. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backArrow} onPress={handleBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réclamation</Text>
        <View style={styles.placeholder} />
      </View>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.spacer} />
          <View style={styles.header}>
            <Text style={styles.subtitle}>Client ID: {clientId}</Text>
            <Text style={styles.description}>
              Décrivez votre problème et nous vous contacterons rapidement
            </Text>
          </View>

          {/* Complaint Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de Réclamation</Text>
            <View style={styles.typeGrid}>
              {complaintTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardSelected
                  ]}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeTitle,
                    selectedType === type.id && styles.typeTitleSelected
                  ]}>
                    {type.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Objet de la Réclamation</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Résumez brièvement votre problème"
              placeholderTextColor="#9CA3AF"
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Description Détaillée</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre problème en détail..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Contact Phone Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Numéro de Téléphone</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+235 XX XX XX XX"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer la Réclamation'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 44,
  },
  backArrow: {
    paddingLeft: 10,
  },
  backArrowText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#3B82F6',
    fontWeight: 'bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  spacer: {
    height: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  typeCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  typeTitleSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ComplaintFormScreen;