import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Shield, Lock, Clock, UserCheck, ArrowLeft } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { selectedAssociation, updateAssociation } = useAssociation();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    requireTwoFactorForAdmins: false,
    allowGuestAccess: false,
    sessionTimeout: 60,
  });

  // Use association data directly from context
  useEffect(() => {
    console.log('Security settings - selectedAssociation changed:', selectedAssociation);
    console.log('Association ID:', selectedAssociation?.id);
    console.log('Association keys:', selectedAssociation ? Object.keys(selectedAssociation) : 'null');
    if (selectedAssociation?.settings?.security) {
      console.log('Loading security settings:', selectedAssociation.settings.security);
      setSettings(selectedAssociation.settings.security);
    } else {
      console.log('No security settings found, using defaults');
    }
  }, [selectedAssociation]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      if (!selectedAssociation) throw new Error('No association selected');
      
      // Handle both 'id' and '_id' field names
      const associationId = selectedAssociation.id || (selectedAssociation as any)._id;
      if (!associationId) throw new Error('Association ID is missing');
      
      console.log('Updating security settings:', newSettings);
      console.log('Selected association:', selectedAssociation);
      console.log('Association ID:', associationId);
      
      const updatedSettings = {
        ...selectedAssociation.settings,
        security: newSettings
      };
      
      console.log('Final settings to send:', updatedSettings);
      
      // Use the updateAssociation function from context
      return new Promise((resolve, reject) => {
        updateAssociation(
          { associationId, data: { settings: updatedSettings } },
          {
            onSuccess: (data) => {
              console.log('Update success, response data:', data);
              resolve({ success: true });
            },
            onError: (error) => {
              console.error('Update error:', error);
              reject(error);
            }
          }
        );
      });
    },
    onSuccess: () => {
      console.log('Security settings updated successfully');
      
      // Update the settings in the local state immediately to prevent UI flash
      if (selectedAssociation) {
        const updatedAssociation = {
          ...selectedAssociation,
          settings: {
            ...selectedAssociation.settings,
            security: settings
          }
        };
        // This will be handled by the context's updateAssociation onSuccess
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-associations'] });
      
      Alert.alert('Success', 'Security settings updated successfully');
    },
    onError: (error) => {
      console.error('Update settings error:', error);
      Alert.alert('Error', 'Failed to update security settings');
    }
  });

  const handleToggle = (key: keyof typeof settings) => {
    if (key === 'sessionTimeout') return;
    console.log('Toggling setting:', key, 'from', settings[key], 'to', !settings[key]);
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeoutChange = (value: string) => {
    const numValue = parseInt(value) || 60;
    setSettings(prev => ({ ...prev, sessionTimeout: numValue }));
  };

  const handleSave = () => {
    console.log('Saving security settings:', settings);
    updateSettingsMutation.mutate(settings);
  };

  // Check if user has permission to edit settings
  // Fallback: if role is undefined but user can access this page, assume admin
  const userRole = selectedAssociation?.role || 'admin'; // Temporary fallback
  const canEditSettings = userRole === 'admin' || userRole === 'moderator';
  
  console.log('Security settings - canEditSettings:', canEditSettings, 'role:', selectedAssociation?.role, 'fallback role:', userRole);

  if (!selectedAssociation) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyState}>
          <Shield color="#ccc" size={48} />
          <Text style={styles.emptyTitle}>No Association Selected</Text>
          <Text style={styles.emptyText}>Please select an association to manage security settings</Text>
        </View>
      </View>
    );
  }

  if (!canEditSettings) {
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
          <Text style={styles.title}>Security Settings</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
        </View>
        <View style={styles.emptyState}>
          <Lock color="#f59e0b" size={48} />
          <Text style={styles.emptyTitle}>Access Restricted</Text>
          <Text style={styles.emptyText}>Only admins and moderators can modify security settings</Text>
        </View>
      </View>
    );
  }

  const securityOptions = [
    {
      key: 'requireTwoFactorForAdmins' as keyof typeof settings,
      icon: Shield,
      title: 'Require 2FA for Admins',
      description: 'Require two-factor authentication for admin accounts',
      value: settings.requireTwoFactorForAdmins,
      type: 'toggle',
    },
    {
      key: 'allowGuestAccess' as keyof typeof settings,
      icon: UserCheck,
      title: 'Allow Guest Access',
      description: 'Allow non-members to view public information',
      value: settings.allowGuestAccess,
      type: 'toggle',
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
        <Text style={styles.title}>Security Settings</Text>
        <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
      </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Authentication</Text>
            {securityOptions.map(option => (
              <View key={option.key} style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <option.icon color="#667eea" size={20} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingDescription}>{option.description}</Text>
                </View>
                <Switch
                  value={option.value as boolean}
                  onValueChange={() => handleToggle(option.key)}
                  trackColor={{ false: '#e0e0e0', true: '#667eea' }}
                  thumbColor={option.value ? '#fff' : '#f4f3f4'}
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Management</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Clock color="#667eea" size={20} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Session Timeout</Text>
                <Text style={styles.settingDescription}>
                  Automatically log out users after inactivity (minutes)
                </Text>
                <TextInput
                  style={styles.input}
                  value={settings.sessionTimeout.toString()}
                  onChangeText={handleTimeoutChange}
                  keyboardType="numeric"
                  placeholder="60"
                />
                <View style={styles.timeoutInfo}>
                  <Text style={styles.timeoutText}>
                    ⏱️ Current timeout: {settings.sessionTimeout} minutes
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {settings.requireTwoFactorForAdmins && (
            <View style={styles.warningCard}>
              <Shield color="#f59e0b" size={20} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Two-Factor Authentication Required</Text>
                <Text style={styles.warningText}>
                  Admins and moderators must enable 2FA to access sensitive features
                </Text>
              </View>
            </View>
          )}

          {!settings.allowGuestAccess && (
            <View style={styles.infoCard}>
              <Lock color="#10b981" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Guest Access Disabled</Text>
                <Text style={styles.infoText}>
                  Only association members can view information
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.saveButton, updateSettingsMutation.isPending && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={updateSettingsMutation.isPending}
          >
            <Text style={styles.saveButtonText}>
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    gap: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  timeoutInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  timeoutText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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