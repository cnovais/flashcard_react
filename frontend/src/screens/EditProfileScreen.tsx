import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': user?.token || '',
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar perfil');
      }
      // Atualizar contexto do usuário
      updateUser({ ...user, name });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Editar Perfil" />
        <Card.Content>
          <TextInput
            label="Nome"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
            autoCapitalize="words"
          />
          <TextInput
            label="E-mail"
            value={email}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={false}
            disabled
          />
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: 16 }}
            disabled={loading}
          >
            Salvar
          </Button>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            Cancelar
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 8,
  },
  input: {
    marginBottom: 12,
  },
}); 