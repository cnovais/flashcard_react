import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph, Button, Chip, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { theme } from '../theme';
import { CardService, CreateCardRequest } from '../services/cardService';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/types';

type CreateCardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateCard'>;
type CreateCardScreenRouteProp = RouteProp<RootStackParamList, 'CreateCard'>;

export default function CreateCardScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cardType, setCardType] = useState<'open' | 'alternatives'>('open');
  const [alternatives, setAlternatives] = useState<string[]>(['', '']);
  const [correctAlternative, setCorrectAlternative] = useState<number | null>(null);
  
  const navigation = useNavigation<CreateCardScreenNavigationProp>();
  const route = useRoute<CreateCardScreenRouteProp>();
  const { deckId } = route.params;
  const { addXP } = useGamification();
  const { user } = useAuth();

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao selecionar imagem');
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para gravar áudio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao iniciar gravação');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUrl(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao parar gravação');
    }
  };

  const playAudio = async () => {
    if (!audioUrl) return;

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao reproduzir áudio');
    }
  };

  const removeImage = () => {
    setImageUrl(null);
  };

  const removeAudio = () => {
    setAudioUrl(null);
  };

  const handleAlternativeChange = (text: string, idx: number) => {
    setAlternatives(prev => prev.map((alt, i) => i === idx ? text : alt));
  };

  const addAlternative = () => {
    if (alternatives.length < 4) {
      setAlternatives(prev => [...prev, '']);
    }
  };

  const removeAlternative = (idx: number) => {
    if (alternatives.length <= 2) return;
    setAlternatives(prev => prev.filter((_, i) => i !== idx));
    if (correctAlternative === idx) setCorrectAlternative(null);
    else if (correctAlternative !== null && correctAlternative > idx) setCorrectAlternative(correctAlternative - 1);
  };

  const handleCreateCard = async () => {
    if (!question.trim()) {
      Alert.alert('Erro', 'Pergunta é obrigatória');
      return;
    }
    if (cardType === 'open' && !answer.trim()) {
      Alert.alert('Erro', 'Resposta é obrigatória');
      return;
    }
    if (cardType === 'alternatives') {
      if (alternatives.some(a => !a.trim())) {
        Alert.alert('Erro', 'Todas as alternativas devem ser preenchidas');
        return;
      }
      if (alternatives.length < 2) {
        Alert.alert('Erro', 'Adicione pelo menos 2 alternativas');
        return;
      }
      if (alternatives.length > 4) {
        Alert.alert('Erro', 'Máximo de 4 alternativas permitidas');
        return;
      }
      if (correctAlternative === null) {
        Alert.alert('Erro', 'Selecione a alternativa correta');
        return;
      }
    }
    try {
      setLoading(true);
      const cardData: any = {
        deck_id: deckId,
        question: question.trim(),
        tags,
        difficulty,
        image_url: imageUrl || undefined,
        audio_url: audioUrl || undefined,
      };
      if (cardType === 'open') {
        cardData.answer = answer.trim();
      } else {
        cardData.answer = alternatives[correctAlternative!].trim();
        cardData.alternatives = alternatives;
        cardData.correctAlternative = correctAlternative;
      }
      await CardService.createCard(cardData);
      addXP(10);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Limite atingido', error?.response?.data?.error || 'Falha ao criar o card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Card</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pergunta</Text>
            <TextInput
              style={styles.textArea}
              value={question}
              onChangeText={setQuestion}
              placeholder="Digite a pergunta..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Resposta</Text>
            {cardType === 'open' && (
              <TextInput
                style={styles.textArea}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Digite a resposta..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Card</Text>
            <View style={styles.cardTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.cardTypeButton,
                  cardType === 'open' && styles.cardTypeButtonActive
                ]}
                onPress={() => setCardType('open')}
              >
                <Text style={[
                  styles.cardTypeText,
                  cardType === 'open' && styles.cardTypeTextActive
                ]}>
                  Aberto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cardTypeButton,
                  cardType === 'alternatives' && styles.cardTypeButtonActive
                ]}
                onPress={() => setCardType('alternatives')}
              >
                <Text style={[
                  styles.cardTypeText,
                  cardType === 'alternatives' && styles.cardTypeTextActive
                ]}>
                  Alternativas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {cardType === 'alternatives' && (
            <>
              {alternatives.map((alternative, index) => (
                <View key={index} style={styles.inputGroup}>
                  <Text style={styles.label}>Alternativa {index + 1}</Text>
                  <View style={styles.alternativeContainer}>
                    <TextInput
                      style={[styles.textArea, styles.alternativeInput]}
                      value={alternative}
                      onChangeText={(text) => handleAlternativeChange(text, index)}
                      placeholder={`Digite a alternativa ${index + 1}...`}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      style={[
                        styles.correctButton,
                        correctAlternative === index && styles.correctButtonActive
                      ]}
                      onPress={() => setCorrectAlternative(index)}
                    >
                      <MaterialCommunityIcons 
                        name={correctAlternative === index ? "check-circle" : "circle-outline"} 
                        size={24} 
                        color={correctAlternative === index ? "#fff" : theme.colors.primary} 
                      />
                    </TouchableOpacity>
                    {alternatives.length > 2 && (
                      <TouchableOpacity
                        style={styles.removeAlternativeButton}
                        onPress={() => removeAlternative(index)}
                      >
                        <MaterialCommunityIcons name="close" size={20} color="#FF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              
              {alternatives.length < 4 && (
                <TouchableOpacity
                  style={styles.addAlternativeButton}
                  onPress={addAlternative}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                  <Text style={styles.addAlternativeText}>Adicionar Alternativa</Text>
                </TouchableOpacity>
              )}
              
              <Text style={styles.alternativeHelpText}>
                Toque no círculo para marcar a alternativa correta
              </Text>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (opcional)</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.textInput, styles.tagInput]}
                value={newTag}
                onChangeText={text => setNewTag(text.toLowerCase())}
                placeholder="Nova tag"
                onSubmitEditing={addTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={addTag}
              >
                <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imagem (opcional)</Text>
            {imageUrl ? (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                <View style={styles.mediaActions}>
                  <TouchableOpacity style={styles.mediaActionButton} onPress={pickImage}>
                    <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary} />
                    <Text style={styles.mediaActionText}>Alterar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.mediaActionButton} onPress={removeImage}>
                    <MaterialCommunityIcons name="delete" size={20} color="#FF4444" />
                    <Text style={[styles.mediaActionText, { color: '#FF4444' }]}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary} />
                <Text style={styles.mediaButtonText}>Adicionar Imagem</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Áudio (opcional)</Text>
            {audioUrl ? (
              <View style={styles.mediaPreview}>
                <View style={styles.audioPreview}>
                  <TouchableOpacity style={styles.audioPlayButton} onPress={playAudio}>
                    <MaterialCommunityIcons name="play" size={24} color={theme.colors.primary} />
                    <Text style={styles.audioPlayText}>Reproduzir Áudio</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mediaActions}>
                  <TouchableOpacity style={styles.mediaActionButton} onPress={isRecording ? stopRecording : startRecording}>
                    <MaterialCommunityIcons name={isRecording ? "stop" : "microphone"} size={20} color={theme.colors.primary} />
                    <Text style={styles.mediaActionText}>{isRecording ? 'Parar' : 'Regravar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.mediaActionButton} onPress={removeAudio}>
                    <MaterialCommunityIcons name="delete" size={20} color="#FF4444" />
                    <Text style={[styles.mediaActionText, { color: '#FF4444' }]}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.mediaButton, isRecording && styles.recordingButton]} 
                onPress={isRecording ? stopRecording : startRecording}
              >
                <MaterialCommunityIcons 
                  name={isRecording ? "stop" : "microphone"} 
                  size={24} 
                  color={isRecording ? "#fff" : theme.colors.primary} 
                />
                <Text style={[styles.mediaButtonText, isRecording && styles.recordingButtonText]}>
                  {isRecording ? 'Parar Gravação' : 'Gravar Áudio'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dificuldade</Text>
            <View style={styles.difficultyContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level && styles.difficultyButtonActive
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text style={[
                    styles.difficultyText,
                    difficulty === level && styles.difficultyTextActive
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.difficultyLabel}>
              {difficulty === 1 && 'Muito fácil'}
              {difficulty === 2 && 'Fácil'}
              {difficulty === 3 && 'Médio'}
              {difficulty === 4 && 'Difícil'}
              {difficulty === 5 && 'Muito difícil'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fixedCreateButton} 
        onPress={handleCreateCard}
        disabled={loading}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.fixedCreateButtonText}>
          {loading ? 'Criando...' : 'Criar Card'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 80,
    gap: 24,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 48,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fixedCreateButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fixedCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaActionButton: {
    padding: 8,
  },
  mediaActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  mediaButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  recordingButton: {
    backgroundColor: theme.colors.primary,
  },
  recordingButtonText: {
    color: '#fff',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioPlayButton: {
    padding: 8,
  },
  audioPlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  difficultyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  difficultyButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  difficultyTextActive: {
    color: '#fff',
  },
  difficultyLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  cardTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  cardTypeButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cardTypeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  cardTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardTypeTextActive: {
    color: '#fff',
  },
  alternativeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alternativeInput: {
    flex: 1,
  },
  correctButton: {
    padding: 8,
  },
  correctButtonActive: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  removeAlternativeButton: {
    padding: 8,
  },
  addAlternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  addAlternativeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  alternativeHelpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
}); 