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
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

      try {
        const response = await customerApi.searchByCode(trimmedId, trimmedPhone || undefined);
        if (response.success && response.data) {
          customerData = response.data;
        }
      } catch (apiError) {
        console.log('API search failed, falling back to mock data', apiError);
        const profile = await getClientProfile(trimmedId);
        if (profile) {
          if (trimmedPhone && profile.phoneNumber && !profile.phoneNumber.includes(trimmedPhone)) {
            customerData = null;
          } else {
            customerData = profile;
          }
        }
      }

      if (customerData) {
        await AsyncStorage.setItem('customer_data', JSON.stringify(customerData));
        router.push({
          pathname: '/client-router',
          params: { clientId: trimmedId },
        });
      } else {
        Alert.alert(
          'Client non trouvé',
          `Le client avec le code "${trimmedId}" ${trimmedPhone ? 'et ce numéro de téléphone ' : ''}n'a pas été trouvé.`,
          [{ text: 'Réessayer' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Branding */}
          <View style={styles.brandingSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>💧</Text>
            </View>
            <Text style={styles.brandName}>STE</Text>
            <Text style={styles.brandTagline}>Société Tchadienne des Eaux</Text>
          </View>

          {/* Welcome */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Bienvenue</Text>
            <Text style={styles.welcomeSubtitle}>Choisissez votre espace pour continuer</Text>
          </View>

          {/* Agent Card */}
          <TouchableOpacity 
            style={styles.agentCard} 
            onPress={handleAgentLogin} 
            activeOpacity={0.9}
          >
            <View style={styles.agentCardContent}>
              <View style={styles.agentIconContainer}>
                <Text style={styles.agentIcon}>👤</Text>
              </View>
              <View style={styles.agentTextContainer}>
                <Text style={styles.agentTitle}>Espace Agent</Text>
                <Text style={styles.agentDescription}>Accéder au tableau de bord</Text>
              </View>
              <View style={styles.agentArrowContainer}>
                <Text style={styles.agentArrow}>→</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerBadge}>
              <Text style={styles.dividerText}>ou</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>

          {/* Client Card */}
          <View style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <View style={styles.clientIconContainer}>
                <Text style={styles.clientIcon}>📊</Text>
              </View>
              <View style={styles.clientTextContainer}>
                <Text style={styles.clientTitle}>Espace Client</Text>
                <Text style={styles.clientDescription}>Consulter vos factures</Text>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Code Client</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={searchId}
                  onChangeText={setSearchId}
                  placeholder="CUST-001"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Téléphone (optionnel)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="66 00 00 00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleCustomerSearch}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Consulter</Text>
                  <Text style={styles.submitButtonArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2024 STE - Tous droits réservés</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 4,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  agentCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  agentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  agentIcon: {
    fontSize: 22,
  },
  agentTextContainer: {
    flex: 1,
  },
  agentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  agentDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  agentArrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  dividerText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  clientCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  clientIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  clientIcon: {
    fontSize: 22,
  },
  clientTextContainer: {
    flex: 1,
  },
  clientTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  clientDescription: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  submitButtonArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default ClientInputScreen;
