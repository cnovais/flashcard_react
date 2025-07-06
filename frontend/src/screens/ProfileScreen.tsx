import React, { useState } from 'react';
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
  Avatar,
  Button,
  ProgressBar,
  Chip,
  Divider,
  List,
  Switch,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { xp, streak, achievements, getLevel, getXPToNextLevel } = useGamification();
  const { isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const level = getLevel();
  const xpToNext = getXPToNextLevel();
  const progress = (xp % 100) / 100;

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const handleSignOut = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao sair da conta');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpgradePlan = () => {
    navigation.navigate('Premium');
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info Card */}
      <Card style={styles.card}>
        <Card.Content style={styles.userInfo}>
          <Avatar.Image
            size={80}
            source={{ uri: user?.avatar || 'https://via.placeholder.com/80' }}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Chip
              mode="outlined"
              style={styles.planChip}
              textStyle={styles.planText}
            >
              {user?.plan === 'premium' ? 'Premium' : 'Gratuito'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Level & XP Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Nível {level}</Text>
          <View style={styles.xpContainer}>
            <ProgressBar progress={progress} style={styles.progressBar} />
            <Text style={styles.xpText}>
              {xp % 100} / 100 XP ({xpToNext} para o próximo nível)
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Dias seguidos</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{xp}</Text>
              <Text style={styles.statLabel}>XP Total</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Achievements Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <Text style={styles.achievementCount}>
            {unlockedAchievements.length} de {achievements.length} desbloqueadas
          </Text>
          
          {unlockedAchievements.length > 0 && (
            <View style={styles.achievementsContainer}>
              {unlockedAchievements.slice(0, 3).map((achievement, index) => (
                <View key={index} style={styles.achievement}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {unlockedAchievements.length === 0 && (
            <Text style={styles.noAchievements}>
              Complete objetivos para desbloquear conquistas!
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Settings Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <List.Item
            title="Modo Escuro"
            description="Alternar entre tema claro e escuro"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Editar Perfil"
            description="Alterar informações da conta"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <Divider />
          
          <List.Item
            title="Notificações"
            description="Configurar lembretes de estudo"
            left={(props) => <List.Icon {...props} icon="bell" />}
            onPress={() => Alert.alert('Notificações', 'Funcionalidade em desenvolvimento')}
          />
          
          <Divider />
          
          <List.Item
            title="Estatísticas"
            description="Ver estatísticas detalhadas de estudo"
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            onPress={() => navigation.navigate('Stats')}
          />
          
          <Divider />
          
          <List.Item
            title="Sobre"
            description="Informações sobre o app e suporte"
            left={(props) => <List.Icon {...props} icon="information" />}
            onPress={() => navigation.navigate('About')}
          />
        </Card.Content>
      </Card>

      {/* Premium Features Card */}
      {user?.plan === 'free' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recursos Premium</Text>
            <Text style={styles.premiumDesc}>
              Desbloqueie recursos exclusivos com o plano Premium:
            </Text>
            <View style={styles.premiumFeatures}>
              <Text style={styles.premiumFeature}>• Decks ilimitados</Text>
              <Text style={styles.premiumFeature}>• Cards ilimitados por deck</Text>
              <Text style={styles.premiumFeature}>• Cores e bordas personalizadas</Text>
              <Text style={styles.premiumFeature}>• Fotos de fundo</Text>
              <Text style={styles.premiumFeature}>• Estatísticas avançadas</Text>
            </View>
            <Button
              mode="contained"
              onPress={handleUpgradePlan}
              style={styles.upgradeButton}
            >
              Fazer Upgrade
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Sign Out Button */}
      <Button
        mode="outlined"
        onPress={handleSignOut}
        loading={loading}
        style={styles.signOutButton}
        textColor="#d32f2f"
      >
        Sair da Conta
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  planChip: {
    alignSelf: 'flex-start',
  },
  planText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  xpContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginBottom: 8,
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  achievementCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  achievementsContainer: {
    gap: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666',
  },
  noAchievements: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  premiumDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  premiumFeatures: {
    marginBottom: 16,
  },
  premiumFeature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#ff6b35',
  },
  signOutButton: {
    margin: 16,
    borderColor: '#d32f2f',
  },
}); 