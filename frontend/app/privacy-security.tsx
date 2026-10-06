import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Shield, Lock, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { api } from '@/lib/api';

export default function PrivacySecurityPage() {
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await api.get2FAStatus();
      setTwoFactorEnabled(response.enabled);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAPress = () => {
    if (twoFactorEnabled) {
      router.push('/manage-2fa');
    } else {
      router.push('/setup-2fa');
    }
  };

  const securityOptions = [
    {
      icon: Shield,
      title: 'Two-Factor Authentication',
      description: twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security',
      status: twoFactorEnabled ? 'Enabled' : 'Disabled',
      statusColor: twoFactorEnabled ? '#10b981' : '#f59e0b',
      onPress: handle2FAPress,
    },
    {
      icon: Lock,
      title: 'Change Password',
      description: 'Update your account password',
      onPress: () => {
        Alert.alert('Coming Soon', 'Password change feature will be available soon');
      },
    },
  ];

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
        <Text style={styles.title}>Privacy & Security</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.optionsList}>
            {securityOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.optionItem,
                  index === securityOptions.length - 1 && styles.lastItem
                ]}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <option.icon color="#667eea" size={20} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
                <View style={styles.optionRight}>
                  {option.status && (
                    <Text style={[styles.statusText, { color: option.statusColor }]}>
                      {option.status}
                    </Text>
                  )}
                  <ChevronRight color="#999" size={20} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.optionsList}>
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Data & Privacy</Text>
                  <Text style={styles.optionDescription}>Manage your data and privacy settings</Text>
                </View>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {twoFactorEnabled && (
          <View style={styles.infoCard}>
            <Shield color="#10b981" size={20} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Two-Factor Authentication Active</Text>
              <Text style={styles.infoText}>
                Your account is protected with two-factor authentication
              </Text>
            </View>
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
    paddingTop: 60,
    padding: 24,
    paddingBottom: 16,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  optionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#065f46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#065f46',
  },
});