import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ProgressBar,
  IconButton,
  DataTable,
  List,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { 
  statsService, 
  StudyStatsSummary, 
  StudyStatsByPeriod, 
  PerformanceByDifficulty, 
  DeckPerformance,
  DetailedStats 
} from '../services/statsService';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type StatsState = {
  summary: StudyStatsSummary;
  period: StudyStatsByPeriod[];
  difficulty: PerformanceByDifficulty[];
  decks: DeckPerformance[];
  detailed: DetailedStats | null;
  studyTimeStats: {
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
  };
  weeklyStats: StudyStatsByPeriod[];
  monthlyStats: StudyStatsByPeriod[];
};

const initialStats: StatsState = {
  summary: {
    total_study_time: 0,
    total_sessions: 0,
    total_cards: 0,
    average_accuracy: 0,
    study_streak: 0,
    total_xp: 0,
    current_level: 0,
    decks_created: 0,
    cards_created: 0,
    achievements_unlocked: 0,
  },
  period: [],
  difficulty: [],
  decks: [],
  detailed: null,
  studyTimeStats: {
    totalTime: 0,
    averageTime: 0,
    longestSession: 0,
    shortestSession: 0,
    timeDistribution: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    },
  },
  weeklyStats: [],
  monthlyStats: [],
};

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsState>(initialStats);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  
  const { user } = useAuth();
  const { xp, getLevel, getXPToNextLevel } = useGamification();

  // Garantir que stats nunca seja null
  const safeStats = stats || initialStats;

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando carregamento de estatísticas...');
      
      // Carregar dados individualmente para melhor tratamento de erros
      let summaryData: StudyStatsSummary | null = null;
      let periodData: StudyStatsByPeriod[] = [];
      let difficultyData: PerformanceByDifficulty[] = [];
      let deckData: DeckPerformance[] = [];
      let timeDistributionData: any = null;
      let weeklyData: StudyStatsByPeriod[] = [];
      let monthlyData: StudyStatsByPeriod[] = [];
      
      try {
        summaryData = await statsService.getSummary();
        console.log('✅ Summary carregado');
      } catch (error) {
        console.error('❌ Erro ao carregar summary:', error);
      }
      
      try {
        periodData = await statsService.getStatsByPeriod('day', 7);
        console.log('✅ Period data carregado');
      } catch (error) {
        console.error('❌ Erro ao carregar period data:', error);
      }
      
      try {
        difficultyData = await statsService.getPerformanceByDifficulty();
        console.log('✅ Difficulty data carregado');
      } catch (error) {
        console.error('❌ Erro ao carregar difficulty data:', error);
      }
      
      try {
        deckData = await statsService.getDeckPerformance();
        console.log('✅ Deck data carregado');
      } catch (error) {
        console.error('❌ Erro ao carregar deck data:', error);
      }
      
      try {
        timeDistributionData = await statsService.getTimeDistribution();
        console.log('✅ Time distribution carregado');
      } catch (error) {
        console.error('❌ Erro ao carregar time distribution:', error);
      }
      
      try {
        weeklyData = await statsService.getStatsByPeriod('week', 30);
        console.log('✅ Weekly data carregado');
      } catch (error) {
        console.error('❌ Erro ao carregar weekly data:', error);
      }
      
      try {
        monthlyData = await statsService.getStatsByPeriod('month', 180);
        console.log('✅ Monthly data carregado');
      } catch (error) {
        console.error('❌ Erro ao carregar monthly data:', error);
      }
      
      console.log('📊 Dados carregados:', {
        summary: summaryData,
        period: periodData,
        difficulty: difficultyData,
        decks: deckData,
        timeDistribution: timeDistributionData,
        weekly: weeklyData,
        monthly: monthlyData
      });
      
      setStats({
        summary: summaryData || initialStats.summary,
        period: periodData || [],
        difficulty: difficultyData || [],
        decks: deckData || [],
        detailed: null,
        studyTimeStats: {
          totalTime: timeDistributionData?.total_study_time || 0,
          averageTime: timeDistributionData?.average_time || 0,
          longestSession: timeDistributionData?.longest_session || 0,
          shortestSession: timeDistributionData?.shortest_session || 0,
          timeDistribution: {
            morning: timeDistributionData?.morning || 0,
            afternoon: timeDistributionData?.afternoon || 0,
            evening: timeDistributionData?.evening || 0,
            night: timeDistributionData?.night || 0,
          },
        },
        weeklyStats: weeklyData || [],
        monthlyStats: monthlyData || [],
      });
      
      console.log('✅ Estatísticas carregadas com sucesso!');
    } catch (error: any) {
      console.error('❌ Error loading stats:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Para qualquer erro, manter os dados zerados
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado');
        return;
      }

      const response = await fetch('http://192.168.1.100:8080/api/stats/export', {
        method: 'GET',
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao exportar relatório');
      }

      const csvData = await response.text();
      
      // Compartilhar o arquivo CSV
      await Share.share({
        message: 'Relatório de Estatísticas do Flashcard App',
        title: 'flashcard_stats.csv',
        url: `data:text/csv;base64,${Buffer.from(csvData).toString('base64')}`,
      });

      Alert.alert('Sucesso', 'Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Erro', 'Falha ao exportar relatório');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando estatísticas...</Text>
      </View>
    );
  }

  const getPeriodData = () => {
    if (!safeStats || !safeStats.period) return [];
    
    switch (selectedPeriod) {
      case 'week':
        return safeStats.period;
      case 'month':
        return safeStats.period; // Usar os mesmos dados por enquanto
      default:
        return safeStats.period;
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#4CAF50';
      case 'good':
        return '#2196F3';
      case 'hard':
        return '#FF9800';
      case 'again':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  // Função para formatar datas de forma mais legível
  const formatChartDate = (dateStr: string): string => {
    try {
      // Verificar se é formato semanal (ex: "2025-W22")
      if (dateStr.includes('-W')) {
        const [year, week] = dateStr.split('-W');
        return `Sem ${week}`;
      }
      
      // Verificar se é formato mensal (ex: "2025-06")
      if (dateStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateStr.split('-');
        const monthNames = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
      }
      
      // Para datas normais (YYYY-MM-DD)
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Se for hoje
      if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
      }
      
      // Se for ontem
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      }
      
      // Para outras datas, usar formato DD/MM
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    } catch (error) {
      // Se houver erro na formatação, retornar a data original
      return dateStr;
    }
  };

  const periodData = getPeriodData();

  // Usar apenas dados reais da API
  const periodDataToShow = periodData || [];
  const difficultyToShow = safeStats?.difficulty || [];
  const decksToShow = safeStats?.decks || [];
  const weeklyStatsToShow = safeStats?.weeklyStats || [];
  const monthlyStatsToShow = safeStats?.monthlyStats || [];
  const studyTimeStatsToShow = safeStats?.studyTimeStats || initialStats.studyTimeStats;

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Title style={styles.title}>📊 Estatísticas</Title>
          <IconButton
            icon="download"
            size={24}
            onPress={exportReport}
            style={styles.exportButton}
          />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Button
            mode={selectedPeriod === 'week' ? 'contained' : 'outlined'}
            onPress={() => setSelectedPeriod('week')}
            style={styles.periodButton}
          >
            Semana
          </Button>
          <Button
            mode={selectedPeriod === 'month' ? 'contained' : 'outlined'}
            onPress={() => setSelectedPeriod('month')}
            style={styles.periodButton}
          >
            Mês
          </Button>
          <Button
            mode={selectedPeriod === 'all' ? 'contained' : 'outlined'}
            onPress={() => setSelectedPeriod('all')}
            style={styles.periodButton}
          >
            Total
          </Button>
        </View>

        {/* Overview Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Visão Geral</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeStats.summary.total_sessions}</Text>
                <Text style={styles.statLabel}>Sessões</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeStats.summary.total_cards}</Text>
                <Text style={styles.statLabel}>Cards Estudados</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeStats.summary.average_accuracy.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Precisão</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeStats.summary.study_streak}</Text>
                <Text style={styles.statLabel}>Sequência</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{statsService.formatStudyTime(safeStats.summary.total_study_time)}</Text>
                <Text style={styles.statLabel}>Tempo Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeStats.summary.total_xp}</Text>
                <Text style={styles.statLabel}>XP Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeStats.summary.current_level}</Text>
                <Text style={styles.statLabel}>Nível</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeStats.summary.decks_created}</Text>
                <Text style={styles.statLabel}>Decks Criados</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* SEÇÃO 1: Gráficos de Progresso Detalhados */}
        <Title style={styles.sectionTitle}>Progresso Detalhado</Title>
        {periodDataToShow.length === 0 ? (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Precisão ao Longo do Tempo</Title>
              <Text style={styles.noDataText}>Nenhum dado de estudo disponível</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Precisão ao Longo do Tempo</Title>
              <LineChart
                data={{
                  labels: periodDataToShow.slice(-7).map(day => formatChartDate(day.date)),
                  datasets: [{ data: periodDataToShow.slice(-7).map(day => day.accuracy) }],
                }}
                width={width - 40}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}
        
        {periodDataToShow.length > 0 && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Tempo de Estudo</Title>
              <BarChart
                data={{
                  labels: periodDataToShow.slice(-7).map(day => formatChartDate(day.date)),
                  datasets: [{ data: periodDataToShow.slice(-7).map(day => day.study_time / 60) }],
                }}
                width={width - 40}
                height={180}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </Card.Content>
          </Card>
        )}

        {/* SEÇÃO 2: Análise de Performance */}
        <Title style={styles.sectionTitle}>Análise de Performance</Title>
        {difficultyToShow.length === 0 ? (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Performance por Dificuldade</Title>
              <Text style={styles.noDataText}>Nenhum dado de dificuldade disponível</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Performance por Dificuldade</Title>
              <PieChart
                data={difficultyToShow.map((item: PerformanceByDifficulty) => ({
                  name: item.difficulty,
                  population: item.count,
                  color: getDifficultyColor(item.difficulty),
                  legendFontColor: '#333',
                  legendFontSize: 12,
                }))}
                width={width - 40}
                height={180}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}
        
        {decksToShow.length === 0 ? (
          <Card style={styles.listCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Decks Mais Estudados</Title>
              <Text style={styles.noDataText}>Nenhum deck estudado ainda</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Decks Mais Estudados</Title>
              {decksToShow.slice(0, 4).map((deck, index) => (
                <List.Item
                  key={deck.deck_id}
                  title={deck.deck_name || `Deck ${deck.deck_id}`}
                  description={`Cards revisados: ${deck.cards_reviewed} | Acurácia: ${deck.accuracy.toFixed(1)}%`}
                  left={props => <List.Icon {...props} icon="cards" />}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* SEÇÃO 3: Estatísticas por Tempo de Estudo */}
        <Title style={styles.sectionTitle}>Estatísticas por Tempo de Estudo</Title>
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Distribuição por Período do Dia</Title>
            <BarChart
              data={{
                labels: ['Manhã', 'Tarde', 'Noite', 'Madrugada'],
                datasets: [{
                  data: [
                    studyTimeStatsToShow.timeDistribution.morning || 0,
                    studyTimeStatsToShow.timeDistribution.afternoon || 0,
                    studyTimeStatsToShow.timeDistribution.evening || 0,
                    studyTimeStatsToShow.timeDistribution.night || 0,
                  ]
                }],
              }}
              width={width - 40}
              height={180}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
            <Text style={styles.statsText}>Sessão mais longa: {studyTimeStatsToShow.longestSession} min</Text>
            <Text style={styles.statsText}>Sessão mais curta: {studyTimeStatsToShow.shortestSession} min</Text>
            <Text style={styles.statsText}>Tempo médio: {isNaN(studyTimeStatsToShow.averageTime) ? '0' : studyTimeStatsToShow.averageTime} min</Text>
          </Card.Content>
        </Card>

        {/* SEÇÃO 4: Relatórios Semanais e Mensais */}
        <Title style={styles.sectionTitle}>Relatórios Semanais e Mensais</Title>
        {weeklyStatsToShow.length === 0 ? (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Relatório Semanal</Title>
              <Text style={styles.noDataText}>Nenhum dado semanal disponível</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Relatório Semanal</Title>
              <BarChart
                data={{
                  labels: weeklyStatsToShow.map(item => formatChartDate(item.date)),
                  datasets: [{ data: weeklyStatsToShow.map(item => item.cards_reviewed) }],
                }}
                width={width - 40}
                height={180}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </Card.Content>
          </Card>
        )}
        
        {monthlyStatsToShow.length === 0 ? (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Relatório Mensal</Title>
              <Text style={styles.noDataText}>Nenhum dado mensal disponível</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Relatório Mensal</Title>
              <BarChart
                data={{
                  labels: monthlyStatsToShow.map(item => formatChartDate(item.date)),
                  datasets: [{ data: monthlyStatsToShow.map(item => item.cards_reviewed) }],
                }}
                width={width - 40}
                height={180}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
              />
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  exportButton: {
    backgroundColor: theme.colors.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  periodButton: {
    flex: 1,
  },
  statsCard: {
    margin: 20,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurface,
    marginTop: 5,
  },
  chartCard: {
    marginHorizontal: 12,
    marginBottom: 18,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
    alignSelf: 'center',
  },
  listCard: {
    marginHorizontal: 12,
    marginBottom: 18,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 12,
  },
  statsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginLeft: 2,
  },
  noDataText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
  },
}); 