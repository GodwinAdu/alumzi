import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { dataCollection } from './dataCollection';
import { analytics } from './analytics';

export class AccountDeletionService {
  async deleteAccount() {
    try {
      // Call backend to delete account
      const token = await AsyncStorage.getItem('@auth_token');
      const baseURL = Platform.OS === 'android' ? 'http://192.168.1.254:8000/api' : 'http://localhost:8000/api';
      
      const response = await fetch(`${baseURL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account on server');
      }

      // Clear all local data
      await this.clearAllLocalData();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      
      // Even if server deletion fails, clear local data
      await this.clearAllLocalData();
      
      return { success: false, error: error.message };
    }
  }

  private async clearAllLocalData() {
    try {
      console.log('🗑️ Starting complete local data wipe...');
      
      // Get all AsyncStorage keys and remove them
      const keys = await AsyncStorage.getAllKeys();
      console.log(`Found ${keys.length} storage keys to clear`);
      
      await AsyncStorage.multiRemove(keys);
      
      // Clear service-specific data
      await Promise.all([
        analytics.clearAnalyticsData(),
        dataCollection.clearCollectedData()
      ]);
      
      // Verify all data is cleared
      const remainingKeys = await AsyncStorage.getAllKeys();
      
      if (remainingKeys.length === 0) {
        console.log('✅ All local data successfully cleared');
      } else {
        console.warn(`⚠️ ${remainingKeys.length} keys remain:`, remainingKeys);
        // Force clear any remaining keys
        await AsyncStorage.multiRemove(remainingKeys);
      }
      
    } catch (error) {
      console.error('Error clearing local data:', error);
      
      // Fallback: try to clear critical keys individually
      const criticalKeys = [
        '@auth_token', '@auth_user', '@user_associations',
        '@privacy_data_collection', '@privacy_analytics',
        '@analytics_events', '@collected_data'
      ];
      
      for (const key of criticalKeys) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (keyError) {
          console.error(`Failed to clear ${key}:`, keyError);
        }
      }
    }
  }
}

export const accountDeletion = new AccountDeletionService();