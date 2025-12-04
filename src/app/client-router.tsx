import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: screenHeight } = Dimensions.get('window');
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getClientBillingInfo, Client } from '../services/mockDataService';

const ClientRouterScreen = () => {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const [clientProfile, setClientProfile] = useState<Client | null>(null);

  // Page entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Button press animations
  const scalePay = useRef(new Animated.Value(1)).current;
  const scaleComplain = useRef(new Animated.Value(1)).current;
  const shadowPay = useRef(new Animated.Value(1)).current; // 1: normal, 0: pressed
  const shadowComplain = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Dedicated handlers to sync scale + shadow animations
  const onPressInPay = () => {
    Animated.parallel([
      Animated.spring(scalePay, {
        toValue: 0.97,
        speed: 20,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(shadowPay, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  };
  const onPressOutPay = () => {
    Animated.parallel([
      Animated.spring(scalePay, {
        toValue: 1,
        speed: 20,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(shadowPay, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const onPressInComplain = () => {
    Animated.parallel([
      Animated.spring(scaleComplain, {
        toValue: 0.97,
        speed: 20,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(shadowComplain, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  };
  const onPressOutComplain = () => {
    Animated.parallel([
      Animated.spring(scaleComplain, {
        toValue: 1,
        speed: 20,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(shadowComplain, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  useEffect(() => {
    const loadClientData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('customer_data');
        if (storedData) {
          const profile = JSON.parse(storedData);
          setClientProfile(profile);
        } else {
           // Fallback to params if storage empty (shouldn't happen if flow is correct)
           // Or fetch using clientId param if available
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      }
    };
    
    loadClientData();
    animateIn();
  }, [clientId]);

  const handleCheckPaymentStatus = async () => {
    try {
      const idToUse = clientProfile?.clientId || (clientId as string);
      const billingInfo = await getClientBillingInfo(idToUse);
      if (billingInfo) {
        router.push({
          pathname: '/billing-info',
          params: {
            clientData: JSON.stringify(billingInfo)
          }
        });
      }
    } catch (error) {
      console.error('Error fetching billing info:', error);
    }
  };

  const handleComplain = () => {
    router.push({
      pathname: '/complaint-form',
      params: {
        clientId: clientProfile?.clientId || (clientId as string)
      }
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backArrow} onPress={handleBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <View style={styles.clientChip}>
          <Text style={styles.clientChipText}>
            {clientProfile ? `${clientProfile.name.split(' ')[0]}, ${clientId}` : clientId}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY }] }]}> 
        <View style={styles.topSection}>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.touchableCard}
            onPress={handleCheckPaymentStatus}
            activeOpacity={0.85}
            onPressIn={onPressInPay}
            onPressOut={onPressOutPay}
          >
            <Animated.View
              style={[
                styles.serviceButtonGreen,
                {
                  shadowOpacity: shadowPay.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.12] }),
                  shadowRadius: shadowPay.interpolate({ inputRange: [0, 1], outputRange: [6, 10] }),
                  elevation: shadowPay.interpolate({ inputRange: [0, 1], outputRange: [2, 5] }),
                  transform: [
                    { translateY: shadowPay.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
                  ],
                },
              ]}
            >
              <Animated.View style={[styles.buttonContent, { transform: [{ scale: scalePay }] }]}> 
                <Animated.Image 
                  source={require('../../assets/status.png')} 
                  style={[styles.buttonImage, { transform: [{ scale: scalePay.interpolate({ inputRange: [0.97, 1], outputRange: [0.96, 1] }) }] }]}
                />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Vérifier le Statut de Paiement</Text>
                  <Text style={styles.buttonDescription}>Consultez vos factures et paiements</Text>
                </View>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.touchableCard}
            onPress={handleComplain}
            activeOpacity={0.85}
            onPressIn={onPressInComplain}
            onPressOut={onPressOutComplain}
          >
            <Animated.View
              style={[
                styles.serviceButtonYellow,
                {
                  shadowOpacity: shadowComplain.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.12] }),
                  shadowRadius: shadowComplain.interpolate({ inputRange: [0, 1], outputRange: [6, 10] }),
                  elevation: shadowComplain.interpolate({ inputRange: [0, 1], outputRange: [2, 5] }),
                  transform: [
                    { translateY: shadowComplain.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
                  ],
                },
              ]}
            >
              <Animated.View style={[styles.buttonContent, { transform: [{ scale: scaleComplain }] }]}> 
                <Animated.Image 
                  source={require('../../assets/complain.png')} 
                  style={[styles.buttonImage, { transform: [{ scale: scaleComplain.interpolate({ inputRange: [0.97, 1], outputRange: [0.96, 1] }) }] }]}
                />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Déposer une Complainte</Text>
                  <Text style={styles.buttonDescription}>Exprimez vos préoccupations et doléances</Text>
                </View>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  touchableCard: {
    borderRadius: 16,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  bottomSection: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  
  placeholder: {
    width: 44,
  },
  header: {
    alignItems: 'center',
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

  
  clientChip: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  clientChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  serviceButtonYellow: {
    backgroundColor: '#FEF3C7', // brighter amber-100
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 25,
    marginBottom: 20,
    height: screenHeight * 0.20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  serviceButtonGreen: {
    backgroundColor: '#DCFCE7', // brighter green-100
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 25,
    marginBottom: 20,
    height: screenHeight * 0.20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  buttonImage: {
    width: 80,
    height: 80,
    marginRight: 20,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 24,
  },

});

export default ClientRouterScreen;
