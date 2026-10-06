import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Users, Shield, Bell, FileText, Trash2, Edit3, DollarSign, Lock, ArrowLeft, CreditCard, Crown, Target, Receipt } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { router } from 'expo-router';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';

export default function AssociationSettingsPage() {
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  const socket = useWebSocket();
  
  const members = (membersData as any)?.members || [];
  const currentMember = members.find((m: any) => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const canManageSettings = userRole === 'admin' || userRole === 'moderator';

  useEffect(() => {
    if (selectedAssociation?.id && socket) {
      socket.emit('join-association', selectedAssociation.id);
      return () => {
        socket.emit('leave-association', selectedAssociation.id);
      };
    }
  }, [selectedAssociation?.id, socket]);

  if (!selectedAssociation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Settings color="#ccc" size={48} />
          <Text style={styles.emptyTitle}>No Association Selected</Text>
          <Text style={styles.emptyText}>Please select an association to view settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canManageSettings) {
    // Show read-only settings for members
    const memberViewOptions = [
      {
        icon: Users,
        title: 'View Members',
        description: 'View association members',
        onPress: () => router.push('/(association-tabs)/members'),
      },
      {
        icon: FileText,
        title: 'My Statement',
        description: 'View your financial statement',
        onPress: () => router.push(`/member-statement?memberId=${currentMember?.id}`),
      },
      {
        icon: Bell,
        title: 'Notification Settings',
        description: 'Manage your notification preferences',
        onPress: () => router.push('/notification-settings'),
      },
    ];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.replace('/(auth-tabs)/home')}
              >
                <ArrowLeft color="#667eea" size={20} />
                <Text style={styles.backButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Association Info</Text>
            <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Association Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedAssociation.name}</Text>
              </View>
              {selectedAssociation.description && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedAssociation.description}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Currency</Text>
                <Text style={styles.detailValue}>{selectedAssociation.currency || 'USD'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total Members</Text>
                <Text style={styles.detailValue}>{members.length}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Your Role</Text>
                <Text style={[styles.detailValue, styles.roleText]}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
              </View>
              {(selectedAssociation as any).createdAt && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{new Date((selectedAssociation as any).createdAt).toLocaleDateString()}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Options</Text>
            {memberViewOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.settingItem} onPress={option.onPress}>
                <View style={styles.settingIcon}>
                  <option.icon color="#667eea" size={20} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Lock color="#667eea" size={24} />
            <Text style={styles.infoTitle}>Member Access</Text>
            <Text style={styles.infoText}>
              You have member-level access to this association. Contact an admin or moderator for settings changes.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const settingsOptions = [
    {
      icon: Edit3,
      title: 'Edit Association Details',
      description: 'Update name, description, and other details',
      onPress: () => router.push('/edit-association'),
    },
    {
      icon: Users,
      title: 'Member Management',
      description: 'Manage member roles and permissions',
      onPress: () => router.push('/member-management'),
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control who can join and view association data',
      onPress: () => router.push('/privacy-settings'),
    },
    {
      icon: Lock,
      title: 'Security Settings',
      description: 'Configure authentication and session settings',
      onPress: () => router.push('/security-settings'),
    },
    {
      icon: CreditCard,
      title: 'Settlement Account',
      description: 'Manage bank account for monthly settlements',
      onPress: () => router.push('/payment-account-settings'),
    },
    {
      icon: Receipt,
      title: 'Payment Settings',
      description: 'Configure Paystack integration for dues collection',
      onPress: () => router.push(`/payment-settings?associationId=${selectedAssociation.id}&associationName=${selectedAssociation.name}`),
    },
    {
      icon: Crown,
      title: 'Subscription Plan',
      description: 'View and manage your subscription plan',
      onPress: () => router.push('/subscription-settings'),
    },
    {
      icon: Target,
      title: 'Fundraising Campaigns',
      description: 'Create and manage fundraising campaigns',
      onPress: () => router.push(`/manage-fundraisers?associationId=${selectedAssociation.id}`),
    },
    {
      icon: FileText,
      title: 'Reports & Export',
      description: 'Generate and export financial reports',
      onPress: () => router.push('/(association-tabs)/report'),
    },
  ];

  const handleDeleteAssociation = () => {
    Alert.alert(
      'Delete Association',
      `Are you sure you want to delete "${selectedAssociation.name}"? This action cannot be undone and will permanently delete all data including members, transactions, and reports.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAssociation(selectedAssociation.id);
              Alert.alert('Success', 'Association deleted successfully', [
                { text: 'OK', onPress: () => router.replace('/(auth-tabs)/home') }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete association');
            }
          },
        },
      ]
    );
  };

  const dangerOptions = [
    {
      icon: Trash2,
      title: 'Delete Association',
      description: 'Permanently delete this association and all data',
      onPress: handleDeleteAssociation,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.replace('/(auth-tabs)/home')}
            >
              <ArrowLeft color="#667eea" size={20} />
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Association Settings</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.infoCard}>
            <Bell color="#667eea" size={24} />
            <Text style={styles.infoTitle}>Group-Level Settings</Text>
            <Text style={styles.infoText}>
              Financial settings, notifications, and dues are now managed at the group level. Configure these in each group's settings.
            </Text>
          </View>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.settingItem} onPress={option.onPress}>
              <View style={styles.settingIcon}>
                <option.icon color="#667eea" size={20} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Text style={styles.settingDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          {dangerOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.settingItem} onPress={option.onPress}>
              <View style={styles.settingIcon}>
                <option.icon color="#ef4444" size={20} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: '#ef4444' }]}>{option.title}</Text>
                <Text style={styles.settingDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    marginBottom: 16,
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
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
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
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#667eea',
    marginTop: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right',
  },
  roleText: {
    color: '#667eea',
  },
});