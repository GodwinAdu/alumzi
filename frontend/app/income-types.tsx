import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Edit3, Trash2, DollarSign, Lock } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAssociation } from '@/contexts/AssociationContext';
import { useSubscription } from '@/hooks/useSubscription';

type IncomeType = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

export default function IncomeTypesPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const { limits, plan } = useSubscription();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId);
  
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<IncomeType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadIncomeTypes();
  }, [associationId]);

  const loadIncomeTypes = async () => {
    if (!associationId) return;
    
    try {
      const response = await apiService.getIncomeTypes(associationId as string);
      let types = response.incomeTypes || [];
      
      // Add default types for free users if no custom types exist
      if (!limits.hasCustomTypes && types.length === 0) {
        types = [
          { id: 'default-1', name: 'Member Contributions', description: 'Regular member dues and contributions', isActive: true },
          { id: 'default-2', name: 'Other Income', description: 'Miscellaneous income sources', isActive: true }
        ];
      }
      
      setIncomeTypes(types);
    } catch (error) {
      console.error('Failed to load income types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (type?: IncomeType) => {
    if (!limits.hasCustomTypes) {
      Alert.alert(
        'Upgrade Required',
        'Custom income types are available on Pro and Enterprise plans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/subscription-settings') }
        ]
      );
      return;
    }
    
    if (type) {
      setEditingType(type);
      setName(type.name);
      setDescription(type.description || '');
    } else {
      setEditingType(null);
      setName('');
      setDescription('');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingType(null);
    setName('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingType) {
        await apiService.updateIncomeType(associationId as string, editingType.id, {
          name: name.trim(),
          description: description.trim() || undefined
        });
      } else {
        await apiService.createIncomeType(associationId as string, {
          name: name.trim(),
          description: description.trim() || undefined
        });
      }
      
      closeModal();
      loadIncomeTypes();
    } catch (error) {
      Alert.alert('Error', 'Failed to save income type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (type: IncomeType) => {
    Alert.alert(
      'Delete Income Type',
      `Are you sure you want to delete "${type.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteIncomeType(associationId as string, type.id);
              loadIncomeTypes();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete income type');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Income Types',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => openModal()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Plus color={limits.hasCustomTypes ? "#667eea" : "#ccc"} size={24} />
              {!limits.hasCustomTypes && <Lock color="#f59e0b" size={16} />}
            </View>
          </TouchableOpacity>
        )
      }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Income Categories</Text>
          <Text style={styles.subtitle}>{selectedAssociation?.name}</Text>
        </View>

        {!limits.hasCustomTypes && incomeTypes.length > 0 && (
          <View style={styles.upgradePrompt}>
            <Lock color="#f59e0b" size={48} />
            <Text style={styles.upgradeTitle}>Using Default Categories</Text>
            <Text style={styles.upgradeText}>
              You have 2 default income categories. Upgrade to create unlimited custom categories.
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription-settings')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to {plan === 'free' ? 'Pro' : 'Enterprise'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.typesList}>
          {incomeTypes.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign color="#ccc" size={48} />
              <Text style={styles.emptyTitle}>No Income Types</Text>
              <Text style={styles.emptyText}>
                {limits.hasCustomTypes 
                  ? 'Create income categories to organize your revenue'
                  : 'Using default income categories. Upgrade to create custom types.'
                }
              </Text>
              {limits.hasCustomTypes && (
                <TouchableOpacity style={styles.createButton} onPress={() => openModal()}>
                  <Plus color="#fff" size={20} />
                  <Text style={styles.createButtonText}>Create First Type</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            incomeTypes.map(type => {
              const typeId = type.id || type._id || 'unknown';
              const isDefault = typeId.toString().startsWith('default-');
              
              return (
                <View key={typeId} style={styles.typeCard}>
                  <View style={styles.typeIcon}>
                    <DollarSign color="#10b981" size={20} />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    {type.description && (
                      <Text style={styles.typeDescription}>{type.description}</Text>
                    )}
                  </View>
                  {limits.hasCustomTypes && !isDefault && (
                    <View style={styles.typeActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openModal(type)}
                      >
                        <Edit3 color="#666" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(type)}
                      >
                        <Trash2 color="#ef4444" size={16} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingType ? 'Edit' : 'Create'} Income Type
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                <Text style={[styles.modalSave, isSaving && styles.modalSaveDisabled]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Membership Fees"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Optional description..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>
        </Modal>
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
    color: '#10b981',
    fontWeight: '600' as const,
  },
  typesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
  },
  typeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
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
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  modalSave: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  upgradePrompt: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  defaultBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600' as const,
  },
});