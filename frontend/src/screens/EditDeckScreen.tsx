import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Chip,
  Switch,
  useTheme,
  Card,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { DeckService, UpdateDeckRequest, Deck } from '../services/deckService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type EditDeckScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditDeck'>;

interface RouteParams {
  deck: Deck;
}

export default function EditDeckScreen() {
  const navigation = useNavigation<EditDeckScreenNavigationProp>();
  const route = useRoute();
  const theme = useTheme();
  const { deck } = route.params as RouteParams;

  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || '');
  const [tags, setTags] = useState<string[]>(deck.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isPublic, setIsPublic] = useState(deck.isPublic);
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome do deck é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const updateData: UpdateDeckRequest = {
        name: name.trim(),
        description: description.trim(),
        tags,
        isPublic,
      };

      await DeckService.updateDeck(deck.id, updateData);
      Alert.alert('Sucesso', 'Deck atualizado com sucesso', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar deck');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async () => {
    Alert.alert(
      'Excluir Deck',
      'Tem certeza que deseja excluir este deck? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await DeckService.deleteDeck(deck.id);
              Alert.alert('Sucesso', 'Deck excluído com sucesso!');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir o deck.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: Platform.OS === 'ios' ? 40 : 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' }}>Editar Deck</Text>
        <TouchableOpacity onPress={handleDeleteDeck} style={{ padding: 8 }}>
          <MaterialCommunityIcons name="delete" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
            
            <TextInput
              label="Nome do Deck *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Descrição"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                label="Nova tag"
                value={newTag}
                onChangeText={text => setNewTag(text.toLowerCase())}
                style={styles.tagInput}
                mode="outlined"
                onSubmitEditing={addTag}
              />
              <Button mode="contained" onPress={addTag} style={styles.addTagButton}>
                Adicionar
              </Button>
            </View>

            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  onClose={() => removeTag(tag)}
                  style={styles.tagChip}
                  textStyle={styles.tagText}
                >
                  {tag}
                </Chip>
              ))}
            </View>

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
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
          >
            Salvar Alterações
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    marginBottom: 16,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    marginRight: 8,
  },
  addTagButton: {
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
  },
  tagText: {
    fontSize: 12,
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
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    paddingVertical: 8,
  },
}); 