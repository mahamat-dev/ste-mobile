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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getClientBillingInfo } from '../services/mockDataService';

const ClientInputScreen = () => {
  const [searchId, setSearchId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchId.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un ID valide.');
      return;
    }

    setIsLoading(true);
    const trimmedId = searchId.trim().toUpperCase();

    try {
      // Check if it's an agent ID (starts with STEA)
      if (trimmedId.startsWith('STEA')) {
        // Navigate directly to agent login page
        router.push({
          pathname: '/agent-login',
          params: {
            agentId: trimmedId
          }
        });
        return;
      }

      // Check if it's a client ID
      const billingInfo = await getClientBillingInfo(trimmedId);
      
      if (billingInfo) {
        // Navigate to router page with options for client
        router.push({
          pathname: '/client-router',
          params: {
            clientId: trimmedId
          }
        });
      } else {
        // Show error modal for invalid client ID
        Alert.alert(
          'ID non trouvé',
          `L'ID "${trimmedId}" n'existe pas dans notre système. Veuillez vérifier et réessayer.`,
          [
            {
              text: 'Réessayer',
              style: 'default',
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
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Text style={styles.title}>STE</Text>
          </View>

          <Image
            source={require('../../assets/magnifier.png')}
            style={styles.searchImage}
          />
        </View>

        <View style={styles.bottomSection}>
          <TextInput
            style={styles.input}
            value={searchId}
            onChangeText={setSearchId}
            placeholder="Entrez votre ID (ex: STE001234 ou STEA001234)"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Rechercher</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  bottomSection: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 72,
    fontWeight: '800',
    fontFamily: 'Inter_800ExtraBold',
    color: '#1E40AF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
    width: '100%',
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  searchImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#0F172A',
    marginBottom: 20,
  },
  searchButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  searchButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },

});

export default ClientInputScreen;