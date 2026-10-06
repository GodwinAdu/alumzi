import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Search, Building2, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENTERED_ASSOCIATION_KEY = '@entered_association';

export default function AssociationsPage() {
  const { userAssociations } = useAssociation();
  const associations = userAssociations || [];

  const handleEnterAssociation = async (associationId: string) => {
    await AsyncStorage.setItem(ENTERED_ASSOCIATION_KEY, 'true');
    await AsyncStorage.setItem('@selected_association', associationId);
    router.replace('/(association-tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Associations</Text>
          <Text style={styles.subtitle}>Manage your associations or create new ones</Text>
        </View>

        {associations.length > 0 && (
          <View style={styles.associationsSection}>
            <Text style={styles.sectionTitle}>Your Associations</Text>
            {associations.map(association => (
              <TouchableOpacity 
                key={association.id}
                style={styles.associationCard}
                onPress={() => handleEnterAssociation(association.id)}
              >
                <View style={styles.associationIcon}>
                  <Building2 color="#667eea" size={24} />
                </View>
                <View style={styles.associationDetails}>
                  <Text style={styles.associationName}>{association.name}</Text>
                  <Text style={styles.associationCode}>Code: {association.code}</Text>
                  <Text style={styles.associationType}>
                    {association.type === 'school' ? 'School/Alumni' : 'Community'}
                  </Text>
                </View>
                <ChevronRight color="#999" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/create-association')}
          >
            <View style={styles.actionIcon}>
              <Plus color="#667eea" size={32} />
            </View>
            <Text style={styles.actionTitle}>Create Association</Text>
            <Text style={styles.actionDescription}>Start a new association and invite members</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/join')}
          >
            <View style={styles.actionIcon}>
              <Search color="#667eea" size={32} />
            </View>
            <Text style={styles.actionTitle}>Join Association</Text>
            <Text style={styles.actionDescription}>Find and join an existing association</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  associationsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  associationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  associationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  associationDetails: {
    flex: 1,
  },
  associationName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  associationCode: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 2,
  },
  associationType: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});