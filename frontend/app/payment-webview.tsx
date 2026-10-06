import React, { useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function PaymentWebView() {
  const { url, reference, returnPath, paymentType } = useLocalSearchParams<{
    url: string;
    reference: string;
    returnPath: string;
    paymentType?: string;
  }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = async (navState: any) => {
    const { url: currentUrl } = navState;
    
    // Check if payment was successful or cancelled
    if (currentUrl.includes('callback') || currentUrl.includes('success')) {
      try {
        // Verify payment with appropriate endpoint based on payment type
        if (paymentType === 'dues_payment') {
          await api.verifyDuesPayment(reference);
        } else {
          await api.confirmUpgrade(reference);
        }
        
        const successMessage = paymentType === 'dues_payment' ? 'Dues payment completed successfully!' : 'Payment completed successfully!';
        const defaultReturnPath = paymentType === 'dues_payment' ? '/member-dues' : '/subscription-settings';
        
        Alert.alert('Success', successMessage, [
          {
            text: 'OK',
            onPress: () => router.replace((returnPath || defaultReturnPath) as any)
          }
        ]);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Payment verification failed', [
          {
            text: 'OK',
            onPress: () => router.replace((returnPath || '/subscription-settings') as any)
          }
        ]);
      }
    } else if (currentUrl.includes('cancel') || currentUrl.includes('failed')) {
      Alert.alert('Payment Cancelled', 'Your payment was not completed.', [
        {
          text: 'OK',
          onPress: () => router.replace((returnPath || '/subscription-settings') as any)
        }
      ]);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Complete Payment',
        headerBackTitle: 'Cancel'
      }} />
      <SafeAreaView style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});