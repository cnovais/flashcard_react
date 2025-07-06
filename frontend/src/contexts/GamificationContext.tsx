import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { gamificationService } from '../services/gamificationService';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface GamificationContextData {
  xp: number;
  streak: number;
  achievements: Achievement[];
  addXP: (amount: number) => void;
  updateStreak: (days: number) => void;
  unlockAchievement: (achievementId: string) => void;
  getLevel: () => number;
  getXPToNextLevel: () => number;
  loadGamificationData: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextData>({} as GamificationContextData);

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_deck',
      name: 'Primeiro Deck',
      description: 'Crie seu primeiro deck de flashcards',
      icon: '🎯',
      unlocked: false,
    },
    {
      id: 'first_card',
      name: 'Primeiro Card',
      description: 'Crie seu primeiro flashcard',
      icon: '📝',
      unlocked: false,
    },
    {
      id: 'study_streak_7',
      name: 'Semana de Estudos',
      description: 'Estude por 7 dias consecutivos',
      icon: '🔥',
      unlocked: false,
    },
    {
      id: 'study_streak_30',
      name: 'Mês de Dedicação',
      description: 'Estude por 30 dias consecutivos',
      icon: '🏆',
      unlocked: false,
    },
    {
      id: 'level_10',
      name: 'Aprendiz',
      description: 'Alcance o nível 10',
      icon: '⭐',
      unlocked: false,
    },
  ]);

  // Carregar dados do gamification quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadGamificationData();
    } else {
      // Resetar dados quando não há usuário
      setXp(0);
      setStreak(0);
      setAchievements(prev => prev.map(achievement => ({ ...achievement, unlocked: false })));
    }
  }, [user?.id]); // Usar user.id para evitar loop infinito

  const loadGamificationData = async () => {
    if (!user) return;

    try {
      console.log('🎮 Carregando dados de gamification...');
      // Carregar dados do backend (XP, streak, level)
      try {
        const stats = await gamificationService.getUserStats();
        if (stats && typeof stats.totalXP === 'number') {
          setXp(stats.totalXP);
          console.log('🎮 XP carregado do backend:', stats.totalXP);
        }
        if (stats && typeof stats.studyStreak === 'number') {
          setStreak(stats.studyStreak);
          console.log('🎮 Streak carregado do backend:', stats.studyStreak);
        }
      } catch (err) {
        console.error('🎮 Erro ao carregar stats do backend:', err);
        // fallback para user local
        if (user.xp !== undefined) setXp(user.xp);
        if (user.streak !== undefined) setStreak(user.streak);
      }

      // Carregar achievements do banco
      try {
        const achievementsData = await gamificationService.getAchievements();
        if (achievementsData && achievementsData.length > 0) {
          const mappedAchievements = achievementsData.map(achievement => ({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon || '🏆',
            unlocked: achievement.completed,
            unlockedAt: achievement.completedAt ? new Date(achievement.completedAt) : undefined,
          }));
          setAchievements(prev => {
            // Manter achievements padrão e atualizar com dados do banco
            const updated = prev.map(defaultAchievement => {
              const dbAchievement = mappedAchievements.find(a => a.id === defaultAchievement.id);
              return dbAchievement || defaultAchievement;
            });
            return updated;
          });
          console.log('🎮 Achievements carregados:', achievementsData.length);
        }
      } catch (error) {
        console.error('🎮 Erro ao carregar achievements:', error);
      }

      console.log('🎮 Dados de gamification carregados com sucesso!');
    } catch (error) {
      console.error('🎮 Erro ao carregar dados de gamification:', error);
    }
  };

  const addXP = async (amount: number) => {
    const newXp = xp + amount;
    setXp(newXp);
    
    // Salvar no banco
    if (user) {
      try {
        // Log da ação no backend
        await gamificationService.recordCardCreation('temp_deck_id');
        console.log('🎮 XP adicionado:', amount, 'Total:', newXp);
      } catch (error) {
        console.error('🎮 Erro ao salvar XP:', error);
      }
    }
  };

  const updateStreak = async (days: number) => {
    setStreak(days);
    
    // Salvar no banco
    if (user) {
      try {
        console.log('🎮 Streak atualizado:', days);
      } catch (error) {
        console.error('🎮 Erro ao salvar streak:', error);
      }
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    setAchievements(prev => 
      prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, unlocked: true, unlockedAt: new Date() }
          : achievement
      )
    );
    
    // Salvar no banco
    if (user) {
      try {
        // Aqui você pode implementar a chamada para o backend para desbloquear a achievement
        console.log('🎮 Achievement desbloqueada:', achievementId);
      } catch (error) {
        console.error('🎮 Erro ao salvar achievement:', error);
      }
    }
  };

  const getLevel = (): number => {
    return Math.floor(xp / 100) + 1;
  };

  const getXPToNextLevel = (): number => {
    const currentLevel = getLevel();
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    return 100 - (xp - xpForCurrentLevel);
  };

  return (
    <GamificationContext.Provider value={{
      xp,
      streak,
      achievements,
      addXP,
      updateStreak,
      unlockAchievement,
      getLevel,
      getXPToNextLevel,
      loadGamificationData,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextData {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
} 