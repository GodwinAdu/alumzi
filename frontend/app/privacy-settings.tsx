import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Shield, Eye, Users, Lock } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { selectedAssociation, updateAssociation, isUpdatingAssociation } = useAssociation();
  const { user } = useAuth();
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const canManageSettings = userRole === 'admin' || userRole === 'moderator';
  
  const [settings, setSettings] = useState({
    isPublic: selectedAssociation?.settings?.isPublic ?? true,
    requireApproval: selectedAssociation?.settings?.requireApproval ?? true,
    allowMemberInvites: selectedAssociation?.settings?.allowMemberInvites ?? true,
    showMemberList: selectedAssociation?.settings?.showMemberList ?? true,
    showFinancials: selectedAssociation?.settings?.showFinancials ?? false,
    allowDataExport: selectedAssociation?.settings?.allowDataExport ?? false,
  });

  useEffect(() => {
    if (selectedAssociation?.settings) {
      setSettings({
        isPublic: selectedAssociation.settings.isPublic ?? true,
        requireApproval: selectedAssociation.settings.requireApproval ?? true,
        allowMemberInvites: selectedAssociation.settings.allowMemberInvites ?? true,
        showMemberList: selectedAssociation.settings.showMemberList ?? true,
        showFinancials: selectedAssociation.settings.showFinancials ?? false,
        allowDataExport: selectedAssociation.settings.allowDataExport ?? false,
      });
    }
  }, [selectedAssociation?.settings]);

  const handleToggle = (key: keyof typeof settings) => {
    if (!canManageSettings) return;
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!selectedAssociation || !canManageSettings) return;
    
    updateAssociation({
      associationId: selectedAssociation.id,
      data: { settings }
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Privacy settings updated successfully');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to update privacy settings');
      }
    });
  };

  if (!selectedAssociation) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Privacy Settings' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No association selected</Text>
        </View>
      </View>
    );
  }

  const privacyOptions = [
    {
      key: 'isPublic' as keyof typeof settings,
      icon: Eye,
      title: 'Publicly Visible',
      description: 'Allow your association to be found in search results',
      value: settings.isPublic,
    },
    {
      key: 'requireApproval' as keyof typeof settings,
      icon: Shield,
      title: 'Require Join Approval',
      description: 'New members must be approved by moderators',
      value: settings.requireApproval,
    },
    {
      key: 'allowMemberInvites' as keyof typeof settings,
      icon: Users,
      title: 'Allow Member Invites',
      description: 'Let members invite others to join',
      value: settings.allowMemberInvites,
    },
    {
      key: 'showMemberList' as keyof typeof settings,
      icon: Users,
      title: 'Show Member List',
      description: 'Display member list to all association members',
      value: settings.showMemberList,
    },
    {
      key: 'showFinancials' as keyof typeof settings,
      icon: Lock,
      title: 'Show Financial Data',
      description: 'Allow members to view financial reports',
      value: settings.showFinancials,
    },
    {
      key: 'allowDataExport' as keyof typeof settings,
      icon: Lock,
      title: 'Allow Data Export',
      description: 'Let members export their own data',
      value: settings.allowDataExport,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Privacy & Security',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy & Security</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Association Visibility</Text>
            {privacyOptions.slice(0, 2).map(option => (
              <View key={option.key} style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <option.icon color="#667eea" size={20} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingDescription}>{option.description}</Text>
                </View>
                <Switch
                  value={option.value}
                  onValueChange={() => handleToggle(option.key)}
                  trackColor={{ false: '#e0e0e0', true: canManageSettings ? '#667eea' : '#ccc' }}
                  thumbColor={option.value ? '#fff' : '#f4f3f4'}
                  disabled={!canManageSettings}
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Member Permissions</Text>
            {privacyOptions.slice(2, 4).map(option => (
              <View key={option.key} style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <option.icon color="#667eea" size={20} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingDescription}>{option.description}</Text>
                </View>
                <Switch
                  value={option.value}
                  onValueChange={() => handleToggle(option.key)}
                  trackColor={{ false: '#e0e0e0', true: canManageSettings ? '#667eea' : '#ccc' }}
                  thumbColor={option.value ? '#fff' : '#f4f3f4'}
                  disabled={!canManageSettings}
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Access</Text>
            {privacyOptions.slice(4).map(option => (
              <View key={option.key} style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <option.icon color="#667eea" size={20} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingDescription}>{option.description}</Text>
                </View>
                <Switch
                  value={option.value}
                  onValueChange={() => handleToggle(option.key)}
                  trackColor={{ false: '#e0e0e0', true: canManageSettings ? '#667eea' : '#ccc' }}
                  thumbColor={option.value ? '#fff' : '#f4f3f4'}
                  disabled={!canManageSettings}
                />
              </View>
            ))}
          </View>

          {canManageSettings && (
            <TouchableOpacity 
              style={[styles.saveButton, isUpdatingAssociation && styles.buttonDisabled]} 
              onPress={handleSave}
              disabled={isUpdatingAssociation}
            >
              <Text style={styles.saveButtonText}>
                {isUpdatingAssociation ? 'Saving...' : 'Save Settings'}
              </Text>
            </TouchableOpacity>
          )}
          
          {!canManageSettings && (
            <View style={styles.readOnlyNotice}>
              <Text style={styles.readOnlyText}>
                Only admins and moderators can modify privacy settings
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  readOnlyNotice: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});