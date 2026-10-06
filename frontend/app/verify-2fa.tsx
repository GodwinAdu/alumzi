import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Verify2FAPage() {
  const router = useRouter();
  const { tempToken } = useLocalSearchParams();
  const { complete2FALogin } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerification = async () => {
    if (!verificationCode || (!useBackupCode && verificationCode.length !== 6)) {
      Alert.alert('Error', useBackupCode ? 'Please enter a backup code' : 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.complete2FALogin(tempToken as string, verificationCode);
      
      // Complete 2FA login and update auth state
      await complete2FALogin(response.token, response.user);
      
      if (response.warning) {
        Alert.alert(
          'Backup Code Used',
          `${response.warning}. You have ${response.remainingBackupCodes} backup codes remaining.`,
          [{ text: 'OK', onPress: () => router.replace('/(auth-tabs)/home') }]
        );
      } else {
        router.replace('/(auth-tabs)/home');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#667eea" size={20} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield color="#667eea" size={48} />
        </View>
        
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          {useBackupCode 
            ? 'Enter one of your backup codes to continue'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </Text>

        <TextInput
          style={styles.codeInput}
          placeholder={useBackupCode ? 'Backup Code' : '000000'}
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType={useBackupCode ? 'default' : 'numeric'}
          maxLength={useBackupCode ? 8 : 6}
          textAlign="center"
          autoCapitalize={useBackupCode ? 'characters' : 'none'}
        />

        <TouchableOpacity 
          style={[styles.verifyButton, (isLoading || !verificationCode) && styles.buttonDisabled]}
          onPress={handleVerification}
          disabled={isLoading || !verificationCode}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backupCodeButton}
          onPress={() => {
            setUseBackupCode(!useBackupCode);
            setVerificationCode('');
          }}
        >
          <Text style={styles.backupCodeButtonText}>
            {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
          </Text>
        </TouchableOpacity>

        <View style={styles.helpText}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <Text style={styles.helpDescription}>
            If you've lost access to your authenticator app, you can use one of your backup codes. 
            Each backup code can only be used once.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontFamily: 'monospace',
    letterSpacing: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    maxWidth: 280,
  },
  verifyButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
    marginBottom: 16,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  backupCodeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  backupCodeButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  helpText: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});