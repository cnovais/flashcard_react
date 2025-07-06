import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Card, FAB, IconButton, Searchbar, Chip } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DeckService, Deck } from '../services/deckService';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type DecksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function DecksScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const navigation = useNavigation<DecksScreenNavigationProp>();
  const { user } = useAuth();
  const { addXP, unlockAchievement } = useGamification();
  const [favoriteDeckIds, setFavoriteDeckIds] = useState<string[]>([]);

  useEffect(() => {
    console.log('🎯 DECKS SCREEN - INICIANDO');
    testToken();
    loadDecks();
    loadFavorites();
  }, []);

  // Recarregar decks quando a tela voltar ao foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 DECKS SCREEN - FOCUS EFFECT');
      loadDecks();
      loadFavorites();
    }, [])
  );

  const testToken = async () => {
    try {
      console.log('🎯 TESTE MANUAL DO TOKEN');
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      console.log('🎯 TOKEN ENCONTRADO:', !!token);
      console.log('🎯 TOKEN VALOR:', token ? token.substring(0, 30) + '...' : 'null');
      
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🎯 TODAS AS CHAVES:', allKeys);
    } catch (error) {
      console.error('🎯 ERRO NO TESTE:', error);
    }
  };

  const loadDecks = async () => {
    try {
      setLoading(true);
      // Chamar o serviço passando os filtros
      const data = await DeckService.getDecks(filter, searchQuery);
      console.log('🎯 DECKS CARREGADOS:', JSON.stringify(data, null, 2));
      setDecks(Array.isArray(data) ? data : []);
      if (data && Array.isArray(data) && data.length === 1) {
        unlockAchievement('first_deck');
        addXP(50);
      }
    } catch (error) {
      console.error('Error loading decks:', error);
      setDecks([]);
      Alert.alert('Erro', 'Falha ao carregar os decks');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar decks ao mudar filtro ou busca
  useEffect(() => {
    loadDecks();
  }, [filter, searchQuery]);

  const loadFavorites = async () => {
    try {
      const ids = await DeckService.getFavoriteDeckIds();
      setFavoriteDeckIds(ids.map((id: any) => (typeof id === 'string' ? id : id.$oid || id.toString())));
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavoriteDeckIds([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDecks();
    setRefreshing(false);
  };

  const handleDeleteDeck = (deck: Deck) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o deck "${deck.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await DeckService.deleteDeck(deck.id);
              setDecks(decks.filter(d => d.id !== deck.id));
              Alert.alert('Sucesso', 'Deck excluído com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir o deck');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (deckId: string) => {
    try {
      if (favoriteDeckIds.includes(deckId)) {
        await DeckService.unfavoriteDeck(deckId);
        setFavoriteDeckIds(favoriteDeckIds.filter(id => id !== deckId));
      } else {
        await DeckService.favoriteDeck(deckId);
        setFavoriteDeckIds([...favoriteDeckIds, deckId]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar favorito');
    }
  };

  // Remover filtro local, usar apenas o resultado da API
  //const filteredDecks = decks.filter(deck => {
  //  const matchesSearch =
  //    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //    deck.description?.toLowerCase().includes(searchQuery.toLowerCase());
  //  if (filter === 'public') return matchesSearch && deck.isPublic;
  //  if (filter === 'private') return matchesSearch && !deck.isPublic;
  //  return matchesSearch;
  //});
  const filteredDecks = decks;

  // Ordenar favoritos primeiro
  const sortedDecks = [...filteredDecks].sort((a, b) => {
    const aFav = favoriteDeckIds.includes(a.id);
    const bFav = favoriteDeckIds.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const renderDeck = ({ item }: { item: Deck }) => {
    const isFavorite = favoriteDeckIds.includes(item.id);
    return (
      <Card
        style={[
          styles.card,
          item.background ? { backgroundColor: item.background } : {},
          item.border ? { borderColor: item.border, borderWidth: 2 } : {},
        ]}
        onPress={() => navigation.navigate('DeckDetail', { deckId: item.id, deckName: item.name })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <View style={styles.visibilityIndicator}>
                <Text style={[styles.visibilityText, { color: item.isPublic ? '#4CAF50' : '#FF9800' }]}>
                  {item.isPublic ? '🌐 Público' : '🔒 Privado'}
                </Text>
              </View>
              <Text style={[styles.deckName, item.color ? { color: item.color } : {}]}>{item.name}</Text>
            </View>
            <View style={styles.headerButtons}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => navigation.navigate('EditDeck', { deck: item })}
              />
            </View>
          </View>
          {item.description && (
            <Text style={styles.deckDescription}>{item.description}</Text>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.cardCount}>{item.cardCount} cards</Text>
            <Text style={styles.cardDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit',
                year: '2-digit'
              }) : 'N/A'}
            </Text>
          </View>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.map((tag: string, idx: number) => (
                <Chip key={idx} style={styles.tagChip} textStyle={styles.tagText}>
                  <View style={{flex: 1, minWidth: 0}}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tagText}>{tag}</Text>
                  </View>
                </Chip>
              ))}
            </View>
          )}
          <View style={styles.shareFavoriteRow}>
            <View style={styles.shareButtonsRow}>
              <TouchableOpacity onPress={() => {}}>
                <MaterialCommunityIcons name="facebook" size={22} color="#1877F3" style={styles.shareIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <MaterialCommunityIcons name="linkedin" size={22} color="#0A66C2" style={styles.shareIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <MaterialCommunityIcons name="instagram" size={22} color="#E4405F" style={styles.shareIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" style={styles.shareIcon} />
              </TouchableOpacity>
            </View>
            <IconButton
              icon={isFavorite ? 'heart' : 'heart-outline'}
              iconColor={isFavorite ? '#E4405F' : '#888'}
              size={22}
              onPress={() => handleToggleFavorite(item.id)}
              accessibilityLabel={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              style={styles.favoriteButton}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Carregando decks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar decks..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{ margin: 8 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ fontWeight: 'bold', marginRight: 8, color: '#6200ee', fontSize: 15 }}>Filtro:</Text>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={{
            backgroundColor: filter === 'all' ? '#6200ee' : '#e0e0e0',
            marginRight: 8,
            height: 32,
          }}
          textStyle={{ color: filter === 'all' ? '#fff' : '#333', fontWeight: 'bold' }}
        >
          Todos
        </Chip>
        <Chip
          selected={filter === 'public'}
          onPress={() => setFilter('public')}
          style={{
            backgroundColor: filter === 'public' ? '#6200ee' : '#e0e0e0',
            marginRight: 8,
            height: 32,
          }}
          textStyle={{ color: filter === 'public' ? '#fff' : '#333', fontWeight: 'bold' }}
        >
          Públicos
        </Chip>
        <Chip
          selected={filter === 'private'}
          onPress={() => setFilter('private')}
          style={{
            backgroundColor: filter === 'private' ? '#6200ee' : '#e0e0e0',
            marginRight: 8,
            height: 32,
          }}
          textStyle={{ color: filter === 'private' ? '#fff' : '#333', fontWeight: 'bold' }}
        >
          Privados
        </Chip>
      </View>
      
      {sortedDecks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Nenhum deck encontrado' : 'Você ainda não tem decks'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateDeck')}
            >
              <Text style={styles.createButtonText}>Criar primeiro deck</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={sortedDecks}
          renderItem={renderDeck}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateDeck')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchbar: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 20 : 16,
    marginBottom: 16,
    elevation: 2,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  visibilityIndicator: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  visibilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deckName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deckDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cardCount: {
    fontSize: 12,
    color: '#888',
  },
  cardDate: {
    fontSize: 12,
    color: '#888',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 0,
    height: 26,
    marginRight: 8,
    marginBottom: 0,
    maxWidth: 120,
    flexShrink: 1,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  tagText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  shareFavoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareIcon: {
    marginRight: 8,
  },
  favoriteButton: {
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 