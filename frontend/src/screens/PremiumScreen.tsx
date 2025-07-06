import React from 'react';
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
  Paragraph,
  Button,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';

type PremiumScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Premium'>;

export default function PremiumScreen() {
  const navigation = useNavigation<PremiumScreenNavigationProp>();

  const features = [
    {
      title: 'Cards Ilimitados',
      description: 'Crie quantos cards quiser sem limites',
      icon: 'infinite',
      color: '#4CAF50',
    },
    {
      title: 'Animações Especiais',
      description: 'Efeitos visuais exclusivos durante o estudo',
      icon: 'sparkles',
      color: '#FF9800',
    },
    {
      title: 'Estatísticas Avançadas',
      description: 'Acompanhe seu progresso detalhadamente',
      icon: 'analytics',
      color: '#2196F3',
    },
    {
      title: 'Backup na Nuvem',
      description: 'Seus dados sempre seguros e sincronizados',
      icon: 'cloud',
      color: '#9C27B0',
    },
    {
      title: 'Sem Anúncios',
      description: 'Experiência limpa e sem interrupções',
      icon: 'shield-checkmark',
      color: '#F44336',
    },
    {
      title: 'Suporte Prioritário',
      description: 'Atendimento exclusivo para assinantes',
      icon: 'headset',
      color: '#607D8B',
    },
  ];

  const plans = [
    {
      name: 'Mensal',
      price: 'R$ 9,90',
      period: 'mês',
      popular: false,
    },
    {
      name: 'Anual',
      price: 'R$ 79,90',
      period: 'ano',
      popular: true,
      savings: 'Economia de R$ 39,00',
    },
  ];

  const handleSubscribe = (plan: string) => {
    Alert.alert(
      'Assinatura Premium',
      `Você será direcionado para assinar o plano ${plan}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => {
          // TODO: Implementar integração com Stripe
          Alert.alert('Em desenvolvimento', 'Integração com pagamento em desenvolvimento');
        }}
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Title style={styles.title}>Premium</Title>
        <Paragraph style={styles.subtitle}>
          Desbloqueie todo o potencial do Flashcard App
        </Paragraph>
      </View>

      <View style={styles.featuresContainer}>
        <Title style={styles.sectionTitle}>Recursos Premium</Title>
        {features.map((feature, index) => (
          <Card key={index} style={styles.featureCard}>
            <Card.Content style={styles.featureContent}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={24} color="#fff" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      <View style={styles.plansContainer}>
        <Title style={styles.sectionTitle}>Escolha seu Plano</Title>
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            style={[
              styles.planCard,
              plan.popular && styles.popularPlanCard
            ]}
          >
            <Card.Content>
              {plan.popular && (
                <Chip style={styles.popularChip} textStyle={styles.popularChipText}>
                  Mais Popular
                </Chip>
              )}
              <Title style={styles.planName}>{plan.name}</Title>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>
              {plan.savings && (
                <Text style={styles.savings}>{plan.savings}</Text>
              )}
              <Button
                mode="contained"
                onPress={() => handleSubscribe(plan.name)}
                style={styles.subscribeButton}
              >
                Assinar {plan.name}
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Cancele a qualquer momento. Sem taxas ocultas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.text,
  },
  featureCard: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  plansContainer: {
    padding: 20,
  },
  planCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  popularChip: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  popularChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  period: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  savings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
}); 