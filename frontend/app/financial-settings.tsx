import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { DollarSign, Receipt, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function FinancialSettingsPage() {
  const router = useRouter();
  const { selectedAssociation, updateAssociation } = useAssociation();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    allowMemberContributions: true,
    requireReceiptUpload: false,
    autoApproveExpenses: false,
    expenseApprovalLimit: 1000,
  });

  // Use association data directly from context
  useEffect(() => {
    if (selectedAssociation?.settings?.financial) {
      setSettings(selectedAssociation.settings.financial);
    }
  }, [selectedAssociation]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      if (!selectedAssociation) throw new Error('No association selected');
      
      const updatedSettings = {
        ...selectedAssociation.settings,
        financial: newSettings
      };
      
      return api.updateAssociation(selectedAssociation.id, { settings: updatedSettings });
    },
    onSuccess: (data) => {
      // Update the association in context
      if (selectedAssociation && data.association) {
        updateAssociation({
          ...selectedAssociation,
          settings: data.association.settings
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      
      Alert.alert('Success', 'Financial settings updated successfully');
    },
    onError: (error) => {
      console.error('Update settings error:', error);
      Alert.alert('Error', 'Failed to update financial settings');
    }
  });

  const handleToggle = (key: keyof typeof settings) => {
    if (key === 'expenseApprovalLimit') return;
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLimitChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, expenseApprovalLimit: numValue }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  // Check if user has permission to edit settings
  const canEditSettings = selectedAssociation?.role === 'admin' || selectedAssociation?.role === 'moderator';

  if (!selectedAssociation) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyState}>
          <DollarSign color="#ccc" size={48} />
          <Text style={styles.emptyTitle}>No Association Selected</Text>
          <Text style={styles.emptyText}>Please select an association to manage financial settings</Text>
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
          <Text style={styles.title}>Financial Settings</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
        </View>
        <View style={styles.emptyState}>
          <DollarSign color="#f59e0b" size={48} />
          <Text style={styles.emptyTitle}>Access Restricted</Text>
          <Text style={styles.emptyText}>Only admins and moderators can modify financial settings</Text>
        </View>
      </View>
    );
  }

  const financialOptions = [
    {
      key: 'allowMemberContributions' as keyof typeof settings,
      icon: DollarSign,
      title: 'Allow Member Contributions',
      description: 'Let members contribute funds to the association',
      value: settings.allowMemberContributions,
      type: 'toggle',
    },
    {
      key: 'requireReceiptUpload' as keyof typeof settings,
      icon: Receipt,
      title: 'Require Receipt Upload',
      description: 'Require receipts for all expense entries',
      value: settings.requireReceiptUpload,
      type: 'toggle',
    },
    {
      key: 'autoApproveExpenses' as keyof typeof settings,
      icon: CheckCircle,
      title: 'Auto-approve Small Expenses',
      description: 'Automatically approve expenses below the limit',
      value: settings.autoApproveExpenses,
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
        <Text style={styles.title}>Financial Settings</Text>
        <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
      </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Management</Text>
            {financialOptions.map(option => (
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
            <Text style={styles.sectionTitle}>Approval Limits</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <AlertCircle color="#667eea" size={20} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Auto-approval Limit</Text>
                <Text style={styles.settingDescription}>
                  Expenses below this amount will be auto-approved
                </Text>
                <TextInput
                  style={styles.input}
                  value={settings.expenseApprovalLimit.toString()}
                  onChangeText={handleLimitChange}
                  keyboardType="numeric"
                  placeholder="1000"
                />
              </View>
            </View>
          </View>

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
    paddingTop: 70,
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
});