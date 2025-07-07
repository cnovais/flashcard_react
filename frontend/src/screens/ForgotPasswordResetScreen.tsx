import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Paragraph } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../services/api';
import { RootStackParamList } from '../navigation/types';

export default function ForgotPasswordResetScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ForgotPasswordReset'>>();
  const { email, code } = route.params;

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    try {
      setLoading(true);
      // Chamada para endpoint de redefinição de senha (a ser implementado no backend)
      await api.post('/auth/reset-password', { email, code, password });
      Alert.alert('Sucesso', 'Senha redefinida com sucesso!');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.error || error?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Nova Senha</Title>
      <Paragraph style={styles.subtitle}>Digite sua nova senha abaixo.</Paragraph>
      <TextInput
        label="Nova Senha"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
      />
      <TextInput
        label="Confirmar Nova Senha"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
      />
      <Button
        mode="contained"
        onPress={handleResetPassword}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Redefinir Senha
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