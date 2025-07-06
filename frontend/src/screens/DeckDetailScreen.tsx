import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CardService, Flashcard } from '../services/cardService';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type DeckDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckDetail'>;
type DeckDetailScreenRouteProp = RouteProp<RootStackParamList, 'DeckDetail'>;

export const DeckDetailScreen: React.FC = () => {
  const navigation = useNavigation<DeckDetailScreenNavigationProp>();
  const route = useRoute<DeckDetailScreenRouteProp>();
  const { deckId, deckName } = route.params;
  
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleAnswers, setVisibleAnswers] = useState<Set<string>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      loadCards();
    }, [deckId])
  );

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const response = await CardService.getCards(deckId);
      setCards(response);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Erro', 'Falha ao carregar os cards do deck.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStudy = () => {
    if (!cards || cards.length === 0) {
      Alert.alert('Deck vazio', 'Adicione cards ao deck antes de começar a estudar.');
      return;
    }
    navigation.navigate('Study', { deckId, deckName });
  };

  const handleAddCard = () => {
    navigation.navigate('CreateCard', { deckId });
  };

  const handleEditCard = (card: Flashcard) => {
    navigation.navigate('EditCard', { cardId: card.id, deckId });
  };

  const toggleAnswer = (cardId: string) => {
    setVisibleAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleDeleteDeck = async () => {
    try {
      await import('../services/deckService').then(({ DeckService }) =>
        DeckService.deleteDeck(deckId)
      );
      Alert.alert('Sucesso', 'Deck excluído com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao excluir o deck.');
    }
  };

  const renderCard = ({ item }: { item: Flashcard }) => {
    const isAnswerVisible = visibleAnswers.has(item.id);
    
    return (
      <View style={styles.cardItem}>
        <TouchableOpacity 
          style={styles.cardContent} 
          onPress={() => toggleAnswer(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardFront}>{item.question}</Text>
          {isAnswerVisible && (
            <Text style={styles.cardBack}>{item.answer}</Text>
          )}
          {!isAnswerVisible && (
            <Text style={styles.tapToShow}>Toque para ver a resposta</Text>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => handleEditCard(item)}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{deckName}</Text>
      </SafeAreaView>

      <TouchableOpacity style={styles.studyButton} onPress={handleStartStudy}>
        <Text style={styles.studyButtonText}>Começar a Estudar</Text>
      </TouchableOpacity>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        style={styles.cardsList}
        contentContainerStyle={styles.cardsListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum card encontrado</Text>
            <Text style={styles.emptySubtext}>
              Adicione cards ao deck para começar a estudar
            </Text>
          </View>
        }
      />

      {/* Botão fixo para adicionar card */}
      <TouchableOpacity style={styles.fixedAddButton} onPress={handleAddCard}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.fixedAddButtonText}>Criar Card</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  studyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  studyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardsListContent: {
    paddingBottom: 80,
  },
  cardItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  cardFront: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardBack: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  tapToShow: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  fixedAddButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fixedAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DeckDetailScreen; 