import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function GroupSettingsScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['groupSettings', groupId],
    queryFn: () => api.getGroupSettings(groupId as string),
    enabled: !!groupId,
  });

  const defaultSettings = {
    isPublic: false,
    requireApproval: true,
    onlyAdminsCanPost: false,
    allowMemberInvites: true,
    financial: {
      allowMemberContributions: true,
      requireReceiptUpload: false,
      autoApproveExpenses: false,
      expenseApprovalLimit: 0
    },
    notifications: {
      financialUpdates: true,
      newMembers: true,
      monthlyReports: false
    },
    dues: {
      enabled: false,
      amount: 0,
      frequency: 'monthly',
      dueDate: 1,
      description: ''
    },
    privacy: {
      showFinancials: true,
      showMemberList: true
    }
  };

  const [settings, setSettings] = useState(data?.settings || defaultSettings);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  
  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  React.useEffect(() => {
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => api.updateGroupSettings(groupId as string, newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSettings', groupId] });
      Alert.alert('Success', 'Settings updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update settings');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const updateSetting = (path: string[], value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev };
      let current = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Settings</Text>
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
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>Settings</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
          <Save color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Join Settings</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Public Group</Text>
              <Text style={styles.settingDesc}>Anyone can join without approval</Text>
            </View>
            <Switch
              value={settings.isPublic}
              onValueChange={(v) => updateSetting(['isPublic'], v)}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Approval</Text>
              <Text style={styles.settingDesc}>Admins must approve join requests</Text>
            </View>
            <Switch
              value={settings.requireApproval}
              onValueChange={(v) => updateSetting(['requireApproval'], v)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posting Permissions</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Only Admins Can Post</Text>
              <Text style={styles.settingDesc}>Restrict posting to group admins only</Text>
            </View>
            <Switch
              value={settings.onlyAdminsCanPost}
              onValueChange={(v) => updateSetting(['onlyAdminsCanPost'], v)}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Member Invites</Text>
              <Text style={styles.settingDesc}>Members can invite others to group</Text>
            </View>
            <Switch
              value={settings.allowMemberInvites}
              onValueChange={(v) => updateSetting(['allowMemberInvites'], v)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Settings</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Member Contributions</Text>
              <Text style={styles.settingDesc}>Members can record income</Text>
            </View>
            <Switch
              value={settings.financial?.allowMemberContributions}
              onValueChange={(v) => updateSetting(['financial', 'allowMemberContributions'], v)}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Receipt Upload</Text>
              <Text style={styles.settingDesc}>Mandatory receipts for expenses</Text>
            </View>
            <Switch
              value={settings.financial?.requireReceiptUpload}
              onValueChange={(v) => updateSetting(['financial', 'requireReceiptUpload'], v)}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Approve Expenses</Text>
              <Text style={styles.settingDesc}>Automatically approve expenses below limit</Text>
            </View>
            <Switch
              value={settings.financial?.autoApproveExpenses}
              onValueChange={(v) => updateSetting(['financial', 'autoApproveExpenses'], v)}
            />
          </View>
          {settings.financial?.autoApproveExpenses && (
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Approval Limit</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.financial?.expenseApprovalLimit || 0)}
                  onChangeText={(v) => updateSetting(['financial', 'expenseApprovalLimit'], parseFloat(v) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Financial Updates</Text>
              <Text style={styles.settingDesc}>Notify on income/expense changes</Text>
            </View>
            <Switch
              value={settings.notifications?.financialUpdates}
              onValueChange={(v) => updateSetting(['notifications', 'financialUpdates'], v)}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>New Members</Text>
              <Text style={styles.settingDesc}>Notify when members join</Text>
            </View>
            <Switch
              value={settings.notifications?.newMembers}
              onValueChange={(v) => updateSetting(['notifications', 'newMembers'], v)}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Monthly Reports</Text>
              <Text style={styles.settingDesc}>Send monthly financial reports</Text>
            </View>
            <Switch
              value={settings.notifications?.monthlyReports}
              onValueChange={(v) => updateSetting(['notifications', 'monthlyReports'], v)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Dues</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Dues</Text>
              <Text style={styles.settingDesc}>Collect regular dues from members</Text>
            </View>
            <Switch
              value={settings.dues?.enabled}
              onValueChange={(v) => updateSetting(['dues', 'enabled'], v)}
            />
          </View>
          {settings.dues?.enabled && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={String(settings.dues?.amount || 0)}
                    onChangeText={(v) => updateSetting(['dues', 'amount'], parseFloat(v) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Frequency</Text>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => setShowFrequencyModal(true)}
                  >
                    <Text style={styles.selectButtonText}>
                      {frequencyOptions.find(opt => opt.value === settings.dues?.frequency)?.label || 'Monthly'}
                    </Text>
                    <ChevronDown color="#666" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Due Date</Text>
                  <Text style={styles.settingDesc}>
                    {settings.dues?.frequency === 'weekly' ? 'Day of week (1=Monday, 7=Sunday)' :
                     settings.dues?.frequency === 'monthly' ? 'Day of month (1-28)' :
                     settings.dues?.frequency === 'quarterly' ? 'Day of quarter (1-90)' :
                     'Day of year (1-365)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={String(settings.dues?.dueDate || 1)}
                    onChangeText={(v) => {
                      const num = parseInt(v) || 1;
                      const max = settings.dues?.frequency === 'weekly' ? 7 :
                                 settings.dues?.frequency === 'monthly' ? 28 :
                                 settings.dues?.frequency === 'quarterly' ? 90 : 365;
                      updateSetting(['dues', 'dueDate'], Math.min(Math.max(num, 1), max));
                    }}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
              </View>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Description</Text>
                  <TextInput
                    style={styles.input}
                    value={settings.dues?.description || ''}
                    onChangeText={(v) => updateSetting(['dues', 'description'], v)}
                    placeholder="Group dues payment"
                  />
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Financials</Text>
              <Text style={styles.settingDesc}>Members can view financial data</Text>
            </View>
            <Switch
              value={settings.privacy?.showFinancials}
              onValueChange={(v) => updateSetting(['privacy', 'showFinancials'], v)}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Member List</Text>
              <Text style={styles.settingDesc}>Display all group members</Text>
            </View>
            <Switch
              value={settings.privacy?.showMemberList}
              onValueChange={(v) => updateSetting(['privacy', 'showMemberList'], v)}
            />
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={showFrequencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Frequency</Text>
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  settings.dues?.frequency === option.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  updateSetting(['dues', 'frequency'], option.value);
                  setShowFrequencyModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  settings.dues?.frequency === option.value && styles.modalOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowFrequencyModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  input: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButton: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  modalOptionSelected: {
    backgroundColor: '#667eea',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  modalCancel: {
    padding: 16,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
