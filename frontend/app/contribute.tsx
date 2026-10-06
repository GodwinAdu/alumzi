import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, DollarSign, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function ContributePage() {
  const router = useRouter();
  const { fundraiserId, associationId, reference } = useLocalSearchParams();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastReference, setLastReference] = useState<string | null>(null);

  // Check if there's a payment reference to verify
  useEffect(() => {
    if (reference && typeof reference === 'string') {
      verifyPayment(reference);
    }
  }, [reference]);

  const verifyPayment = async (paymentReference: string) => {
    setVerifying(true);
    try {
      await api.verifyFundraiserPayment(paymentReference);
      Alert.alert(
        'Payment Successful! 🎉',
        'Your contribution has been processed successfully. Thank you for your support!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Payment verification error:', error);
      Alert.alert(
        'Verification Failed',
        'Unable to verify your payment. Please contact support if you were charged.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleContribute = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Use dedicated fundraiser payment endpoint
      const paymentData = {
        fundraiserId: fundraiserId as string,
        amount: parseFloat(amount)
      };

      const response = await api.initiateFundraiserPayment(paymentData);
      
      if (response.authorization_url) {
        // Open Paystack payment URL in browser
        const supported = await Linking.canOpenURL(response.authorization_url);
        if (supported) {
          await Linking.openURL(response.authorization_url);
          
          // Show success message and go back
          Alert.alert(
            'Payment Initiated',
            'You will be redirected to complete payment. Please return to the app after payment to verify your contribution.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Store reference for manual verification
                  setLastReference(response.reference);
                  router.back();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Cannot open payment URL');
        }
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process contribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: 'Contribute',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color="#667eea" size={20} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container}>
        {verifying ? (
          <View style={styles.verifyingContainer}>
            <CheckCircle color="#10b981" size={64} />
            <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
            <Text style={styles.verifyingSubtitle}>Please wait while we confirm your contribution</Text>
          </View>
        ) : (
          <View style={styles.content}>
          <View style={styles.header}>
            <Heart color="#ef4444" size={48} />
            <Text style={styles.title}>Make a Contribution</Text>
            <Text style={styles.subtitle}>Support this fundraising goal</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Contribution Amount</Text>
            <View style={styles.amountContainer}>
              <DollarSign color="#666" size={20} />
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={[styles.contributeButton, loading && styles.contributeButtonDisabled]}
              onPress={handleContribute}
              disabled={loading}
            >
              <Text style={styles.contributeButtonText}>
                {loading ? 'Processing...' : 'Contribute Now'}
              </Text>
            </TouchableOpacity>

            {lastReference && (
              <TouchableOpacity 
                style={[styles.verifyButton, verifying && styles.contributeButtonDisabled]}
                onPress={() => verifyPayment(lastReference)}
                disabled={verifying}
              >
                <Text style={styles.verifyButtonText}>
                  {verifying ? 'Verifying...' : 'Verify Last Payment'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    marginLeft: 8,
    color: '#1a1a1a',
  },
  contributeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  contributeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  contributeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  verifyingTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  verifyingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});