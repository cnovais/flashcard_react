import { api } from './api';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'achievement' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  xpReward: number;
  unlockedAt?: string;
}

export interface BadgeRequirement {
  type: 'cards_created' | 'cards_reviewed' | 'study_sessions' | 'streak_days' | 'perfect_scores' | 'decks_shared';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'challenge' | 'special';
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: string;
  xpReward: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  badges: number;
  achievements: number;
  studyStreak: number;
}

export interface UserStats {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  studyStreak: number;
  longestStreak: number;
  totalCardsCreated: number;
  totalCardsReviewed: number;
  totalStudySessions: number;
  perfectScores: number;
  badges: Badge[];
  achievements: Achievement[];
  rank: number;
  totalUsers: number;
}

export class GamificationService {
  private static instance: GamificationService;

  static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get('/api/gamification/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw error;
    }
  }

  async getBadges(): Promise<Badge[]> {
    try {
      const response = await api.get('/api/gamification/badges');
      return response.data;
    } catch (error) {
      console.error('Failed to get badges:', error);
      return [];
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await api.get('/api/gamification/achievements');
      return response.data;
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  async getLeaderboard(category: 'global' | 'weekly' | 'monthly' = 'global'): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get(`/api/gamification/leaderboard?category=${category}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  async recordStudySession(sessionData: {
    deckId: string;
    cardsReviewed: number;
    correctAnswers: number;
    timeSpent: number;
    streakBonus: number;
  }): Promise<{
    xpGained: number;
    newBadges: Badge[];
    newAchievements: Achievement[];
    levelUp: boolean;
    newLevel?: number;
  }> {
    try {
      const response = await api.post('/api/gamification/study-session', sessionData);
      return response.data;
    } catch (error) {
      console.error('Failed to record study session:', error);
      throw error;
    }
  }

  async recordCardCreation(deckId: string): Promise<{
    xpGained: number;
    newBadges: Badge[];
    newAchievements: Achievement[];
  }> {
    try {
      const response = await api.post('/api/gamification/card-created', { deckId });
      return response.data;
    } catch (error) {
      console.error('Failed to record card creation:', error);
      throw error;
    }
  }

  async recordDeckShared(deckId: string): Promise<{
    xpGained: number;
    newBadges: Badge[];
  }> {
    try {
      const response = await api.post('/api/gamification/deck-shared', { deckId });
      return response.data;
    } catch (error) {
      console.error('Failed to record deck shared:', error);
      throw error;
    }
  }

  async claimDailyReward(): Promise<{
    xpGained: number;
    streakBonus: number;
    newBadges: Badge[];
  }> {
    try {
      const response = await api.post('/api/gamification/daily-reward');
      return response.data;
    } catch (error) {
      console.error('Failed to claim daily reward:', error);
      throw error;
    }
  }

  async getDailyRewardStatus(): Promise<{
    canClaim: boolean;
    nextClaimTime: string;
    currentStreak: number;
    streakBonus: number;
  }> {
    try {
      const response = await api.get('/api/gamification/daily-reward/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get daily reward status:', error);
      throw error;
    }
  }

  async getWeeklyChallenges(): Promise<{
    challenges: Array<{
      id: string;
      name: string;
      description: string;
      progress: number;
      maxProgress: number;
      xpReward: number;
      completed: boolean;
    }>;
    weekNumber: number;
    endsAt: string;
  }> {
    try {
      const response = await api.get('/api/gamification/weekly-challenges');
      return response.data;
    } catch (error) {
      console.error('Failed to get weekly challenges:', error);
      throw error;
    }
  }

  async getSeasonalEvents(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    specialBadges: Badge[];
    specialRewards: Array<{
      type: 'xp' | 'badge' | 'theme' | 'avatar';
      value: any;
    }>;
  }>> {
    try {
      const response = await api.get('/api/gamification/seasonal-events');
      return response.data;
    } catch (error) {
      console.error('Failed to get seasonal events:', error);
      return [];
    }
  }

  async getFriendsLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const response = await api.get('/api/gamification/friends-leaderboard');
      return response.data;
    } catch (error) {
      console.error('Failed to get friends leaderboard:', error);
      return [];
    }
  }

  async challengeFriend(friendId: string, challengeType: 'study_race' | 'card_creation' | 'streak_competition'): Promise<{
    challengeId: string;
    expiresAt: string;
  }> {
    try {
      const response = await api.post('/api/gamification/challenge-friend', {
        friendId,
        challengeType,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to challenge friend:', error);
      throw error;
    }
  }

  async acceptChallenge(challengeId: string): Promise<void> {
    try {
      await api.post(`/api/gamification/challenges/${challengeId}/accept`);
    } catch (error) {
      console.error('Failed to accept challenge:', error);
      throw error;
    }
  }

  async getActiveChallenges(): Promise<Array<{
    id: string;
    type: 'study_race' | 'card_creation' | 'streak_competition';
    challenger: {
      id: string;
      username: string;
      avatar?: string;
    };
    challenged: {
      id: string;
      username: string;
      avatar?: string;
    };
    progress: {
      challenger: number;
      challenged: number;
    };
    expiresAt: string;
    winner?: string;
  }>> {
    try {
      const response = await api.get('/api/gamification/active-challenges');
      return response.data;
    } catch (error) {
      console.error('Failed to get active challenges:', error);
      return [];
    }
  }

  async getBadgeProgress(badgeId: string): Promise<{
    progress: number;
    maxProgress: number;
    percentage: number;
    requirements: Array<{
      type: string;
      current: number;
      required: number;
      completed: boolean;
    }>;
  }> {
    try {
      const response = await api.get(`/api/gamification/badges/${badgeId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Failed to get badge progress:', error);
      throw error;
    }
  }

  async getAchievementProgress(achievementId: string): Promise<{
    progress: number;
    maxProgress: number;
    percentage: number;
    timeRemaining?: string;
  }> {
    try {
      const response = await api.get(`/api/gamification/achievements/${achievementId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Failed to get achievement progress:', error);
      throw error;
    }
  }

  async shareAchievement(achievementId: string, platform: 'twitter' | 'facebook' | 'whatsapp'): Promise<void> {
    try {
      await api.post(`/api/gamification/achievements/${achievementId}/share`, { platform });
    } catch (error) {
      console.error('Failed to share achievement:', error);
      throw error;
    }
  }

  async getGamificationHistory(): Promise<Array<{
    type: 'xp_gained' | 'badge_earned' | 'achievement_completed' | 'level_up' | 'challenge_won';
    description: string;
    timestamp: string;
    xpChange?: number;
    badge?: Badge;
    achievement?: Achievement;
  }>> {
    try {
      const response = await api.get('/api/gamification/history');
      return response.data;
    } catch (error) {
      console.error('Failed to get gamification history:', error);
      return [];
    }
  }

  // Helper methods for calculating XP and levels
  calculateXPForLevel(level: number): number {
    // Exponential growth: each level requires more XP
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    let xpNeeded = 0;
    
    while (xpNeeded <= totalXP) {
      xpNeeded += this.calculateXPForLevel(level);
      level++;
    }
    
    return level - 1;
  }

  calculateProgressToNextLevel(totalXP: number): {
    currentLevel: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
  } {
    const currentLevel = this.calculateLevelFromXP(totalXP);
    let xpInCurrentLevel = totalXP;
    
    // Subtract XP from previous levels
    for (let i = 1; i < currentLevel; i++) {
      xpInCurrentLevel -= this.calculateXPForLevel(i);
    }
    
    const nextLevelXP = this.calculateXPForLevel(currentLevel);
    const progress = (xpInCurrentLevel / nextLevelXP) * 100;
    
    return {
      currentLevel,
      currentLevelXP: xpInCurrentLevel,
      nextLevelXP,
      progress,
    };
  }
}

// Export singleton instance
export const gamificationService = GamificationService.getInstance(); 