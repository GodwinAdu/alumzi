import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, CreditCard, Eye, EyeOff } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const { associationId, associationName } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['associationSettings', associationId],
    queryFn: () => api.getAssociationSettings(associationId as string),
    enabled: !!associationId,
  });

  const defaultSettings = {
    paymentSettings: {
      paystack: {
        enabled: false,
        publicKey: '',
        secretKey: '',
        webhookSecret: ''
      }
    }
  };

  const [settings, setSettings] = useState(data?.paymentSettings || defaultSettings.paymentSettings);

  React.useEffect(() => {
    if (data?.paymentSettings) {
      setSettings(data.paymentSettings);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => api.updateAssociationSettings(associationId as string, { paymentSettings: newSettings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associationSettings', associationId] });
      Alert.alert('Success', 'Payment settings updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update payment settings');
    },
  });

  const handleSave = () => {
    if (settings.paystack.enabled) {
      if (!settings.paystack.publicKey || !settings.paystack.secretKey) {
        Alert.alert('Error', 'Please provide both public and secret keys to enable Paystack');
        return;
      }
    }
    updateMutation.mutate(settings);
  };

  const updatePaystackSetting = (field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      paystack: {
        ...prev.paystack,
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Settings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{associationName}</Text>
          <Text style={styles.headerSubtitle}>Payment Settings</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
          <Save color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard color="#667eea" size={24} />
            <Text style={styles.sectionTitle}>Paystack Integration</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Enable Paystack to collect dues payments from members automatically. 
            Members will be able to pay their dues using cards, bank transfers, and other payment methods.
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Paystack</Text>
              <Text style={styles.settingDesc}>Allow members to pay dues via Paystack</Text>
            </View>
            <Switch
              value={settings.paystack?.enabled || false}
              onValueChange={(v) => updatePaystackSetting('enabled', v)}
            />
          </View>

          {settings.paystack?.enabled && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Public Key</Text>
                <Text style={styles.inputDescription}>
                  Your Paystack public key (starts with pk_)
                </Text>
                <TextInput
                  style={styles.input}
                  value={settings.paystack?.publicKey || ''}
                  onChangeText={(v) => updatePaystackSetting('publicKey', v)}
                  placeholder="pk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Secret Key</Text>
                <Text style={styles.inputDescription}>
                  Your Paystack secret key (starts with sk_) - Keep this secure!
                </Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={[styles.input, styles.passwordField]}
                    value={settings.paystack?.secretKey || ''}
                    onChangeText={(v) => updatePaystackSetting('secretKey', v)}
                    placeholder="sk_test_your_secret_key_here"
                    secureTextEntry={!showSecretKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? (
                      <EyeOff color="#666" size={20} />
                    ) : (
                      <Eye color="#666" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Webhook Secret (Optional)</Text>
                <Text style={styles.inputDescription}>
                  For enhanced security and payment verification
                </Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={[styles.input, styles.passwordField]}
                    value={settings.paystack?.webhookSecret || ''}
                    onChangeText={(v) => updatePaystackSetting('webhookSecret', v)}
                    placeholder="Your webhook secret"
                    secureTextEntry={!showWebhookSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowWebhookSecret(!showWebhookSecret)}
                  >
                    {showWebhookSecret ? (
                      <EyeOff color="#666" size={20} />
                    ) : (
                      <Eye color="#666" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>How to get your Paystack keys:</Text>
                <Text style={styles.infoText}>
                  1. Log in to your Paystack Dashboard{'\n'}
                  2. Go to Settings → API Keys & Webhooks{'\n'}
                  3. Copy your Public and Secret keys{'\n'}
                  4. Use test keys for testing, live keys for production
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Notice</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              🔒 Your payment credentials are encrypted and stored securely. 
              Never share your secret keys with anyone. Only association admins can view and modify these settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'monospace',
  },
  passwordInput: {
    position: 'relative',
  },
  passwordField: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  infoBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});