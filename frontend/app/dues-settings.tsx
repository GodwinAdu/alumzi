import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, DollarSign, Calendar, Users } from 'lucide-react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useAssociation } from '../contexts/AssociationContext';
import { getCurrencySymbol } from '../lib/utils/currency';

export default function DuesSettingsPage() {
  const { associationId } = useLocalSearchParams();
  const { selectedAssociation, updateAssociation } = useAssociation();
  const association = selectedAssociation;
  
  const currencySymbol = getCurrencySymbol(association?.currency || 'USD');
  
  const [duesSettings, setDuesSettings] = useState({
    amount: association?.settings?.dues?.amount?.toString() || '',
    frequency: association?.settings?.dues?.frequency || 'monthly',
    dueDate: association?.settings?.dues?.dueDate || '1',
    enabled: association?.settings?.dues?.enabled || false,
    description: association?.settings?.dues?.description || 'Member dues payment'
  });

  const [saving, setSaving] = useState(false);

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const handleSave = async () => {
    if (!association?.id) return;
    
    if (duesSettings.enabled && (!duesSettings.amount || parseFloat(duesSettings.amount) <= 0)) {
      Alert.alert('Error', 'Please enter a valid dues amount');
      return;
    }

    try {
      setSaving(true);
      
      const updatedSettings = {
        ...association.settings,
        dues: {
          enabled: duesSettings.enabled,
          amount: duesSettings.enabled ? parseFloat(duesSettings.amount) : 0,
          frequency: duesSettings.frequency,
          dueDate: parseInt(duesSettings.dueDate),
          description: duesSettings.description
        }
      };

      await updateAssociation({
        associationId: association.id,
        data: { settings: updatedSettings }
      });

      Alert.alert('Success', 'Dues settings updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating dues settings:', error);
      Alert.alert('Error', 'Failed to update dues settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft color="#667eea" size={20} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Member Dues Settings</Text>
            <Text style={styles.subtitle}>Configure recurring dues for association members</Text>
          </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enable Dues</Text>
          <View style={styles.toggleSection}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Enable Member Dues</Text>
              <Text style={styles.toggleDescription}>
                Require members to pay regular dues to the association
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, duesSettings.enabled && styles.toggleActive]}
              onPress={() => setDuesSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            >
              <View style={[styles.toggleThumb, duesSettings.enabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {duesSettings.enabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dues Amount</Text>
              <View style={styles.inputContainer}>
                <DollarSign color="#666" size={20} />
                <TextInput
                  style={styles.input}
                  value={duesSettings.amount}
                  onChangeText={(text) => setDuesSettings(prev => ({ ...prev, amount: text }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
                <Text style={styles.currencyLabel}>{association?.currency || 'USD'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Frequency</Text>
              <View style={styles.frequencyGrid}>
                {frequencies.map(freq => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyOption,
                      duesSettings.frequency === freq.value && styles.frequencyOptionActive
                    ]}
                    onPress={() => setDuesSettings(prev => ({ ...prev, frequency: freq.value }))}
                  >
                    <Text style={[
                      styles.frequencyText,
                      duesSettings.frequency === freq.value && styles.frequencyTextActive
                    ]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Due Date</Text>
              <Text style={styles.sectionDescription}>
                {duesSettings.frequency === 'monthly' ? 'Day of the month' : 
                 duesSettings.frequency === 'weekly' ? 'Day of the week (1=Monday)' :
                 duesSettings.frequency === 'quarterly' ? 'Day of the quarter start month' :
                 'Day of the year (1-365)'}
              </Text>
              <View style={styles.inputContainer}>
                <Calendar color="#666" size={20} />
                <TextInput
                  style={styles.input}
                  value={duesSettings.dueDate}
                  onChangeText={(text) => setDuesSettings(prev => ({ ...prev, dueDate: text }))}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={duesSettings.description}
                onChangeText={(text) => setDuesSettings(prev => ({ ...prev, description: text }))}
                placeholder="Description for the dues payment"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Users color="#667eea" size={20} />
                  <Text style={styles.previewCardTitle}>Member Dues</Text>
                </View>
                <Text style={styles.previewAmount}>
                  {currencySymbol}{parseFloat(duesSettings.amount || '0').toLocaleString()} / {duesSettings.frequency}
                </Text>
                <Text style={styles.previewDescription}>{duesSettings.description}</Text>
                <Text style={styles.previewDueDate}>
                  Due: {duesSettings.frequency === 'monthly' ? `${duesSettings.dueDate}${getOrdinalSuffix(parseInt(duesSettings.dueDate))} of each month` :
                        duesSettings.frequency === 'weekly' ? `Every ${getDayName(parseInt(duesSettings.dueDate))}` :
                        duesSettings.frequency === 'quarterly' ? `${duesSettings.dueDate}${getOrdinalSuffix(parseInt(duesSettings.dueDate))} of quarter months` :
                        `Day ${duesSettings.dueDate} of each year`}
                </Text>
              </View>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <Save color="#fff" size={16} />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function getDayName(day: number): string {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[day] || 'Monday';
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
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionSection: {
    padding: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#667eea',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  currencyLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    textAlignVertical: 'top',
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  frequencyOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  frequencyTextActive: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  previewAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#667eea',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  previewDueDate: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
});