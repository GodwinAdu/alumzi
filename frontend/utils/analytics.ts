import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

class AnalyticsService {
  private sessionId: string;
  private isEnabled: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadSettings();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadSettings() {
    try {
      const analyticsEnabled = await AsyncStorage.getItem('@privacy_analytics');
      this.isEnabled = analyticsEnabled === 'true';
    } catch (error) {
      console.error('Error loading analytics settings:', error);
      this.isEnabled = false;
    }
  }

  async updateSettings(enabled: boolean) {
    this.isEnabled = enabled;
    await AsyncStorage.setItem('@privacy_analytics', JSON.stringify(enabled));
  }

  private async sendEvent(event: AnalyticsEvent) {
    if (!this.isEnabled) return;

    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const baseURL = Platform.OS === 'android' ? 'http://192.168.1.254:8000/api' : 'http://localhost:8000/api';
      const response = await fetch(`${baseURL}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...event,
          app: 'alumzi-mobile',
          platform: 'react-native'
        })
      });

      if (response.ok) {
        console.log('📊 Analytics event sent to server');
        return;
      }
    } catch (error) {
      console.error('Server unavailable, storing analytics locally:', error.message);
    }

    // Fallback: store locally when server is unavailable
    try {
      const existingEvents = await AsyncStorage.getItem('@analytics_events');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      events.push({
        ...event,
        app: 'alumzi-mobile',
        platform: 'react-native'
      });
      
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await AsyncStorage.setItem('@analytics_events', JSON.stringify(events));
      console.log('📊 Analytics event stored locally');
    } catch (storageError) {
      console.error('Error storing analytics locally:', storageError);
    }
  }

  async trackScreenView(screenName: string) {
    await this.sendEvent({
      event: 'screen_view',
      properties: { screen_name: screenName },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  async trackUserAction(action: string, properties?: Record<string, any>) {
    await this.sendEvent({
      event: 'user_action',
      properties: { action, ...properties },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  async getAnalyticsSummary() {
    try {
      const events = await AsyncStorage.getItem('@analytics_events');
      if (!events) return { totalEvents: 0, eventTypes: [] };

      const parsedEvents = JSON.parse(events);
      const eventTypes = [...new Set(parsedEvents.map((e: AnalyticsEvent) => e.event))];
      
      return {
        totalEvents: parsedEvents.length,
        eventTypes,
        lastEvent: parsedEvents[parsedEvents.length - 1]?.timestamp,
        isEnabled: this.isEnabled
      };
    } catch (error) {
      return { totalEvents: 0, eventTypes: [], isEnabled: this.isEnabled };
    }
  }

  async clearAnalyticsData() {
    try {
      await AsyncStorage.removeItem('@analytics_events');
    } catch (error) {
      console.error('Error clearing analytics data:', error);
    }
  }
}

export const analytics = new AnalyticsService();
export default analytics;