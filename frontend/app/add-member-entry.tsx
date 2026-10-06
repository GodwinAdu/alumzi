import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { UserPlus, Upload, Mail, Share2, Zap, Users, Send } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';

export default function AddMemberEntryPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(a => a.id === associationId) || userAssociations?.[0];

  const options = [
    {
      id: 'quick',
      title: 'Quick Add',
      description: 'Add 1-5 members from contacts or manually',
      icon: Zap,
      color: '#667eea',
      route: '/add-member-quick'
    },
    {
      id: 'bulk',
      title: 'Bulk Import',
      description: 'Import 100+ members from CSV/Excel',
      icon: Upload,
      color: '#10b981',
      route: '/add-member-bulk'
    },
    {
      id: 'invite',
      title: 'Send Invitations',
      description: 'Email or SMS invites with tracking',
      icon: Send,
      color: '#f59e0b',
      route: '/add-member-invite'
    },
    {
      id: 'share',
      title: 'Share Link',
      description: 'QR code or shareable join link',
      icon: Share2,
      color: '#8b5cf6',
      route: '/add-member-share'
    }
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Add Members' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Users color="#667eea" size={48} />
          <Text style={styles.title}>How would you like to add members?</Text>
          <Text style={styles.subtitle}>
            Choose the best method for your needs
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => router.push({
                  pathname: option.route,
                  params: { associationId: selectedAssociation?.id }
                })}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                  <Icon color={option.color} size={32} />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Quick Tips</Text>
          <Text style={styles.infoText}>
            • Quick Add: Best for small groups{'\n'}
            • Bulk Import: Upload spreadsheet with member data{'\n'}
            • Invitations: Track who accepted your invite{'\n'}
            • Share Link: Let members join themselves
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
