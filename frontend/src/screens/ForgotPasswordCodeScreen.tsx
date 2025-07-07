import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Paragraph } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../services/api';
import { RootStackParamList } from '../navigation/types';

export default function ForgotPasswordCodeScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ForgotPasswordCode'>>();
  const { email } = route.params;

  const handleValidateCode = async () => {
    if (!code.trim()) {
      Alert.alert('Erro', 'Digite o código recebido por email');
      return;
    }
    try {
      setLoading(true);
      // Chamada para endpoint de validação do código (a ser implementado no backend)
      await api.post('/auth/validate-reset-code', { email, code: code.trim() });
      Alert.alert('Sucesso', 'Código validado! Agora cadastre uma nova senha.');
      navigation.navigate('ForgotPasswordReset', { email, code: code.trim() });
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.error || error?.message || 'Erro ao validar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Validar Código</Title>
      <Paragraph style={styles.subtitle}>Digite o código que você recebeu no seu email.</Paragraph>
      <TextInput
        label="Código"
        value={code}
        onChangeText={setCode}
        style={styles.input}
        mode="outlined"
        keyboardType="number-pad"
        autoCapitalize="none"
      />
      <Button
        mode="contained"
        onPress={handleValidateCode}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Validar Código
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        disabled={loading}
      >
        Voltar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  backButton: {
    marginTop: 0,
  },
}); 