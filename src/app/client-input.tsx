import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getClientProfile } from '../services/mockDataService';
import { customerApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ClientInputScreen = () => {
  const [searchId, setSearchId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAgentLogin = () => {
    router.push('/agent-login');
  };

  const handleCustomerSearch = async () => {
    if (!searchId.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre code client.');
      return;
    }

    setIsLoading(true);
    const trimmedId = searchId.trim();
    const trimmedPhone = phoneNumber.trim();

    try {
      let customerData = null;

      // Try real API first
      try {
        const response = await customerApi.searchByCode(trimmedId, trimmedPhone || undefined);
        if (response.success && response.data) {
          customerData = response.data;
        }
      } catch (apiError) {
        console.log('API search failed, falling back to mock data', apiError);
        // Fallback to mock data
        const profile = await getClientProfile(trimmedId);
        if (profile) {
           // Check phone number match if provided in mock
           if (trimmedPhone && profile.phoneNumber && !profile.phoneNumber.includes(trimmedPhone)) {
               // Phone mismatch in mock
               customerData = null;
           } else {
               customerData = profile;
           }
        }
      }
      
      if (customerData) {
        // Store customer data for session
        await AsyncStorage.setItem('customer_data', JSON.stringify(customerData));
        
        router.push({
          pathname: '/client-router',
          params: {
            clientId: trimmedId
          }
        });
      } else {
        Alert.alert(
          'Client non trouvé',
          `Le client avec le code "${trimmedId}" ${trimmedPhone ? 'et ce numéro de téléphone ' : ''}n'a pas été trouvé. Veuillez vérifier et réessayer.`,
          [
            {
              text: 'Réessayer',
              onPress: () => {}
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>STE</Text>
          <Text style={styles.subtitle}>Société Tchadienne des Eaux</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bienvenue</Text>
          <Text style={styles.welcomeText}>Choisissez votre espace</Text>
        </View>

        {/* Agent Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Espace Agent</Text>
              <Text style={styles.sectionDescription}>Accédez à votre tableau de bord</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAgentLogin}>
            <Text style={styles.primaryButtonText}>Se connecter</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.iconText}>💧</Text>
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Espace Client</Text>
              <Text style={styles.sectionDescription}>Consultez vos factures</Text>
            </View>
          </View>
          <TextInput
            style={styles.input}
            value={searchId}
            onChangeText={setSearchId}
            placeholder="Code Client (ex: CUST-001)"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Numéro de téléphone (Optionnel)"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleCustomerSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#3B82F6" size="small" />
            ) : (
              <>
                <Text style={styles.secondaryButtonText}>Consulter</Text>
                  <Text style={[styles.buttonArrow, { color: '#3B82F6' }]}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});

export default ClientInputScreen;