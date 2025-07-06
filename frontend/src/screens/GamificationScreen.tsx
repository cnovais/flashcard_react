import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  ProgressBar,
  Surface,
  Avatar,
} from 'react-native-paper';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { achievementService, Achievement } from '../services/achievementService';
import { theme } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export default function GamificationScreen() {
  const { user } = useAuth();
  const { xp, streak, getLevel, getXPToNextLevel } = useGamification();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLevel, setLastLevel] = useState(getLevel());
  const [mascotAnim, setMascotAnim] = useState<'bounceIn' | undefined>('bounceIn');

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const userAchievements = await achievementService.getUserAchievements();
      setAchievements(userAchievements || []);
    } catch (error) {
      setAchievements([]);
      Alert.alert('Erro', 'Falha ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  useEffect(() => {
    // Sempre anima ao abrir a tela
    setMascotAnim('bounceIn');
    const timeout = setTimeout(() => setMascotAnim(undefined), 1200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockedAchievements = (achievements || []).filter(a => a.unlocked);
  const recentAchievements = achievementService.getRecentAchievements(achievements || []);

  // Mapa de conquistas (ordem fixa)
  const mapSteps = [
    {
      key: 'iniciante',
      label: 'Iniciante',
      icon: 'account-star',
      color: '#FFD600',
    },
    {
      key: 'primeiro_deck',
      label: '1º Deck',
      icon: 'cards',
      color: '#42A5F5',
    },
    {
      key: 'sete_dias',
      label: '7 Dias',
      icon: 'fire',
      color: '#FF7043',
    },
    {
      key: 'xp_100',
      label: '100 XP',
      icon: 'trophy',
      color: '#FFD600',
    },
    {
      key: 'mestre',
      label: 'Mestre',
      icon: 'owl',
      color: '#7E57C2',
    },
  ];

  // Determinar desbloqueio (mock: pelo número de conquistas desbloqueadas)
  const unlockedCount = unlockedAchievements.length;

  // Mascotes por nível
  const mascots = ['🦉', '🦊', '🐱', '🐻', '🐸', '🐧', '🦄', '🐲'];
  const mascot = mascots[getLevel() % mascots.length];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando conquistas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Card explicativo de XP */}
      <Card style={styles.xpCard}>
        <Card.Content style={styles.xpCardContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="star-circle" size={32} color="#FFD600" style={{ marginRight: 8 }} />
            <Title style={{ fontSize: 20, color: '#222' }}>Como ganhar XP?</Title>
          </View>
          <View style={styles.xpRow}><MaterialCommunityIcons name="plus-box" size={22} color="#42A5F5" style={{ marginRight: 8 }} /><Text style={styles.xpText}>Crie novos decks e cartões</Text></View>
          <View style={styles.xpRow}><MaterialCommunityIcons name="book-open-variant" size={22} color="#7E57C2" style={{ marginRight: 8 }} /><Text style={styles.xpText}>Estude e revise flashcards</Text></View>
          <View style={styles.xpRow}><MaterialCommunityIcons name="fire" size={22} color="#FF7043" style={{ marginRight: 8 }} /><Text style={styles.xpText}>Mantenha sua sequência de estudos (streak)</Text></View>
          <View style={styles.xpRow}><MaterialCommunityIcons name="trophy" size={22} color="#FFD600" style={{ marginRight: 8 }} /><Text style={styles.xpText}>Desbloqueie conquistas</Text></View>
        </Card.Content>
      </Card>

      {/* Mapa de conquistas visual */}
      <View style={styles.mapContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.mapRow}>
            {mapSteps.map((step, idx) => (
              <React.Fragment key={step.key}>
                <View style={styles.mapItem}>
                  <MaterialCommunityIcons
                    name={step.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={44}
                    color={unlockedCount > idx ? step.color : '#bbb'}
                    style={unlockedCount > idx ? styles.mapIconUnlocked : styles.mapIconLocked}
                  />
                  <Text style={styles.mapLabel}>{step.label}</Text>
                </View>
                {idx < mapSteps.length - 1 && <View style={styles.mapLine} />}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Header com Mascote, Nome e XP */}
      <Surface style={styles.header}>
        <View style={styles.headerTop}>
          <Animatable.Text
            animation={mascotAnim}
            duration={1200}
            iterationCount={1}
            style={styles.mascot}
            useNativeDriver
          >
            {mascot}
          </Animatable.Text>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userLevel}>Nível {getLevel()}</Text>
          <Text style={styles.userPlan}>
            {user?.plan === 'premium' ? '⭐ Premium' : '📚 Gratuito'}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>XP Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Dias Seguidos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Conquistas</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            XP para o próximo nível: {xp}/{getLevel() * 100}
          </Text>
          <ProgressBar 
            progress={Math.min((xp % 100) / 100, 1)} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>
      </Surface>

      {/* Conquistas Recentes */}
      {recentAchievements.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Conquistas Recentes</Title>
            <Text style={styles.sectionSubtitle}>
              Últimas conquistas desbloqueadas
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentAchievements.map((achievement) => (
              <Animatable.View
                key={achievement.id}
                animation="pulse"
                duration={1200}
                iterationCount={3}
                style={styles.recentAchievementCard}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => Alert.alert(
                    achievement.name, 
                    `${achievement.description}\n\nDesbloqueada em: ${achievementService.formatUnlockDate(achievement.unlocked_at!)}`
                  )}
                >
                  <Card style={styles.recentAchievementCardInner}>
                    <Card.Content style={styles.recentAchievementContent}>
                      <MaterialCommunityIcons
                        name={achievement.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={36}
                        color={'#7E57C2'}
                        style={{ marginBottom: 8 }}
                      />
                      <Title style={styles.recentAchievementTitle}>
                        {achievement.name}
                      </Title>
                      <Text style={styles.recentAchievementXP}>
                        +{achievement.xp} XP
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Lista de Conquistas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Todas as Conquistas</Title>
          <Text style={styles.sectionSubtitle}>
            {unlockedAchievements.length} de {achievements.length} desbloqueadas
          </Text>
        </View>

        {achievements.map((achievement) => (
          <Card key={achievement.id} style={styles.achievementListCard}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name={achievement.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={32}
                color={achievement.unlocked ? theme.colors.primary : '#bbb'}
                style={{ marginRight: 16 }}
              />
              <View style={{ flex: 1 }}>
                <Title style={{ color: achievement.unlocked ? '#222' : '#bbb' }}>{achievement.name}</Title>
                <Text style={{ color: achievement.unlocked ? '#555' : '#bbb' }}>{achievement.description}</Text>
                {achievement.unlocked && achievement.unlocked_at && (
                  <Text style={styles.achievementListDate}>
                    Desbloqueada em: {achievementService.formatUnlockDate(achievement.unlocked_at)}
                  </Text>
                )}
              </View>
              <Text style={{ color: achievement.unlocked ? theme.colors.primary : '#bbb', fontWeight: 'bold' }}>+{achievement.xp} XP</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  xpCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  xpCardContent: {
    paddingVertical: 8,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  xpText: {
    color: '#444',
    fontSize: 15,
  },
  mapContainer: {
    marginHorizontal: 0,
    marginBottom: 16,
    marginTop: 8,
    paddingVertical: 8,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mapItem: {
    alignItems: 'center',
    width: 70,
  },
  mapIconUnlocked: {
    opacity: 1,
  },
  mapIconLocked: {
    opacity: 0.3,
  },
  mapLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 2,
  },
  mapLine: {
    width: 24,
    height: 2,
    backgroundColor: '#bbb',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  mascot: {
    fontSize: 64,
    marginBottom: 4,
  },
  userName: {
    color: '#222',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  userLevel: {
    color: '#7E57C2',
    fontSize: 16,
    marginBottom: 2,
    textAlign: 'center',
  },
  userPlan: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#222',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressText: {
    color: '#222',
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  section: {
    marginBottom: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  recentAchievementCard: {
    marginRight: 12,
    width: 180,
  },
  recentAchievementCardInner: {
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  recentAchievementContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentAchievementTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  recentAchievementXP: {
    color: '#7E57C2',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
  },
  achievementListCard: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 1,
    backgroundColor: '#fff',
  },
  achievementListDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
}); 