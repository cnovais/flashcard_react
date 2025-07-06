import { api } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: 'limit_warning' | 'limit_reached' | 'achievement' | 'study_reminder' | 'premium_offer';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationPreferences {
  userId: string;
  limitWarnings: boolean;
  studyReminders: boolean;
  achievements: boolean;
  premiumOffers: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export class NotificationService {
  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const response = await api.get(`/api/notifications?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await api.put(`/api/notifications/read-all?userId=${userId}`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const response = await api.get(`/api/notifications/preferences?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  static async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await api.put('/api/notifications/preferences', preferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // Local notification helpers
  static showLimitWarning(current: number, limit: number, type: 'decks' | 'cards') {
    const percentage = (current / limit) * 100;
    
    if (percentage >= 80) {
      const message = percentage >= 100 
        ? `Você atingiu o limite de ${limit} ${type}. Faça upgrade para Premium para continuar criando!`
        : `Você está próximo do limite de ${limit} ${type} (${current}/${limit}). Considere fazer upgrade para Premium.`;
      
      return {
        type: percentage >= 100 ? 'limit_reached' : 'limit_warning' as const,
        title: percentage >= 100 ? 'Limite Atingido' : 'Limite Próximo',
        message,
        showUpgradeButton: true,
      };
    }
    
    return null;
  }

  static showStudyReminder(daysSinceLastStudy: number) {
    if (daysSinceLastStudy >= 3) {
      return {
        type: 'study_reminder' as const,
        title: 'Hora de Estudar!',
        message: `Você não estuda há ${daysSinceLastStudy} dias. Mantenha sua rotina de estudos!`,
        showStudyButton: true,
      };
    }
    
    return null;
  }

  static showAchievement(achievement: { name: string; description: string }) {
    return {
      type: 'achievement' as const,
      title: 'Conquista Desbloqueada!',
      message: `${achievement.name}: ${achievement.description}`,
      showCelebration: true,
    };
  }

  static showPremiumOffer(userLevel: number, studyStreak: number) {
    if (userLevel >= 5 || studyStreak >= 7) {
      return {
        type: 'premium_offer' as const,
        title: 'Oferta Especial Premium!',
        message: 'Parabéns pelo seu progresso! Desbloqueie recursos exclusivos com 50% de desconto.',
        showDiscount: true,
        discountPercentage: 50,
      };
    }
    
    return null;
  }
} 