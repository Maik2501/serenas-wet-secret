import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Coffee, Heart, Sparkles } from 'lucide-react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useMutation, useQuery } from '@tanstack/react-query';

const REVENUECAT_API_KEY_IOS = 'appl_TBgeqejwJvJprMxtGMQcPmXdjxp';
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key'; // TODO: Add Android key when ready
const PRODUCT_ID = 'tip_199';

export default function DonationCard() {
  const [isConfigured, setIsConfigured] = useState(false);

  const { data: offerings, isLoading: loadingOfferings } = useQuery({
    queryKey: ['offerings'],
    queryFn: async () => {
      try {
        if (Platform.OS === 'web') {
          return null;
        }

        const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

        if (apiKey.includes('your_')) {
          // RevenueCat not configured - skip initialization
          return null;
        }

        await Purchases.configure({ apiKey });
        setIsConfigured(true);

        const offerings = await Purchases.getOfferings();
        return offerings.current;
      } catch {
        // RevenueCat not available on this platform
        return null;
      }
    },
    retry: false,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    },
    onSuccess: () => {
      Alert.alert(
        '💜 Thank You!',
        'Your support means the world! Every contribution helps keep this app running and improving.',
        [{ text: 'You\'re welcome!' }]
      );
    },
    onError: (error: Error) => {
      if (!error.message.includes('cancelled')) {
        Alert.alert('Oops', 'Something went wrong. Please try again.');
      }
    },
  });

  const handleDonate = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile Only',
        'In-app donations are available on the mobile app. Thank you for your support!'
      );
      return;
    }

    if (!isConfigured || !offerings) {
      Alert.alert(
        'Coming Soon',
        'Donations will be available once the app is published to the App Store. Thank you for your support!'
      );
      return;
    }

    const tipPackage = offerings.availablePackages.find(
      pkg => pkg.product.identifier === PRODUCT_ID
    ) || offerings.availablePackages[0];

    if (tipPackage) {
      purchaseMutation.mutate(tipPackage);
    }
  };

  const isLoading = loadingOfferings || purchaseMutation.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.decorativeTop}>
        <Sparkles color="#F59E0B" size={16} />
        <Sparkles color="#F59E0B" size={12} style={styles.sparkleOffset} />
      </View>

      <View style={styles.iconContainer}>
        <Coffee color="#92400E" size={28} />
      </View>

      <Text style={styles.title}>Support the Developer</Text>
      <Text style={styles.subtitle}>
        Enjoying the app? A small tip helps keep it ad-free and growing!
      </Text>

      <TouchableOpacity
        style={[styles.donateButton, isLoading && styles.donateButtonDisabled]}
        onPress={handleDonate}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Heart color="#fff" size={18} fill="#fff" />
            <Text style={styles.donateButtonText}>Buy me a coffee · $1.99</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.footnote}>
        One-time purchase · No subscription
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeTop: {
    position: 'absolute',
    top: 16,
    right: 20,
    flexDirection: 'row',
  },
  sparkleOffset: {
    marginTop: 8,
    marginLeft: -4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#92400E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#78350F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  donateButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 220,
  },
  donateButtonDisabled: {
    opacity: 0.7,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  footnote: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 12,
    fontWeight: '500' as const,
  },
});
