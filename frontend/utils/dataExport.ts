import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { dataCollection } from './dataCollection';
import { analytics } from './analytics';

export class DataExportService {
  async exportUserData() {
    try {
      const userData = await this.collectAllUserData();
      const jsonData = JSON.stringify(userData, null, 2);
      
      const fileName = `alumzi_data_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your Alumzi Data'
        });
      }
      
      return { success: true, fileUri };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  }

  private async collectAllUserData() {
    const [
      authUser,
      collectedData,
      analyticsData,
      privacySettings,
      associations,
      authToken
    ] = await Promise.all([
      AsyncStorage.getItem('@auth_user'),
      dataCollection.getCollectedData(),
      analytics.getAnalyticsSummary(),
      this.getPrivacySettings(),
      AsyncStorage.getItem('@user_associations'),
      AsyncStorage.getItem('@auth_token')
    ]);

    return {
      exportInfo: {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        platform: 'mobile'
      },
      user: authUser ? JSON.parse(authUser) : null,
      associations: associations ? JSON.parse(associations) : [],
      privacySettings,
      collectedData: collectedData || [],
      analytics: {
        ...analyticsData,
        note: 'Analytics data is anonymized and cannot be linked to your identity'
      },
      authentication: {
        hasToken: !!authToken,
        tokenLength: authToken ? authToken.length : 0,
        note: 'Token value is not included for security reasons'
      }
    };
  }

  private async getPrivacySettings() {
    try {
      const [dataCollection, analytics] = await Promise.all([
        AsyncStorage.getItem('@privacy_data_collection'),
        AsyncStorage.getItem('@privacy_analytics')
      ]);

      return {
        dataCollection: dataCollection ? JSON.parse(dataCollection) : true,
        analytics: analytics ? JSON.parse(analytics) : false
      };
    } catch (error) {
      return { dataCollection: true, analytics: false };
    }
  }
}

export const dataExport = new DataExportService();