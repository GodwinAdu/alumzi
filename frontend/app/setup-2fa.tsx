import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Shield, Copy, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';

export default function Setup2FAPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateSetup();
  }, []);

  const generateSetup = async () => {
    try {
      setIsLoading(true);
      const response = await api.generate2FASetup();
      setQrCode(response.qrCode);
      setSecret(response.secret);
      setManualKey(response.manualEntryKey);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Manual entry key copied to clipboard');
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.enable2FA(secret, verificationCode);
      setBackupCodes(response.backupCodes);
      setStep('complete');
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    const codesText = backupCodes.join('\n');
    await Clipboard.setStringAsync(codesText);
    Alert.alert('Copied', 'Backup codes copied to clipboard');
  };

  const finishSetup = () => {
    Alert.alert(
      'Setup Complete',
      'Two-factor authentication has been enabled successfully!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
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
        <Text style={styles.title}>Setup Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>Secure your account with 2FA</Text>
      </View>

      <ScrollView style={styles.content}>
        {step === 'setup' && (
          <View style={styles.step}>
            <View style={styles.stepHeader}>
              <Shield color="#667eea" size={24} />
              <Text style={styles.stepTitle}>Step 1: Scan QR Code</Text>
            </View>
            
            <Text style={styles.instruction}>
              Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code:
            </Text>

            {qrCode ? (
              <View style={styles.qrContainer}>
                <Image source={{ uri: qrCode }} style={styles.qrCode} />
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Generating QR code...</Text>
              </View>
            )}

            <View style={styles.manualEntry}>
              <Text style={styles.manualTitle}>Can't scan? Enter manually:</Text>
              <View style={styles.keyContainer}>
                <Text style={styles.keyText}>{manualKey}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(manualKey)}
                >
                  <Copy color="#667eea" size={16} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.nextButton, !qrCode && styles.buttonDisabled]}
              onPress={() => setStep('verify')}
              disabled={!qrCode}
            >
              <Text style={styles.nextButtonText}>Next Step</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'verify' && (
          <View style={styles.step}>
            <View style={styles.stepHeader}>
              <Shield color="#667eea" size={24} />
              <Text style={styles.stepTitle}>Step 2: Verify Setup</Text>
            </View>
            
            <Text style={styles.instruction}>
              Enter the 6-digit code from your authenticator app to verify the setup:
            </Text>

            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
            />

            <TouchableOpacity 
              style={[styles.verifyButton, (isLoading || verificationCode.length !== 6) && styles.buttonDisabled]}
              onPress={verifyAndEnable}
              disabled={isLoading || verificationCode.length !== 6}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Verifying...' : 'Enable 2FA'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'complete' && (
          <View style={styles.step}>
            <View style={styles.stepHeader}>
              <CheckCircle color="#10b981" size={24} />
              <Text style={styles.stepTitle}>Setup Complete!</Text>
            </View>
            
            <Text style={styles.instruction}>
              Two-factor authentication is now enabled. Save these backup codes in a safe place:
            </Text>

            <View style={styles.backupCodesContainer}>
              <View style={styles.backupCodesHeader}>
                <Text style={styles.backupCodesTitle}>Backup Codes</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={copyBackupCodes}
                >
                  <Copy color="#667eea" size={16} />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.codesList}>
                {backupCodes.map((code, index) => (
                  <Text key={index} style={styles.backupCode}>{code}</Text>
                ))}
              </View>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Keep these codes safe! You can use them to access your account if you lose your authenticator device.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.finishButton}
              onPress={finishSetup}
            >
              <Text style={styles.finishButtonText}>Finish Setup</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 16,
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  step: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  manualEntry: {
    marginBottom: 24,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  keyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  keyText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#1a1a1a',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  codeInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontFamily: 'monospace',
    letterSpacing: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  nextButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  verifyButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  backupCodesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  backupCodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backupCodesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  codesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupCode: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  finishButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});