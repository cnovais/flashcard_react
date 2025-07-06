import { api } from './api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    decks: number;
    cardsPerDeck: number;
  };
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export class PlanService {
  static async getPlans(): Promise<Plan[]> {
    try {
      const response = await api.get('/api/plans');
      return response.data;
    } catch (error) {
      console.error('Failed to get plans:', error);
      throw error;
    }
  }

  static async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get('/api/subscription');
      return response.data;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  static async upgradeToPremium(planId: string): Promise<{ checkoutUrl: string }> {
    try {
      const response = await api.post('/api/subscription/create', { planId });
      return response.data;
    } catch (error) {
      console.error('Failed to upgrade to premium:', error);
      throw error;
    }
  }

  static async cancelSubscription(): Promise<void> {
    try {
      await api.post('/api/subscription/cancel');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  static async reactivateSubscription(): Promise<void> {
    try {
      await api.post('/api/subscription/reactivate');
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }
} 