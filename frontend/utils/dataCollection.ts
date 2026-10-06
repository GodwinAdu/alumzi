import AsyncStorage from '@react-native-async-storage/async-storage';

class DataCollectionService {
  private isEnabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const dataCollectionEnabled = await AsyncStorage.getItem('@privacy_data_collection');
      this.isEnabled = dataCollectionEnabled !== 'false';
    } catch (error) {
      console.error('Error loading data collection settings:', error);
      this.isEnabled = true;
    }
    this.initialized = true;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.loadSettings();
    }
  }

  async updateSettings(enabled: boolean) {
    await this.ensureInitialized();
    this.isEnabled = enabled;
    await AsyncStorage.setItem('@privacy_data_collection', JSON.stringify(enabled));
    
    if (!enabled) {
      console.log('🚫 Data collection disabled - clearing stored data');
      await this.clearCollectedData();
    } else {
      console.log('✅ Data collection enabled');
    }
  }

  async collectData(type: string, data: any) {
    await this.ensureInitialized();
    if (!this.isEnabled) return;

    try {
      const existingData = await AsyncStorage.getItem('@collected_data');
      const collectedData = existingData ? JSON.parse(existingData) : [];
      
      collectedData.push({
        type,
        data,
        timestamp: Date.now(),
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      if (collectedData.length > 500) {
        collectedData.splice(0, collectedData.length - 500);
      }

      await AsyncStorage.setItem('@collected_data', JSON.stringify(collectedData));
      console.log(`📊 Data collected: ${type}`);
    } catch (error) {
      console.error('Error collecting data:', error);
    }
  }

  async getCollectedData() {
    try {
      const data = await AsyncStorage.getItem('@collected_data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting collected data:', error);
      return [];
    }
  }

  async clearCollectedData() {
    try {
      await AsyncStorage.removeItem('@collected_data');
    } catch (error) {
      console.error('Error clearing collected data:', error);
    }
  }

  async isDataCollectionEnabled(): Promise<boolean> {
    await this.ensureInitialized();
    return this.isEnabled;
  }
}

export const dataCollection = new DataCollectionService();
export default dataCollection;