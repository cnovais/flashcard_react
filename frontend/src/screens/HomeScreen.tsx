import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { DeckService, Deck } from '../services/deckService';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [recentDecks, setRecentDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentDecks();
  }, []);

  const loadRecentDecks = async () => {
    try {
      const decks = await DeckService.getDecks();
      setRecentDecks(Array.isArray(decks) ? decks.slice(0, 3) : []);
    } catch (error) {
      console.error('Error loading recent decks:', error);
      setRecentDecks([]);
    } finally {
      setLoading(false);
    }
  };



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Cards de Navegação Rápida */}
      <View style={styles.navigationSection}>
        <Title style={styles.sectionTitle}>Navegação Rápida</Title>
        
        <View style={styles.navigationGrid}>
          <TouchableOpacity 
            key="decks"
            style={styles.navCard}
            onPress={() => navigation.navigate('Decks')}
          >
            <View style={styles.navCardContent}>
              <Text style={styles.navCardIcon}>📚</Text>
              <Text style={styles.navCardTitle} numberOfLines={2}>Meus Decks</Text>
              <Text style={styles.navCardSubtitle} numberOfLines={2}>
                {recentDecks.length} deck{recentDecks.length !== 1 ? 's' : ''} criado{recentDecks.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            key="study"
            style={styles.navCard}
            onPress={() => navigation.navigate('Study')}
          >
            <View style={styles.navCardContent}>
              <Text style={styles.navCardIcon}>🎯</Text>
              <Text style={styles.navCardTitle} numberOfLines={2}>Estudar</Text>
              <Text style={styles.navCardSubtitle} numberOfLines={2}>
                0 cards hoje
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            key="create-deck"
            style={styles.navCard}
            onPress={() => navigation.navigate('CreateDeck')}
          >
            <View style={styles.navCardContent}>
              <Text style={styles.navCardIcon}>➕</Text>
              <Text style={styles.navCardTitle} numberOfLines={2}>Criar Deck</Text>
              <Text style={styles.navCardSubtitle} numberOfLines={2}>Novo conjunto de cards</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            key="gamification"
            style={styles.navCard}
            onPress={() => navigation.navigate('Gamification')}
          >
            <View style={styles.navCardContent}>
              <Text style={styles.navCardIcon}>🏆</Text>
              <Text style={styles.navCardTitle} numberOfLines={2}>Gamificação</Text>
              <Text style={styles.navCardSubtitle} numberOfLines={2}>
                0 badges
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Decks Recentes */}
      {recentDecks.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Decks Recentes</Title>
            <TouchableOpacity key="see-all" onPress={() => navigation.navigate('Decks')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentDecks.map((deck) => (
              <TouchableOpacity
                key={deck.id}
                style={styles.deckCard}
                onPress={() => navigation.navigate('DeckDetail', { deckId: deck.id, deckName: deck.name })}
              >
                <Card style={styles.deckCardInner}>
                  <Card.Content style={styles.deckCardContent}>
                    <Title style={styles.deckTitle} numberOfLines={2}>
                      {deck.name}
                    </Title>
                    <Paragraph style={styles.deckDescription} numberOfLines={2}>
                      {deck.description || 'Sem descrição'}
                    </Paragraph>
                    <View style={styles.deckStats}>
                      <Chip icon="cards" style={styles.deckChip}>
                        {deck.cardCount || 0} cards
                      </Chip>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ações Rápidas */}
      <View style={styles.quickActionsSection}>
        <Title style={styles.sectionTitle}>Ações Rápidas</Title>
        
        <View style={styles.quickActionsGrid}>
          <Button
            key="create-deck-btn"
            mode="contained"
            icon="plus"
            onPress={() => navigation.navigate('CreateDeck')}
            style={styles.quickActionButton}
            contentStyle={styles.quickActionContent}
          >
            Criar Deck
          </Button>

          <Button
            key="achievements-btn"
            mode="outlined"
            icon="trophy"
            onPress={() => navigation.navigate('Gamification')}
            style={styles.quickActionButton}
            contentStyle={styles.quickActionContent}
          >
            Ver Conquistas
          </Button>

          <Button
            key="stats-btn"
            mode="outlined"
            icon="chart-line"
            onPress={() => navigation.navigate('Stats')}
            style={styles.quickActionButton}
            contentStyle={styles.quickActionContent}
          >
            Estatísticas
          </Button>
        </View>
      </View>

      {/* Dica do Dia */}
      <Surface style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipIcon}>💡</Text>
          <Title style={styles.tipTitle}>Dica do Dia</Title>
        </View>
        <Paragraph style={styles.tipText}>
          Estude por 15 minutos todos os dias para manter a consistência e melhorar sua retenção de conhecimento!
        </Paragraph>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navigationSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    height: 120,
  },
  navCardContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: '100%',
    justifyContent: 'center',
  },
  navCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  navCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  navCardSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  deckCard: {
    marginRight: 16,
    width: 200,
    height: 160,
    marginBottom: 16,
  },
  deckCardInner: {
    borderRadius: 12,
    elevation: 2,
    height: '100%',
    backgroundColor: '#fff',
  },
  deckCardContent: {
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  deckDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 16,
    flex: 1,
  },
  deckStats: {
    flexDirection: 'row',
    marginTop: 'auto',
  },
  deckChip: {
    marginRight: 8,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 60) / 2,
    marginBottom: 12,
    height: 48,
  },
  quickActionContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 