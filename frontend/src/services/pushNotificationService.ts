import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: string;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  badge?: number;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      this.expoPushToken = token.data;
      console.log('Expo push token:', token.data);

      // Register token with backend
      await this.registerTokenWithBackend(token.data);

      // Set up notification listeners
      this.setupNotificationListeners();

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/api/notifications/register-token', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register token with backend:', error);
    }
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // Handle the notification (e.g., update UI, show toast, etc.)
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // Handle the notification tap (e.g., navigate to specific screen)
      this.handleNotificationTap(response);
    });
  }

  private handleNotificationTap(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case 'study_reminder':
        // Navigate to study screen
        break;
      case 'achievement':
        // Navigate to achievements screen
        break;
      case 'limit_warning':
        // Navigate to premium screen
        break;
      default:
        // Default handling
        break;
    }
  }

  async scheduleLocalNotification(notification: NotificationData, trigger?: any): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound,
          badge: notification.badge,
        },
        trigger: trigger || null, // null means show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  async scheduleStudyReminder(hour: number, minute: number): Promise<string> {
    return this.scheduleLocalNotification(
      {
        title: 'Hora de Estudar! 📚',
        body: 'Mantenha sua rotina de estudos. Que tal revisar alguns cards?',
        data: { type: 'study_reminder' },
        sound: true,
      },
      {
        hour,
        minute,
        repeats: true,
      }
    );
  }

  async scheduleDailyReminder(): Promise<string> {
    return this.scheduleStudyReminder(9, 0); // 9:00 AM daily
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async sendTestNotification(): Promise<void> {
    await this.scheduleLocalNotification({
      title: 'Teste de Notificação',
      body: 'Esta é uma notificação de teste!',
      sound: true,
    });
  }

  // Backend notification methods
  async sendNotificationToUser(userId: string, notification: NotificationData): Promise<void> {
    try {
      await api.post('/api/notifications/send', {
        userId,
        notification,
      });
    } catch (error) {
      console.error('Failed to send notification to user:', error);
    }
  }

  async sendNotificationToAllUsers(notification: NotificationData): Promise<void> {
    try {
      await api.post('/api/notifications/send-all', {
        notification,
      });
    } catch (error) {
      console.error('Failed to send notification to all users:', error);
    }
  }

  async getNotificationHistory(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/api/notifications/history?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async updateNotificationPreferences(userId: string, preferences: {
    studyReminders: boolean;
    achievements: boolean;
    limitWarnings: boolean;
    dailyDigest: boolean;
  }): Promise<void> {
    try {
      await api.put('/api/notifications/preferences', {
        userId,
        preferences,
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance(); 