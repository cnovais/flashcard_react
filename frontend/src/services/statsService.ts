import { api } from './api';

export interface StudyStats {
  totalStudySessions: number;
  totalCardsStudied: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  averageAccuracy: number;
  studyStreak: number;
  longestStreak: number;
  totalStudyTime: number; // in minutes
  averageStudyTime: number; // in minutes
  lastStudyDate: string;
  studyHistory: StudySession[];
}

export interface StudySession {
  id: string;
  deckId: string;
  deckName: string;
  date: string;
  duration: number; // in minutes
  cardsStudied: number;
  correctAnswers: number;
  accuracy: number;
  xpGained: number;
}

export interface DeckStats {
  deckId: string;
  deckName: string;
  totalCards: number;
  cardsStudied: number;
  studySessions: number;
  averageAccuracy: number;
  lastStudied: string;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  tagPerformance: TagPerformance[];
}

export interface TagPerformance {
  tag: string;
  cardsCount: number;
  averageAccuracy: number;
  studyCount: number;
}

export interface ProgressStats {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  achievements: Achievement[];
  levelHistory: LevelProgress[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface LevelProgress {
  level: number;
  xpRequired: number;
  xpGained: number;
  date: string;
}

export interface ExportData {
  userInfo: {
    name: string;
    email: string;
    plan: string;
    joinedAt: string;
  };
  studyStats: StudyStats;
  deckStats: DeckStats[];
  progressStats: ProgressStats;
  exportDate: string;
}

export interface StudyStatsSummary {
  total_study_time: number;
  total_sessions: number;
  total_cards: number;
  average_accuracy: number;
  study_streak: number;
  total_xp: number;
  current_level: number;
  decks_created: number;
  cards_created: number;
  achievements_unlocked: number;
}

export interface StudyStatsByPeriod {
  period: string;
  date: string;
  study_time: number;
  sessions: number;
  cards_reviewed: number;
  accuracy: number;
  xp: number;
}

export interface PerformanceByDifficulty {
  difficulty: string;
  count: number;
  percentage: number;
  average_time: number;
}

export interface DeckPerformance {
  deck_id: string;
  deck_name: string;
  study_time: number;
  sessions: number;
  cards_reviewed: number;
  accuracy: number;
  last_studied?: string;
}

export interface DetailedStats {
  summary: StudyStatsSummary;
  performance_by_difficulty: PerformanceByDifficulty[];
  deck_performance: DeckPerformance[];
  weekly_stats: StudyStatsByPeriod[];
  monthly_stats: StudyStatsByPeriod[];
}

export class StatsService {
  static async getStudyStats(userId: string): Promise<StudyStats> {
    try {
      const response = await api.get(`/api/stats/study?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get study stats:', error);
      throw error;
    }
  }

  static async getDeckStats(userId: string): Promise<DeckStats[]> {
    try {
      const response = await api.get(`/api/stats/decks?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get deck stats:', error);
      throw error;
    }
  }

  static async getProgressStats(userId: string): Promise<ProgressStats> {
    try {
      const response = await api.get(`/api/stats/progress?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get progress stats:', error);
      throw error;
    }
  }

  static async getStudyHistory(userId: string, limit?: number): Promise<StudySession[]> {
    try {
      const params = new URLSearchParams({ userId });
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      const response = await api.get(`/api/stats/history?${params}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get study history:', error);
      throw error;
    }
  }

  static async exportData(userId: string): Promise<ExportData> {
    try {
      const response = await api.get(`/api/stats/export?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  static async getWeeklyProgress(userId: string): Promise<{
    week: string;
    studySessions: number;
    cardsStudied: number;
    accuracy: number;
    xpGained: number;
  }[]> {
    try {
      const response = await api.get(`/api/stats/weekly?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get weekly progress:', error);
      throw error;
    }
  }

  static async getMonthlyProgress(userId: string): Promise<{
    month: string;
    studySessions: number;
    cardsStudied: number;
    accuracy: number;
    xpGained: number;
    studyStreak: number;
  }[]> {
    try {
      const response = await api.get(`/api/stats/monthly?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get monthly progress:', error);
      throw error;
    }
  }

  static async getTagPerformance(userId: string): Promise<TagPerformance[]> {
    try {
      const response = await api.get(`/api/stats/tags?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get tag performance:', error);
      throw error;
    }
  }

  static async getDifficultyStats(userId: string): Promise<{
    easy: { total: number; correct: number; accuracy: number };
    medium: { total: number; correct: number; accuracy: number };
    hard: { total: number; correct: number; accuracy: number };
  }> {
    try {
      const response = await api.get(`/api/stats/difficulty?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get difficulty stats:', error);
      throw error;
    }
  }

  static async getStudyTimeStats(userId: string): Promise<{
    totalTime: number;
    averageTime: number;
    longestSession: number;
    shortestSession: number;
    timeDistribution: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
  }> {
    try {
      const response = await api.get(`/api/stats/time?userId=${userId}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get study time stats:', error);
      throw error;
    }
  }

  // Local calculation helpers
  static calculateAccuracy(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  static calculateStudyStreak(studyHistory: StudySession[]): number {
    if (studyHistory.length === 0) return 0;
    
    const sortedHistory = studyHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedHistory) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      
      const diffTime = currentDate.getTime() - sessionDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  static formatStudyTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  static getPerformanceColor(accuracy: number): string {
    if (accuracy >= 90) return '#4CAF50'; // Green
    if (accuracy >= 70) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  static getDifficultyColor(difficulty: number): string {
    switch (difficulty) {
      case 1: return '#4CAF50'; // Green - Easy
      case 2: return '#FF9800'; // Orange - Medium
      case 3: return '#F44336'; // Red - Hard
      default: return '#9E9E9E'; // Grey
    }
  }

  async getSummary(): Promise<StudyStatsSummary> {
    const response = await api.get('/api/stats/summary');
    return response.json();
  }

  async getStatsByPeriod(period: 'day' | 'week' | 'month', days: number = 30): Promise<StudyStatsByPeriod[]> {
    const response = await api.get(`/api/stats/period?period=${period}&days=${days}`);
    return response.json();
  }

  async getPerformanceByDifficulty(): Promise<PerformanceByDifficulty[]> {
    const response = await api.get('/api/stats/difficulty');
    return response.json();
  }

  async getDeckPerformance(): Promise<DeckPerformance[]> {
    const response = await api.get('/api/stats/decks');
    return response.json();
  }

  async getDetailedStats(): Promise<DetailedStats> {
    const response = await api.get('/api/stats/detailed');
    return response.json();
  }

  // Método para formatar tempo de estudo em formato legível
  formatStudyTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Método para formatar data
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }

  // Método para obter cores para gráficos
  getChartColors(): string[] {
    return [
      '#FF6B6B', // Vermelho
      '#4ECDC4', // Turquesa
      '#45B7D1', // Azul
      '#96CEB4', // Verde
      '#FFEAA7', // Amarelo
      '#DDA0DD', // Roxo
      '#98D8C8', // Verde água
      '#F7DC6F', // Dourado
    ];
  }

  async getTimeDistribution(): Promise<{
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
    total_study_time: number;
    longest_session: number;
    shortest_session: number;
    average_time: number;
  }> {
    try {
      const response = await api.get('/api/stats/time-distribution');
      return response.json();
    } catch (error) {
      console.error('Failed to get time distribution:', error);
      return {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
        total_study_time: 0,
        longest_session: 0,
        shortest_session: 0,
        average_time: 0,
      };
    }
  }
}

export const statsService = new StatsService(); 