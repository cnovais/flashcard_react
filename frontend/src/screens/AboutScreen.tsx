import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Card, List, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';

type AboutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

export default function AboutScreen() {
  const navigation = useNavigation<AboutScreenNavigationProp>();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:guardstudyofficial@gmail.com?subject=Suporte Guard Study App');
  };

  const handlePrivacyPolicy = () => {
    // Aqui você pode abrir uma URL ou navegar para uma tela de política de privacidade
    Linking.openURL('https://seusite.com/politica-privacidade');
  };

  const handleTermsOfUse = () => {
    // Aqui você pode abrir uma URL ou navegar para uma tela de termos de uso
    Linking.openURL('https://seusite.com/termos-uso');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* App Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.appInfo}>
            <MaterialCommunityIcons 
              name="cards" 
              size={80} 
              color="#6200ee" 
            />
            <Text style={styles.appName}>Guard Study App</Text>
            <Text style={styles.appVersion}>Versão 1.0.0</Text>
            <Text style={styles.appDescription}>
              Aplicativo de flashcards para ajudar você a estudar de forma eficiente e divertida.
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Support Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Suporte</Text>
          
          <List.Item
            title="Contato por Email"
            description="guardstudyofficial@gmail.com"
            left={(props) => <List.Icon {...props} icon="email" />}
            onPress={handleEmailSupport}
          />
          
          <Divider />
          
          <List.Item
            title="FAQ"
            description="Perguntas frequentes"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {/* Implementar FAQ */}}
          />
        </Card.Content>
      </Card>

      {/* Legal Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Informações Legais</Text>
          
          <List.Item
            title="Política de Privacidade"
            description="Como protegemos seus dados"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={handlePrivacyPolicy}
          />
          
          <Divider />
          
          <List.Item
            title="Termos de Uso"
            description="Termos e condições do serviço"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={handleTermsOfUse}
          />
        </Card.Content>
      </Card>

      {/* Features Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Recursos</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.feature}>
              <MaterialCommunityIcons name="cards-outline" size={20} color="#6200ee" />
              <Text style={styles.featureText}>Criação de flashcards personalizados</Text>
            </View>
            
            <View style={styles.feature}>
              <MaterialCommunityIcons name="brain" size={20} color="#6200ee" />
              <Text style={styles.featureText}>Sistema de repetição espaçada</Text>
            </View>
            
            <View style={styles.feature}>
              <MaterialCommunityIcons name="trophy" size={20} color="#6200ee" />
              <Text style={styles.featureText}>Gamificação e conquistas</Text>
            </View>
            
            <View style={styles.feature}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#6200ee" />
              <Text style={styles.featureText}>Estatísticas detalhadas</Text>
            </View>
            
            <View style={styles.feature}>
              <MaterialCommunityIcons name="sync" size={20} color="#6200ee" />
              <Text style={styles.featureText}>Sincronização em nuvem</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Credits Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Créditos</Text>
          
          <Text style={styles.creditsText}>
            Desenvolvido com ❤️ para ajudar estudantes a alcançarem seus objetivos.
          </Text>
          
          <Text style={styles.creditsText}>
            © 2024 Guard Study App. Todos os direitos reservados.
          </Text>
        </Card.Content>
      </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Para compensar o botão de voltar
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 100,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  creditsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
}); 