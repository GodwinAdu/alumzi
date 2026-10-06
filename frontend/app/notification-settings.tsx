import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Bell, DollarSign, Users, Calendar, MessageSquare, Lock } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useMembers } from '@/hooks/useMembers';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { selectedAssociation, updateAssociation, isUpdatingAssociation } = useAssociation();
  const { user } = useAuth();
  const { limits, plan } = useSubscription();
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const canManageSettings = userRole === 'admin' || userRole === 'moderator';
  
  const [settings, setSettings] = useState({
    newMembers: selectedAssociation?.settings?.notifications?.newMembers ?? true,
    memberRequests: selectedAssociation?.settings?.notifications?.memberRequests ?? true,
    financialUpdates: selectedAssociation?.settings?.notifications?.financialUpdates ?? true,
    incomeRecorded: selectedAssociation?.settings?.notifications?.incomeRecorded ?? false,
    expenseRecorded: selectedAssociation?.settings?.notifications?.expenseRecorded ?? false,
    monthlyReports: selectedAssociation?.settings?.notifications?.monthlyReports ?? true,
    eventReminders: selectedAssociation?.settings?.notifications?.eventReminders ?? true,
    systemUpdates: selectedAssociation?.settings?.notifications?.systemUpdates ?? false,
    emailNotifications: selectedAssociation?.settings?.notifications?.emailNotifications ?? true,
    pushNotifications: selectedAssociation?.settings?.notifications?.pushNotifications ?? true,
  });

  useEffect(() => {
    if (selectedAssociation?.settings?.notifications) {
      setSettings({
        newMembers: selectedAssociation.settings.notifications.newMembers ?? true,
        memberRequests: selectedAssociation.settings.notifications.memberRequests ?? true,
        financialUpdates: selectedAssociation.settings.notifications.financialUpdates ?? true,
        incomeRecorded: selectedAssociation.settings.notifications.incomeRecorded ?? false,
        expenseRecorded: selectedAssociation.settings.notifications.expenseRecorded ?? false,
        monthlyReports: selectedAssociation.settings.notifications.monthlyReports ?? true,
        eventReminders: selectedAssociation.settings.notifications.eventReminders ?? true,
        systemUpdates: selectedAssociation.settings.notifications.systemUpdates ?? false,
        emailNotifications: selectedAssociation.settings.notifications.emailNotifications ?? true,
        pushNotifications: selectedAssociation.settings.notifications.pushNotifications ?? true,
      });
    }
  }, [selectedAssociation?.settings?.notifications]);

  const handleToggle = (key: keyof typeof settings) => {
    if (!canManageSettings) return;
    
    if (key === 'emailNotifications' && !limits.hasEmailNotifications) {
      Alert.alert(
        'Upgrade Required',
        'Email notifications are available on Pro and Enterprise plans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/subscription-settings') }
        ]
      );
      return;
    }
    
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!selectedAssociation || !canManageSettings) return;
    
    const updatedSettings = {
      ...selectedAssociation.settings,
      notifications: settings
    };
    
    updateAssociation({
      associationId: selectedAssociation.id,
      data: { settings: updatedSettings }
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Notification settings updated successfully');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to update notification settings');
      }
    });
  };

  if (!selectedAssociation) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Notification Settings' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No association selected</Text>
        </View>
      </View>
    );
  }

  const notificationSections = [
    {
      title: 'Member Activity',
      icon: Users,
      options: [
        {
          key: 'newMembers' as keyof typeof settings,
          title: 'New Members',
          description: 'When someone joins the association',
          value: settings.newMembers,
        },
        {
          key: 'memberRequests' as keyof typeof settings,
          title: 'Join Requests',
          description: 'When someone requests to join',
          value: settings.memberRequests,
        },
      ],
    },
    {
      title: 'Financial Updates',
      icon: DollarSign,
      options: [
        {
          key: 'financialUpdates' as keyof typeof settings,
          title: 'Financial Summary',
          description: 'Weekly financial summary reports',
          value: settings.financialUpdates,
        },
        {
          key: 'incomeRecorded' as keyof typeof settings,
          title: 'Income Recorded',
          description: 'When new income is recorded',
          value: settings.incomeRecorded,
        },
        {
          key: 'expenseRecorded' as keyof typeof settings,
          title: 'Expense Recorded',
          description: 'When new expenses are recorded',
          value: settings.expenseRecorded,
        },
        {
          key: 'monthlyReports' as keyof typeof settings,
          title: 'Monthly Reports',
          description: 'Monthly financial reports',
          value: settings.monthlyReports,
        },
      ],
    },
    {
      title: 'General',
      icon: Bell,
      options: [
        {
          key: 'eventReminders' as keyof typeof settings,
          title: 'Event Reminders',
          description: 'Reminders for upcoming events',
          value: settings.eventReminders,
        },
        {
          key: 'systemUpdates' as keyof typeof settings,
          title: 'System Updates',
          description: 'App updates and maintenance notices',
          value: settings.systemUpdates,
        },
      ],
    },
  ];

  const deliveryOptions = [
    {
      key: 'emailNotifications' as keyof typeof settings,
      title: 'Email Notifications',
      description: limits.hasEmailNotifications 
        ? 'Receive notifications via email'
        : 'Available on Pro and Enterprise plans',
      value: settings.emailNotifications,
      restricted: !limits.hasEmailNotifications,
    },
    {
      key: 'pushNotifications' as keyof typeof settings,
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      value: settings.pushNotifications,
      restricted: false,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Notifications',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
        </View>

        <ScrollView style={styles.content}>
          {notificationSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <View style={styles.sectionHeader}>
                <section.icon color="#667eea" size={20} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {section.options.map(option => (
                <View key={option.key} style={styles.settingItem}>
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
          ))}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MessageSquare color="#667eea" size={20} />
              <Text style={styles.sectionTitle}>Delivery Method</Text>
            </View>
            {deliveryOptions.map(option => (
              <View key={option.key} style={[styles.settingItem, option.restricted && styles.restrictedItem]}>
                <View style={styles.settingContent}>
                  <View style={styles.settingTitleRow}>
                    <Text style={[styles.settingTitle, option.restricted && styles.restrictedTitle]}>
                      {option.title}
                    </Text>
                    {option.restricted && <Lock color="#f59e0b" size={16} />}
                  </View>
                  <Text style={[styles.settingDescription, option.restricted && styles.restrictedDescription]}>
                    {option.description}
                  </Text>
                  {option.restricted && (
                    <TouchableOpacity 
                      style={styles.upgradeLink}
                      onPress={() => router.push('/subscription-settings')}
                    >
                      <Text style={styles.upgradeLinkText}>Upgrade to {plan === 'free' ? 'Pro' : 'Enterprise'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Switch
                  value={option.value && !option.restricted}
                  onValueChange={() => handleToggle(option.key)}
                  trackColor={{ false: '#e0e0e0', true: (canManageSettings && !option.restricted) ? '#667eea' : '#ccc' }}
                  thumbColor={(option.value && !option.restricted) ? '#fff' : '#f4f3f4'}
                  disabled={!canManageSettings || option.restricted}
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
                Only admins and moderators can modify notification settings
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  settingItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  readOnlyNotice: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  restrictedItem: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  restrictedTitle: {
    color: '#f59e0b',
  },
  restrictedDescription: {
    color: '#f59e0b',
  },
  upgradeLink: {
    marginTop: 4,
  },
  upgradeLinkText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600' as const,
  },
});