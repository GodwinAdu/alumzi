import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Users, Search, ArrowLeft, Building2, Bell, Shield, AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardSkeleton, ListItemSkeleton } from '@/components/SkeletonLoader';

const ENTERED_ASSOCIATION_KEY = '@entered_association';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const { userAssociations, isLoadingAssociations, selectAssociation, selectedAssociation } = useAssociation();
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = isAuthenticated ? (unreadData?.unreadCount || 0) : 0;
  
  // Initialize WebSocket for real-time notifications (hook handles auth internally)
  useWebSocket();
  const associations = userAssociations || [];
  const [hasEnteredAssociation, setHasEnteredAssociation] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2FA, setLoading2FA] = useState(true);

  console.log('HomePage - isAuthenticated:', isAuthenticated);
  console.log('HomePage - userAssociations:', userAssociations);
  console.log('HomePage - isLoadingAssociations:', isLoadingAssociations);
  console.log('HomePage - associations length:', associations.length);

  useEffect(() => {
    const checkEnteredState = async () => {
      const entered = await AsyncStorage.getItem(ENTERED_ASSOCIATION_KEY);
      setHasEnteredAssociation(entered === 'true');
      
      if (entered === 'true') {
        const selectedId = await AsyncStorage.getItem('@selected_association');
        if (selectedId && associations.length > 0) {
          await selectAssociation(selectedId);
        }
      }
    };
    checkEnteredState();
  }, [associations]);

  useEffect(() => {
    if (isAuthenticated) {
      check2FAStatus();
    }
  }, [isAuthenticated]);

  const check2FAStatus = async () => {
    try {
      const response = await api.get2FAStatus();
      setTwoFactorEnabled(response.enabled);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setLoading2FA(false);
    }
  };

  // Check if user is admin in any association that requires 2FA
  const needsTwoFactor = () => {
    if (loading2FA || twoFactorEnabled) return false;
    
    return associations.some((association: any) => 
      (association.role === 'admin' || association.role === 'moderator') &&
      association.settings?.security?.requireTwoFactorForAdmins
    );
  };

  const handleExitAssociation = async () => {
    await AsyncStorage.setItem(ENTERED_ASSOCIATION_KEY, 'false');
    await AsyncStorage.removeItem('@selected_association');
    setHasEnteredAssociation(false);
  };

  const handleEnterAssociation = async (associationId: string) => {
    console.log('Entering association with ID:', associationId);
    
    try {
      await selectAssociation(associationId);
      await AsyncStorage.setItem(ENTERED_ASSOCIATION_KEY, 'true');
      setHasEnteredAssociation(true);
      router.replace('/(association-tabs)/dashboard');
    } catch (error) {
      console.error('Error selecting association:', error);
    }
  };

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Circlr</Text>
            <Text style={styles.subtitle}>Manage your circle finances with transparency</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/sign-in')}
            >
              <View style={styles.actionIcon}>
                <Users color="#667eea" size={32} />
              </View>
              <Text style={styles.actionTitle}>Sign In</Text>
              <Text style={styles.actionDescription}>Access your account and associations</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Key Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Users color="#10b981" size={20} />
                <Text style={styles.featureText}>Member Management</Text>
              </View>
              <View style={styles.featureItem}>
                <Building2 color="#10b981" size={20} />
                <Text style={styles.featureText}>Financial Transparency</Text>
              </View>
              <View style={styles.featureItem}>
                <Plus color="#10b981" size={20} />
                <Text style={styles.featureText}>Income & Expense Tracking</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // If user has entered an association, redirect to association tabs
  // if (hasEnteredAssociation && selectedAssociation) {
  //   router.replace('/(association-tabs)/home');
  //   return null;
  // }

  // If authenticated but not in association, show main home
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Welcome back, {user?.name}!</Text>
              <Text style={styles.subtitle}>Your association dashboard</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell color="#667eea" size={24} />
              {isAuthenticated && unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Overview</Text>
          {isLoadingAssociations ? (
            <CardSkeleton />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{associations.length}</Text>
                <Text style={styles.statLabel}>Associations</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{associations.filter((a: any) => a.role === 'admin').length}</Text>
                <Text style={styles.statLabel}>Admin Role</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{associations.filter((a: any) => a.status === 'active').length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>
          )}
        </View>

        {needsTwoFactor() && (
          <TouchableOpacity 
            style={styles.securityAlert}
            onPress={() => router.push('/setup-2fa')}
          >
            <View style={styles.alertIcon}>
              <AlertTriangle color="#f59e0b" size={20} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Two-Factor Authentication Required</Text>
              <Text style={styles.alertText}>
                Some associations require 2FA for admin access. Set it up now to maintain access.
              </Text>
            </View>
            <Shield color="#f59e0b" size={20} />
          </TouchableOpacity>
        )}

        {isLoadingAssociations ? (
          <View style={styles.associationsList}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Associations</Text>
              <TouchableOpacity onPress={() => router.push('/(auth-tabs)/create')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </View>
        ) : associations.length > 0 ? (
          <View style={styles.associationsList}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Associations</Text>
              <TouchableOpacity onPress={() => router.push('/(auth-tabs)/create')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {associations.slice(0, 3).map((association: any) => (
              <TouchableOpacity 
                key={association.id}
                style={styles.associationCard}
                onPress={() => handleEnterAssociation(association.id)}
              >
                <View style={styles.associationIcon}>
                  <Building2 color="#667eea" size={24} />
                </View>
                <View style={styles.associationDetails}>
                  <Text style={styles.associationCardName}>{association.name}</Text>
                  <Text style={styles.associationCardCode}>Code: {association.code}</Text>
                  <Text style={styles.associationRole}>{association.role || 'Member'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Building2 color="#ccc" size={48} />
            <Text style={styles.emptyTitle}>No Associations Yet</Text>
            <Text style={styles.emptyText}>Create or join an association to get started</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/(auth-tabs)/create')}
            >
              <Text style={styles.emptyButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>No recent activity</Text>
          </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
    flex: 1,
    marginRight: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  associationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  associationInfo: {
    flex: 1,
  },
  associationName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  associationCode: {
    fontSize: 14,
    color: '#666',
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  associationsList: {
    marginBottom: 32,
  },
  associationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    gap: 16,
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
  associationCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  associationCardCode: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  associationRole: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500' as const,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  recentActivity: {
    marginBottom: 32,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: '#666',
  },
  features: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500' as const,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 32,
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
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  securityAlert: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400e',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
});