import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Surface,
  Title,
  Paragraph,
  IconButton,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

const { width, height } = Dimensions.get('window');

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithLinkedIn, signInWithEmail } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Erro', 'Falha no login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      setLoading(true);
      await signInWithLinkedIn();
    } catch (error) {
      Alert.alert('Erro', 'Falha no login com LinkedIn');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    try {
      setLoading(true);
      console.log('Tentando login com:', { email: email.trim() });
      
      await signInWithEmail(email.trim(), password.trim());
      
      console.log('Login bem-sucedido!');
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      
      // O AuthContext vai gerenciar a navegação automaticamente
      // Não precisamos navegar manualmente
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      const msg = error?.message || 'Erro ao fazer login';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>📚</Text>
            </View>
            <Title style={styles.appTitle}>FlashCard Pro</Title>
            <Paragraph style={styles.appSubtitle}>
              Aprenda de forma inteligente e divertida
            </Paragraph>
          </View>

          <Surface style={styles.loginCard}>
            <Title style={styles.welcomeTitle}>Bem-vindo!</Title>
            <Paragraph style={styles.welcomeSubtitle}>
              Faça login para continuar seus estudos
            </Paragraph>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <Text style={styles.socialButtonText}>🔍 Continuar com Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.linkedinButton]}
                onPress={handleLinkedInSignIn}
                disabled={loading}
              >
                <Text style={styles.socialButtonText}>💼 Continuar com LinkedIn</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />

            <Button
              mode="contained"
              onPress={handleEmailLogin}
              style={styles.loginButton}
              disabled={loading}
            >
              Entrar
            </Button>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>
          </Surface>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Não tem uma conta?{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>Cadastre-se</Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  socialButtons: {
    marginBottom: 20,
  },
  socialButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  footerLink: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 