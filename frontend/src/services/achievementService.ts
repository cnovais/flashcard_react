import { api } from './api';

export interface Achievement {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition: {
    type: string;
    operator: string;
    value: number;
    time_frame: string;
  };
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  target: number;
  xp: number;
  created_at: string;
  updated_at: string;
}

export interface AchievementCheckResponse {
  newly_unlocked: Achievement[];
  count: number;
}

class AchievementService {
  async getUserAchievements(): Promise<Achievement[]> {
    const response = await api.get('/api/gamification/achievements');
    return response.data;
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    const response = await api.get('/api/gamification/achievements/unlocked');
    return response.data;
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    const response = await api.get(`/api/gamification/achievements/category/${category}`);
    return response.data;
  }

  async checkAchievements(): Promise<AchievementCheckResponse> {
    const response = await api.post('/api/gamification/achievements/check');
    return response.data;
  }

  async initializeAchievements(): Promise<void> {
    await api.post('/api/gamification/achievements/initialize');
  }

  // Método para calcular progresso em porcentagem
  getProgressPercentage(achievement: Achievement): number {
    if (achievement.target === 0) return 0;
    return Math.min((achievement.progress / achievement.target) * 100, 100);
  }

  // Método para obter cores por categoria
  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      creation: '#4CAF50', // Verde
      study: '#2196F3',    // Azul
      streak: '#FF9800',   // Laranja
      accuracy: '#9C27B0', // Roxo
    };
    return colors[category] || '#757575'; // Cinza como padrão
  }

  // Método para obter ícones por categoria
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      creation: '🎨',
      study: '📚',
      streak: '🔥',
      accuracy: '🎯',
    };
    return icons[category] || '🏆';
  }

  // Método para formatar data de desbloqueio
  formatUnlockDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Método para obter conquistas recentes (últimas 5 desbloqueadas)
  getRecentAchievements(achievements: Achievement[]): Achievement[] {
    const unlocked = achievements.filter(a => a.unlocked);
    return unlocked
      .sort((a, b) => new Date(b.unlocked_at || '').getTime() - new Date(a.unlocked_at || '').getTime())
      .slice(0, 5);
  }

  // Método para obter próximas conquistas (não desbloqueadas com maior progresso)
  getNextAchievements(achievements: Achievement[]): Achievement[] {
    const locked = achievements.filter(a => !a.unlocked);
    return locked
      .sort((a, b) => this.getProgressPercentage(b) - this.getProgressPercentage(a))
      .slice(0, 3);
  }
}

export const achievementService = new AchievementService(); 