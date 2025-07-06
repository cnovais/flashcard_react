import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Chip,
  Card,
  Title,
  Paragraph,
  Switch,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DeckService, Deck } from '../services/deckService';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type CreateDeckScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateDeck'>;

export default function CreateDeckScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [color, setColor] = useState('#6200ee');
  const [border, setBorder] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [showColors, setShowColors] = useState(false);
  const navigation = useNavigation<CreateDeckScreenNavigationProp>();
  const { addXP } = useGamification();
  const { user } = useAuth();
  const theme = useTheme();

  const colorOptions = [
    '#000000', // preto
    '#ffffff', // branco
    '#6200ee', '#03dac6', '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
  ];

  useEffect(() => {
    loadUserDecks();
  }, []);

  const loadUserDecks = async () => {
    try {
      const decks = await DeckService.getDecks();
      setUserDecks(decks);
    } catch (error) {
      console.error('Error loading user decks:', error);
    }
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Calcular limites separados
  const publicDecks = userDecks.filter(d => d.isPublic);
  const privateDecks = userDecks.filter(d => !d.isPublic);
  const publicLimit = 3;
  const privateLimit = 3;
  const nearingLimit = isPublic
    ? publicDecks.length >= publicLimit - 1
    : privateDecks.length >= privateLimit - 1;

  const handleCreateDeck = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome do deck é obrigatório');
      return;
    }
    // Remover verificação antiga de limite, pois agora é feita no backend
    try {
      setLoading(true);
      console.log('🟢 Enviando deck:', {
        name: name.trim(),
        description: description.trim() || undefined,
        tags,
        isPublic,
        color,
        border,
        background,
      });
      await DeckService.createDeck({
        name: name.trim(),
        description: description.trim() || undefined,
        tags,
        isPublic,
        color,
        border,
        background,
      });
      addXP(25);
      await loadUserDecks();
      Alert.alert('Sucesso', 'Deck criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      // Exibir mensagem de erro do backend
      Alert.alert('Limite atingido', error?.response?.data?.error || 'Falha ao criar o deck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header customizado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Deck</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Criar Novo Deck</Title>
            <Paragraph style={styles.subtitle}>
              Organize seus flashcards em decks temáticos
            </Paragraph>

            <TextInput
              label="Nome do Deck *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
              maxLength={100}
            />

            <TextInput
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  label="Adicionar tag"
                  value={newTag}
                  onChangeText={text => setNewTag(text.toLowerCase())}
                  style={styles.tagInput}
                  mode="outlined"
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
                <Button
                  mode="contained"
                  onPress={addTag}
                  disabled={!newTag.trim()}
                  style={styles.addTagButton}
                >
                  +
                </Button>
              </View>

              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeTag(tag)}
                      style={styles.tag}
                      textStyle={styles.tagText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.personalizationSection}>
              <Text style={styles.sectionTitle}>Personalização</Text>
              <TouchableOpacity onPress={() => setShowColors(!showColors)} style={{marginBottom: 12, alignSelf: 'flex-start'}}>
                <Text style={{color: theme.colors.primary, fontWeight: 'bold'}}>
                  {showColors ? 'Ocultar opções de cor ▲' : 'Personalizar cores ▼'}
                </Text>
              </TouchableOpacity>
              {showColors && (
                <View>
                  <Text style={styles.colorLabel}>Cor Principal:</Text>
                  <View style={styles.colorOptions}>
                    {colorOptions.map((colorOption) => (
                      <TouchableOpacity
                        key={colorOption}
                        style={[
                          styles.colorOption,
                          { backgroundColor: colorOption },
                          color === colorOption && styles.selectedColor
                        ]}
                        onPress={() => setColor(colorOption)}
                      />
                    ))}
                  </View>

                  <Text style={styles.colorLabel}>Cor da Borda:</Text>
                  <View style={styles.colorOptions}>
                    {colorOptions.map((colorOption) => (
                      <TouchableOpacity
                        key={colorOption}
                        style={[
                          styles.colorOption,
                          { backgroundColor: colorOption },
                          border === colorOption && styles.selectedColor
                        ]}
                        onPress={() => setBorder(colorOption)}
                      />
                    ))}
                  </View>

                  <Text style={styles.colorLabel}>Cor de Fundo:</Text>
                  <View style={styles.colorOptions}>
                    {colorOptions.map((colorOption) => (
                      <TouchableOpacity
                        key={colorOption}
                        style={[
                          styles.colorOption,
                          { backgroundColor: colorOption },
                          background === colorOption && styles.selectedColor
                        ]}
                        onPress={() => setBackground(colorOption)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Visibilidade igual à tela de edição */}
            <Text style={styles.sectionTitle}>Visibilidade</Text>
            <View style={styles.visibilityContainer}>
              <Text style={styles.visibilityText}>
                {isPublic ? 'Público' : 'Privado'}
              </Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.visibilityDescription}>
              {isPublic 
                ? 'Qualquer pessoa pode ver este deck'
                : 'Apenas você pode ver este deck'
              }
            </Text>

            {user?.plan === 'free' && (
              <Card style={styles.limitCard}>
                <Card.Content>
                  <Text style={styles.limitTitle}>Limite Gratuito</Text>
                  <Text style={styles.limitText}>
                    • {publicDecks.length}/3 decks públicos{"\n"}
                    • {privateDecks.length}/3 decks privados
                  </Text>
                  {nearingLimit && (
                    <View style={styles.progressBarContainer}>
                      <Text style={styles.warningText}>Você está próximo do limite de decks {isPublic ? 'públicos' : 'privados'}!</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={[styles.button, styles.cancelButton]}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateDeck}
                style={[styles.button, styles.createButton]}
                loading={loading}
                disabled={!name.trim() || loading}
              >
                Criar Deck
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 8,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // espaço para centralizar
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  tagsSection: {
    marginBottom: 24,
  },
  personalizationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    marginRight: 8,
  },
  addTagButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderColor: '#666',
  },
  createButton: {
    backgroundColor: '#6200ee',
  },
  limitCard: {
    marginBottom: 24,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 12,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  warningText: {
    color: '#d97706',
    fontWeight: 'bold',
    marginTop: 8,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visibilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  visibilityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
}); 