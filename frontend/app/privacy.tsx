import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Eye, Database, Download, Trash2, ChevronRight, FileText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { analytics } from '@/utils/analytics';
import { dataCollection } from '@/utils/dataCollection';
import { dataExport } from '@/utils/dataExport';
import { accountDeletion } from '@/utils/accountDeletion';

export default function PrivacyPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [dataCollectionEnabled, setDataCollectionEnabled] = React.useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const dataCollectionSetting = await AsyncStorage.getItem('@privacy_data_collection');
      const analyticsSetting = await AsyncStorage.getItem('@privacy_analytics');
      
      if (dataCollectionSetting !== null) {
        setDataCollectionEnabled(JSON.parse(dataCollectionSetting));
      }
      if (analyticsSetting !== null) {
        setAnalyticsEnabled(JSON.parse(analyticsSetting));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const savePrivacySetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving privacy setting:', error);
    }
  };

  const handleDataCollectionToggle = async (value: boolean) => {
    setDataCollectionEnabled(value);
    savePrivacySetting('@privacy_data_collection', value);
    
    // Update data collection service
    await dataCollection.updateSettings(value);
    
    if (value) {
      console.log('📊 Data collection enabled');
    } else {
      console.log('🚫 Data collection disabled - clearing data');
    }
  };

  const handleAnalyticsToggle = async (value: boolean) => {
    setAnalyticsEnabled(value);
    savePrivacySetting('@privacy_analytics', value);
    
    // Update analytics service
    await analytics.updateSettings(value);
    
    if (value) {
      console.log('📊 Analytics enabled');
      await analytics.trackUserAction('analytics_enabled');
    } else {
      console.log('📊 Analytics disabled - clearing data');
      await analytics.clearAnalyticsData();
    }
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download My Data',
      'This will create a JSON file with all your data stored in the app. You can then share or save it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export Data', 
          onPress: async () => {
            setLoading(true);
            try {
              const result = await dataExport.exportUserData();
              if (result.success) {
                Alert.alert('Export Complete', 'Your data has been exported successfully. You can now share or save the file.');
              } else {
                Alert.alert('Export Failed', `Failed to export data: ${result.error}`);
              }
            } catch (error) {
              Alert.alert('Export Error', 'An unexpected error occurred while exporting your data.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will delete all your data including:\n• Profile information\n• Association memberships\n• Chat messages\n• Analytics data\n\nThis cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Forever', 
                  style: 'destructive',
                  onPress: async () => {
                    setLoading(true);
                    try {
                      const result = await accountDeletion.deleteAccount();
                      await signOut();
                      
                      if (result.success) {
                        Alert.alert('Account Deleted', 'Your account and all data have been permanently deleted.');
                      } else {
                        Alert.alert('Account Deleted', 'Your local data has been cleared. Server deletion may have failed but will be retried.');
                      }
                      
                      router.replace('/');
                    } catch (error) {
                      Alert.alert('Deletion Error', 'An error occurred during account deletion. Local data has been cleared.');
                      await signOut();
                      router.replace('/');
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const privacyOptions = [
    {
      icon: Eye,
      title: 'Data Collection',
      description: 'Allow app to collect usage data',
      type: 'toggle',
      value: dataCollectionEnabled,
      onToggle: handleDataCollectionToggle,
    },
    {
      icon: Database,
      title: 'Analytics',
      description: 'Help improve the app with anonymous analytics',
      type: 'toggle',
      value: analyticsEnabled,
      onToggle: handleAnalyticsToggle,
    },
    {
      icon: Download,
      title: 'Download My Data',
      description: 'Get a copy of your personal data',
      type: 'action',
      onPress: handleDownloadData,
    },
    {
      icon: Trash2,
      title: 'Delete Account',
      description: 'Permanently delete your account and data',
      type: 'action',
      danger: true,
      onPress: handleDeleteAccount,
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
        <Text style={styles.title}>Privacy</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.optionsList}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => router.push('/privacy-policy')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <FileText color="#667eea" size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Privacy Policy</Text>
                  <Text style={styles.optionDescription}>Read our privacy policy</Text>
                </View>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>
            {privacyOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.optionItem,
                  index === privacyOptions.length - 1 && styles.lastItem
                ]}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, option.danger && styles.dangerIcon]}>
                    <option.icon color={option.danger ? "#ef4444" : "#667eea"} size={20} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, option.danger && styles.dangerText]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
                <View style={styles.optionRight}>
                  {option.type === 'toggle' ? (
                    <Switch
                      value={option.value}
                      onValueChange={option.onToggle}
                      trackColor={{ false: '#e0e0e0', true: '#667eea' }}
                      thumbColor="#fff"
                    />
                  ) : (
                    <ChevronRight color="#999" size={20} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your Privacy Matters</Text>
          <Text style={styles.infoText}>
            We are committed to protecting your privacy and giving you control over your data. 
            You can adjust these settings at any time to match your preferences.
          </Text>
        </View>

        {analyticsEnabled && (
          <View style={styles.analyticsInfo}>
            <Text style={styles.analyticsTitle}>What Analytics Collects</Text>
            <Text style={styles.analyticsBullet}>• Screen views and navigation patterns</Text>
            <Text style={styles.analyticsBullet}>• Feature usage (which buttons you tap)</Text>
            <Text style={styles.analyticsBullet}>• Performance metrics (app speed)</Text>
            <Text style={styles.analyticsBullet}>• Error reports (crashes and bugs)</Text>
            <Text style={styles.analyticsNote}>
              ℹ️ All data is anonymous and cannot be linked to your identity
            </Text>
          </View>
        )}

        {user && (
          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoTitle}>Account Information</Text>
            <Text style={styles.userInfoText}>Email: {user.email || 'Not provided'}</Text>
            <Text style={styles.userInfoText}>Phone: {user.phoneNumber || 'Not provided'}</Text>
            <Text style={styles.userInfoText}>Name: {user.name}</Text>
          </View>
        )}
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
    paddingTop: 60,
    padding: 24,
    paddingBottom: 16,
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
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
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
  optionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: {
    backgroundColor: '#fef2f2',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  dangerText: {
    color: '#ef4444',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4338ca',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4338ca',
    lineHeight: 20,
  },
  userInfoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  analyticsInfo: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4338ca',
    marginBottom: 12,
  },
  analyticsBullet: {
    fontSize: 14,
    color: '#4338ca',
    marginBottom: 4,
    marginLeft: 8,
  },
  analyticsNote: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 8,
    fontStyle: 'italic',
  },
});