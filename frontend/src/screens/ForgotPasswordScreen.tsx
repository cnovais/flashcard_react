import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Preencha o email');
      return;
    }
    try {
      setLoading(true);
      // Chamada para endpoint de envio de código (a ser implementado no backend)
      await api.post('/auth/forgot-password', { email: email.trim() });
      Alert.alert('Sucesso', 'Enviamos um código para seu email.');
      navigation.navigate('ForgotPasswordCode', { email });
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.error || error?.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Recuperar Senha</Title>
      <Paragraph style={styles.subtitle}>Digite seu email para receber um código de recuperação.</Paragraph>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        mode="contained"
        onPress={handleSendCode}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Enviar Código
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