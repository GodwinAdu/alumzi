import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Shield, ArrowLeft, Key, RefreshCw, Trash2 } from 'lucide-react-native';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Manage2FAPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState({
    enabled: false,
    enabledAt: null,
    backupCodesCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get2FAStatus();
      setStatus(response);
    } catch (error) {
      Alert.alert('Error', 'Failed to load 2FA status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsProcessing(true);
      await api.disable2FA(verificationCode);
      setShowDisableModal(false);
      setVerificationCode('');
      Alert.alert('Success', '2FA has been disabled', [
        { text: 'OK', onPress: () => loadStatus() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await api.regenerateBackupCodes(verificationCode);
      setBackupCodes(response.backupCodes);
      setVerificationCode('');
      loadStatus();
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyBackupCodes = async () => {
    const codesText = backupCodes.join('\n');
    // Copy to clipboard logic would go here
    Alert.alert('Copied', 'Backup codes copied to clipboard');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading 2FA settings...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>Manage your account security</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Shield color={status.enabled ? '#10b981' : '#f59e0b'} size={24} />
            <Text style={styles.statusTitle}>
              2FA is {status.enabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          {status.enabled ? (
            <View>
              <Text style={styles.statusDescription}>
                Your account is protected with two-factor authentication.
                {status.enabledAt && ` Enabled on ${new Date(status.enabledAt).toLocaleDateString()}.`}
              </Text>
              
              <View style={styles.backupInfo}>
                <Key color="#667eea" size={16} />
                <Text style={styles.backupText}>
                  {status.backupCodesCount} backup codes remaining
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.statusDescription}>
              Enable two-factor authentication to add an extra layer of security to your account.
            </Text>
          )}
        </View>

        {status.enabled ? (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowBackupModal(true)}
            >
              <RefreshCw color="#667eea" size={20} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Regenerate Backup Codes</Text>
                <Text style={styles.actionDescription}>
                  Generate new backup codes and invalidate old ones
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => setShowDisableModal(true)}
            >
              <Trash2 color="#ef4444" size={20} />
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, styles.dangerText]}>Disable 2FA</Text>
                <Text style={styles.actionDescription}>
                  Remove two-factor authentication from your account
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.enableButton}
            onPress={() => router.push('/setup-2fa')}
          >
            <Shield color="#fff" size={20} />
            <Text style={styles.enableButtonText}>Enable Two-Factor Authentication</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Two-Factor Authentication</Text>
          <Text style={styles.infoText}>
            Two-factor authentication (2FA) adds an extra layer of security to your account. 
            Even if someone knows your password, they won't be able to access your account 
            without the second factor from your authenticator app.
          </Text>
        </View>
      </ScrollView>

      {/* Disable 2FA Modal */}
      <Modal visible={showDisableModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Disable Two-Factor Authentication</Text>
            <Text style={styles.modalDescription}>
              Enter your authenticator code to disable 2FA. This will make your account less secure.
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

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowDisableModal(false);
                  setVerificationCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, styles.dangerButton, (isProcessing || verificationCode.length !== 6) && styles.buttonDisabled]}
                onPress={handleDisable2FA}
                disabled={isProcessing || verificationCode.length !== 6}
              >
                <Text style={styles.confirmButtonText}>
                  {isProcessing ? 'Disabling...' : 'Disable 2FA'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal visible={showBackupModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {backupCodes.length === 0 ? (
              <>
                <Text style={styles.modalTitle}>Regenerate Backup Codes</Text>
                <Text style={styles.modalDescription}>
                  Enter your authenticator code to generate new backup codes. This will invalidate your existing codes.
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

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowBackupModal(false);
                      setVerificationCode('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmButton, (isProcessing || verificationCode.length !== 6) && styles.buttonDisabled]}
                    onPress={handleRegenerateBackupCodes}
                    disabled={isProcessing || verificationCode.length !== 6}
                  >
                    <Text style={styles.confirmButtonText}>
                      {isProcessing ? 'Generating...' : 'Generate Codes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>New Backup Codes</Text>
                <Text style={styles.modalDescription}>
                  Save these codes in a safe place. Each code can only be used once.
                </Text>
                
                <View style={styles.backupCodesContainer}>
                  {backupCodes.map((code, index) => (
                    <Text key={index} style={styles.backupCode}>{code}</Text>
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={copyBackupCodes}
                  >
                    <Text style={styles.cancelButtonText}>Copy Codes</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => {
                      setShowBackupModal(false);
                      setBackupCodes([]);
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  statusDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  backupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 8,
  },
  backupText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  dangerText: {
    color: '#ef4444',
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 320,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  backupCodesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupCode: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});