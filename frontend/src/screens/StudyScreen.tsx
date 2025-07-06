import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ProgressBar,
  IconButton,
  Surface,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { CardService, Flashcard } from '../services/cardService';
import { DeckService, Deck } from '../services/deckService';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { statsService } from '../services/statsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/api';
import * as Progress from 'react-native-progress';
import { PieChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

type StudyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Study'>;
type StudyScreenRouteProp = RouteProp<RootStackParamList, 'Study'>;

interface StudyCard extends Flashcard {
  isAnswered: boolean;
  nextReview?: Date;
  interval?: number;
  easeFactor?: number;
}

type DifficultyLevel = 'again' | 'hard' | 'good' | 'easy';

const DIFFICULTY_INTERVALS = {
  again: 10 * 60 * 1000, // 10 minutos
  hard: 15 * 60 * 1000,  // 15 minutos
  good: 24 * 60 * 60 * 1000, // 1 dia
  easy: 2 * 24 * 60 * 60 * 1000, // 2 dias
};

export default function StudyScreen() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Estados para alternativas
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);
  const [showAlternativeResult, setShowAlternativeResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const navigation = useNavigation<StudyScreenNavigationProp>();
  const route = useRoute<StudyScreenRouteProp>();
  const { deckId, deckName } = route.params || {};
  const { addXP, getLevel } = useGamification();
  const { user } = useAuth();
  
  // Animations
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Voltar para useState simples para os contadores:
  const [againCount, setAgainCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);

  useEffect(() => {
    if (deckId && deckName) {
      // Se recebeu parâmetros, vai direto para o estudo
      loadCards();
    } else {
      // Se não recebeu parâmetros, carrega a lista de decks
      loadDecks();
    }
  }, [deckId]);

  // Resetar estado quando cards são carregados
  useEffect(() => {
    if (cards.length > 0 && deckId && deckName) {
      // Se tem cards e parâmetros, inicia o estudo automaticamente
      setIsStudying(true);
      setCurrentCardIndex(0);
      setAgainCount(0);
      setHardCount(0);
      setGoodCount(0);
      setEasyCount(0);
      setForceUpdate(0);
    }
  }, [cards, deckId, deckName]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const decksData = await DeckService.getDecks();
      setDecks(decksData);
    } catch (error) {
      console.error('Error loading decks:', error);
      Alert.alert('Erro', 'Falha ao carregar decks');
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      setLoading(true);
      const cardsData = await CardService.getCards(deckId);
      const studyCards: StudyCard[] = cardsData.map(card => ({
        ...card,
        isAnswered: false,
        nextReview: new Date(),
        interval: 0,
        easeFactor: 2.5,
      }));
      setCards(studyCards);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Erro', 'Falha ao carregar cards');
    } finally {
      setLoading(false);
    }
  };

  const startStudySession = (deck?: Deck) => {
    const targetDeck = deck || selectedDeck;
    if (!targetDeck) {
      Alert.alert('Erro', 'Selecione um deck para estudar');
      return;
    }

    if (targetDeck.cardCount === 0) {
      Alert.alert('Erro', 'Este deck não possui cards para estudar');
      return;
    }

    // Carrega os cards do deck selecionado
    loadCardsForDeck(targetDeck.id);
  };

  const loadCardsForDeck = async (deckId: string) => {
    setLoading(true);
    try {
      const response = await CardService.getCards(deckId);
      const studyCards = response.map(card => ({
        ...card,
        isAnswered: false
      }));
      setCards(studyCards);
      setIsStudying(true);
      setCurrentCardIndex(0);
      setAgainCount(0);
      setHardCount(0);
      setGoodCount(0);
      setEasyCount(0);
      setForceUpdate(0);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Erro', 'Falha ao carregar os cards');
    } finally {
      setLoading(false);
    }
  };

  const showAnswerHandler = () => {
    setShowAnswer(true);
    
    // Animação suave para mostrar a resposta
    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const selectAlternative = (index: number) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard || !currentCard.alternatives) return;

    setSelectedAlternative(index);
    
    // Verificar se a resposta está correta
    const correct = currentCard.correctAlternative === index;
    setIsCorrect(correct);
    setShowAlternativeResult(true);
    
    // Animação suave
    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetAlternativeState = () => {
    setSelectedAlternative(null);
    setShowAlternativeResult(false);
    setIsCorrect(false);
  };

  const answerCard = (difficulty: DifficultyLevel) => {
    try {
      const currentCard = cards[currentCardIndex];
      if (!currentCard) {
        return;
      }

      // Log da revisão do card
      const logCardReview = async () => {
        try {
          const isCorrect = selectedAlternative === currentCard.correctAlternative;
          const studyTime = 30; // estimativa de 30 segundos por card
          const token = await AsyncStorage.getItem('@FlashcardApp:token');
          
          await fetch(`${API_BASE_URL}/api/study/review`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Token': token || '',
            },
            body: JSON.stringify({
              deck_id: route.params.deckId,
              card_id: currentCard.id,
              difficulty: difficulty,
              is_correct: isCorrect,
              study_time: studyTime,
            }),
          });
        } catch (error) {
          console.log('Failed to log card review:', error);
          // Não falhar a operação principal por causa do log
        }
      };

      // Executar o log em background
      logCardReview();

      // Incrementar contador de forma simples
      if (difficulty === 'again') {
        setAgainCount(prev => prev + 1);
      }
      if (difficulty === 'hard') {
        setHardCount(prev => prev + 1);
      }
      if (difficulty === 'good') {
        setGoodCount(prev => prev + 1);
      }
      if (difficulty === 'easy') {
        setEasyCount(prev => prev + 1);
      }

      // Animação suave e rápida
      Animated.sequence([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Move to next card after delay (mais rápido)
      setTimeout(() => {
        if (currentCardIndex < cards.length - 1) {
          const nextIndex = currentCardIndex + 1;
          setCurrentCardIndex(nextIndex);
          setShowAnswer(false);
          resetAlternativeState(); // Resetar estados de alternativa
        } else {
          finishStudySession();
        }
      }, 300);

    } catch (error) {
      console.log('ERRO na função answerCard:', error);
    }
  };

  const finishStudySession = () => {
    setShowSummary(true);
  };

  const handleSummaryOk = () => {
    setShowSummary(false);
    setIsStudying(false);
    navigation.goBack();
  };

  const renderStudyCard = () => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return null;

    const hasAlternatives = currentCard.alternatives && currentCard.alternatives.length > 0;

    return (
      <Animated.View 
        style={[
          styles.cardContainer,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
            flex: 1,
          }
        ]}
      >
        <Card style={[styles.card, { flex: 1 }]}>
          <Card.Content style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
            {!showAnswer && !showAlternativeResult ? (
              // Mostrar pergunta
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Title style={styles.cardTitle}>Pergunta</Title>
                <Paragraph style={[styles.cardText, { textAlign: 'center' }]}>{currentCard.question}</Paragraph>
                {currentCard.imageUrl && (
                  <Image source={{ uri: currentCard.imageUrl }} style={styles.cardImage} />
                )}
                
                {hasAlternatives ? (
                  // Mostrar alternativas
                  <View style={styles.alternativesContainer}>
                    <Text style={styles.alternativesTitle}>Escolha a resposta correta:</Text>
                    {currentCard.alternatives?.map((alternative, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.alternativeButton,
                          selectedAlternative === index && styles.selectedAlternativeButton
                        ]}
                        onPress={() => selectAlternative(index)}
                        disabled={selectedAlternative !== null}
                      >
                        <Text style={[
                          styles.alternativeText,
                          selectedAlternative === index && styles.selectedAlternativeText
                        ]}>
                          {String.fromCharCode(65 + index)}. {alternative}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  // Mostrar botão para cards abertos
                  <TouchableOpacity style={styles.showAnswerButton} onPress={showAnswerHandler}>
                    <Text style={styles.showAnswerButtonText}>Mostrar Resposta</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : showAlternativeResult ? (
              // Mostrar resultado da alternativa
              <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Title style={styles.cardTitle}>
                    {isCorrect ? '✅ Correto!' : '❌ Incorreto'}
                  </Title>
                  
                  <View style={[
                    styles.resultContainer,
                    { backgroundColor: isCorrect ? '#4CAF50' : '#F44336' }
                  ]}>
                    <Text style={styles.resultText}>
                      {isCorrect ? 'Parabéns! Você acertou!' : 'Resposta incorreta'}
                    </Text>
                    <Text style={styles.correctAnswerText}>
                      Resposta correta: {currentCard.alternatives && currentCard.correctAlternative !== undefined 
                        ? currentCard.alternatives[currentCard.correctAlternative] 
                        : 'N/A'}
                    </Text>
                  </View>

                  {currentCard.tags && currentCard.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {currentCard.tags.map((tag, index) => (
                        <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                          {tag}
                        </Chip>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={styles.difficultyContainer}>
                  <Text style={styles.difficultyTitle}>Como você se saiu?</Text>
                  <View style={styles.difficultyButtons}>
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.againButton]} 
                      onPress={() => answerCard('again')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Novamente</Text>
                      <Text style={styles.difficultySubtext}>Menos de 10 min</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.hardButton]} 
                      onPress={() => answerCard('hard')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Difícil</Text>
                      <Text style={styles.difficultySubtext}>Menos de 15 min</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.goodButton]} 
                      onPress={() => answerCard('good')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Bom</Text>
                      <Text style={styles.difficultySubtext}>1 dia</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.easyButton]} 
                      onPress={() => answerCard('easy')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Fácil</Text>
                      <Text style={styles.difficultySubtext}>2 dias</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              // Mostrar resposta para cards abertos
              <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Title style={styles.cardTitle}>Resposta</Title>
                  <Paragraph style={[styles.cardText, { textAlign: 'center' }]}>{currentCard.answer}</Paragraph>
                  {currentCard.tags && currentCard.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {currentCard.tags.map((tag, index) => (
                        <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                          {tag}
                        </Chip>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={styles.difficultyContainer}>
                  <Text style={styles.difficultyTitle}>Como você se saiu?</Text>
                  <View style={styles.difficultyButtons}>
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.againButton]} 
                      onPress={() => answerCard('again')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Novamente</Text>
                      <Text style={styles.difficultySubtext}>Menos de 10 min</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.hardButton]} 
                      onPress={() => answerCard('hard')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Difícil</Text>
                      <Text style={styles.difficultySubtext}>Menos de 15 min</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.goodButton]} 
                      onPress={() => answerCard('good')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Bom</Text>
                      <Text style={styles.difficultySubtext}>1 dia</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.difficultyButton, styles.easyButton]} 
                      onPress={() => answerCard('easy')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.difficultyButtonText}>Fácil</Text>
                      <Text style={styles.difficultySubtext}>2 dias</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    );
  };

  const totalRespondidos = againCount + hardCount + goodCount + easyCount;
  const progresso = cards.length > 0 ? (totalRespondidos / cards.length) * 100 : 0;

  if (showSummary) {
    // Dados para o resumo
    const total = againCount + hardCount + goodCount + easyCount;
    const remembered = goodCount + easyCount;
    const notRemembered = againCount + hardCount;
    const rememberedPercent = total > 0 ? Math.round((remembered / total) * 100) : 0;
    const notRememberedPercent = total > 0 ? 100 - rememberedPercent : 0;

    // Porcentagens individuais
    const againPercent = total > 0 ? Math.round((againCount / total) * 100) : 0;
    const hardPercent = total > 0 ? Math.round((hardCount / total) * 100) : 0;
    const goodPercent = total > 0 ? Math.round((goodCount / total) * 100) : 0;
    const easyPercent = total > 0 ? Math.round((easyCount / total) * 100) : 0;

    // Cores
    const red = '#e74c3c';
    const orange = '#f39c12';
    const blue = '#3498db';
    const green = '#2ecc40';
    const gray = '#e0e0e0';

    // Dados para o PieChart
    const pieData = [
      {
        name: 'Novamente',
        population: againCount,
        color: red,
        legendFontColor: '#333',
        legendFontSize: 14,
      },
      {
        name: 'Difícil',
        population: hardCount,
        color: orange,
        legendFontColor: '#333',
        legendFontSize: 14,
      },
      {
        name: 'Bom',
        population: goodCount,
        color: blue,
        legendFontColor: '#333',
        legendFontSize: 14,
      },
      {
        name: 'Fácil',
        population: easyCount,
        color: green,
        legendFontColor: '#333',
        legendFontSize: 14,
      },
    ].filter(item => item.population > 0);

    // Largura do gráfico
    const screenWidth = Dimensions.get('window').width;

    // Função para reiniciar sessão
    const handleRestart = () => {
      setShowSummary(false);
      setIsStudying(true);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setSelectedAlternative(null);
      setAgainCount(0);
      setHardCount(0);
      setGoodCount(0);
      setEasyCount(0);
      setForceUpdate(forceUpdate + 1);
    };

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View style={{ width: '100%', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 2 }}>{selectedDeck?.name || 'Sessão Concluída'}</Text>
          <Text style={{ fontSize: 18, color: theme.colors.textSecondary, marginBottom: 8 }}>Resultados</Text>
        </View>
        {/* Gráfico de pizza multicolorido */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth * 0.8}
              height={180}
              chartConfig={{
                color: () => '#333',
                labelColor: () => '#333',
              }}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'10'}
              absolute
            />
          ) : (
            <View style={{ width: screenWidth * 0.8, height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: gray, borderRadius: 90 }}>
              <Text style={{ color: '#888' }}>Sem respostas</Text>
            </View>
          )}
        </View>
        {/* Contadores */}
        <View style={{ flexDirection: 'row', width: '90%', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, alignItems: 'center', borderWidth: 1, borderColor: gray, borderRadius: 12, marginRight: 8, padding: 12 }}>
            <Text style={{ color: '#555', fontWeight: 'bold', fontSize: 16 }}>Novamente</Text>
            <Text style={{ color: red, fontWeight: 'bold', fontSize: 22 }}>{againCount}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderWidth: 1, borderColor: gray, borderRadius: 12, marginLeft: 8, padding: 12 }}>
            <Text style={{ color: '#555', fontWeight: 'bold', fontSize: 16 }}>Difícil</Text>
            <Text style={{ color: orange, fontWeight: 'bold', fontSize: 22 }}>{hardCount}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderWidth: 1, borderColor: gray, borderRadius: 12, marginLeft: 8, padding: 12 }}>
            <Text style={{ color: '#555', fontWeight: 'bold', fontSize: 16 }}>Bom</Text>
            <Text style={{ color: blue, fontWeight: 'bold', fontSize: 22 }}>{goodCount}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderWidth: 1, borderColor: gray, borderRadius: 12, marginLeft: 8, padding: 12 }}>
            <Text style={{ color: '#555', fontWeight: 'bold', fontSize: 16 }}>Fácil</Text>
            <Text style={{ color: green, fontWeight: 'bold', fontSize: 22 }}>{easyCount}</Text>
          </View>
        </View>
        {/* Botões */}
        <View style={{ width: '90%', marginBottom: 8 }}>
          <Button mode="contained" style={{ marginBottom: 10, backgroundColor: theme.colors.primary }} onPress={handleRestart}>
            Refazer sessão
          </Button>
          <Button mode="contained" style={{ backgroundColor: '#222' }} onPress={handleSummaryOk}>
            Finalizar
          </Button>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : isStudying ? (
        <>
          {/* Botão de voltar no topo */}
          <View style={styles.studyHeader}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setIsStudying(false);
                  setSelectedDeck(null);
                  setCurrentCardIndex(0);
                  setShowAnswer(false);
                  setSelectedAlternative(null);
                  setAgainCount(0);
                  setHardCount(0);
                  setGoodCount(0);
                  setEasyCount(0);
                }}
              >
                <Ionicons name="arrow-back" size={28} color={theme.colors.primary} style={{margin:0, padding:0, alignSelf:'center'}} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Estudo</Text>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={styles.difficultyStatsRow}>
              {/* Calcular total respondidos */}
              {(() => {
                return (
                  <>
                    <View style={[styles.difficultyStat, {backgroundColor: '#ff6b6b'}]}>
                      <Text style={styles.difficultyStatLabel}>Novamente</Text>
                      <Text style={styles.difficultyStatValue}>{againCount}</Text>
                    </View>
                    <View style={[styles.difficultyStat, {backgroundColor: '#ffa726'}]}>
                      <Text style={styles.difficultyStatLabel}>Difícil</Text>
                      <Text style={styles.difficultyStatValue}>{hardCount}</Text>
                    </View>
                    <View style={[styles.difficultyStat, {backgroundColor: '#66bb6a'}]}>
                      <Text style={styles.difficultyStatLabel}>Bom</Text>
                      <Text style={styles.difficultyStatValue}>{goodCount}</Text>
                    </View>
                    <View style={[styles.difficultyStat, {backgroundColor: '#42a5f5'}]}>
                      <Text style={styles.difficultyStatLabel}>Fácil</Text>
                      <Text style={styles.difficultyStatValue}>{easyCount}</Text>
                    </View>
                  </>
                );
              })()}
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Progresso: {Math.round(progresso)}%
              </Text>
              <ProgressBar
                progress={progresso / 100}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          </View>
          <ScrollView style={styles.studyContent} contentContainerStyle={styles.studyContentContainer}>
            {renderStudyCard()}
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Estudar</Text>
            <Text style={styles.subtitle}>
              Selecione um deck para começar a estudar
            </Text>
          </View>
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {decks.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>
                    Você ainda não tem decks criados.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('CreateDeck')}
                    style={styles.createButton}
                  >
                    Criar Deck
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <View style={styles.decksContainer}>
                {decks.map((deck) => (
                  <Card
                    key={deck.id}
                    style={[
                      styles.deckCard,
                      deck.background ? { backgroundColor: deck.background } : {},
                      deck.border ? { borderColor: deck.border, borderWidth: 2 } : {},
                    ]}
                    onPress={() => setSelectedDeck(deck)}
                  >
                    <Card.Content>
                      <View style={styles.deckHeader}>
                        <View style={styles.visibilityIndicator}>
                          <Text style={[styles.visibilityText, { color: deck.isPublic ? '#4CAF50' : '#FF9800' }]}>
                            {deck.isPublic ? '🌐 Público' : '🔒 Privado'}
                          </Text>
                        </View>
                        <Title style={[styles.deckTitle, deck.color ? { color: deck.color } : {}]}>{deck.name}</Title>
                      </View>
                      <Paragraph style={styles.deckDescription}>
                        {deck.description || 'Sem descrição'}
                      </Paragraph>
                      <View style={styles.deckStats}>
                        <Chip icon="cards" style={styles.statChip}>
                          {deck.cardCount || 0} cards
                        </Chip>
                        <Chip icon="calendar" style={styles.statChip}>
                          {deck.createdAt ? new Date(deck.createdAt).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          }) : 'N/A'}
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>
          
          {/* Botão fixo na parte inferior */}
          {selectedDeck && (
            <View style={styles.fixedStudyButton}>
              <Button 
                mode="contained" 
                onPress={() => startStudySession(selectedDeck)}
                style={styles.studyButton}
                icon="play"
                loading={loading}
                disabled={loading}
              >
                Estudar {selectedDeck.name}
              </Button>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

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
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 2,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 0,
    textAlign: 'left',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 20,
  },
  createButton: {
    marginTop: 10,
  },
  decksContainer: {
    paddingTop: 10,
  },
  deckCard: {
    marginBottom: 15,
    elevation: 2,
  },
  selectedDeckCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  deckHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  deckTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deckDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  deckStats: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  statChip: {
    // backgroundColor: theme.colors.surfaceVariant, // Remover para manter cor personalizada
  },
  studyActions: {
    padding: 20,
  },
  studyButton: {
    paddingVertical: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  actions: {
    padding: 20,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
  },
  studyHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
    // backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  studyContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 20,
    flex: 1,
  },
  card: {
    width: width - 40,
    // backgroundColor: theme.colors.surface, // Remover para manter cor personalizada
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  showAnswerButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  showAnswerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.primary,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  difficultyContainer: {
    marginTop: 20,
  },
  difficultyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.text,
  },
  difficultyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  againButton: {
    backgroundColor: '#ff6b6b',
  },
  hardButton: {
    backgroundColor: '#ffa726',
  },
  goodButton: {
    backgroundColor: '#66bb6a',
  },
  easyButton: {
    backgroundColor: '#42a5f5',
  },
  difficultyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  difficultySubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fixedStudyButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: Platform.OS === 'ios' ? 35 : 15,
  },
  difficultyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  difficultyStat: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    paddingVertical: 6,
  },
  difficultyStatLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  difficultyStatValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 2,
  },
  alternativesContainer: {
    marginTop: 20,
    width: '100%',
  },
  alternativesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.text,
  },
  alternativeButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  selectedAlternativeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  alternativeText: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  selectedAlternativeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  correctAnswerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    flex: 1,
    textAlign: 'center',
    marginLeft: 0,
    padding: 0,
  },
  headerSpacer: {
    width: 32,
  },
  studyContentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 10,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 40,
  },
}); 