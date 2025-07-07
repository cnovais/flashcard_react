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
  ScrollView,
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
import { API_BASE_URL } from '../services/api';

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
      
      // Teste de conectividade primeiro
      try {
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        console.log('🔍 HEALTH CHECK STATUS:', healthResponse.status);
        if (!healthResponse.ok) {
          throw new Error('Backend não está respondendo');
        }
      } catch (healthError) {
        console.error('🔍 ERRO HEALTH CHECK:', healthError);
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        return;
      }
      
      await signInWithEmail(email.trim(), password.trim());
      
      console.log('Login bem-sucedido!');
      
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <ImageBackground
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Title style={styles.appTitle}>Guard Study</Title>
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
              returnKeyType="next"
              blurOnSubmit={false}
              placeholder="seuemail@provedor.com"
            />

            <TextInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleEmailLogin}
              blurOnSubmit={true}
            />

            <Button
              mode="contained"
              onPress={handleEmailLogin}
              style={styles.loginButton}
              disabled={loading}
            >
              Entrar
            </Button>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Não tem uma conta?{' '}
                <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
                  Cadastre-se
                </Text>
              </Text>
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loginCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.text,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.textSecondary,
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
  registerContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  registerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
}); 