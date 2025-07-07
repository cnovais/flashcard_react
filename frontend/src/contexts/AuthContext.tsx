import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { api, setTokenInvalidCallback } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'premium';
  xp: number;
  level: number;
  streak: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  updateUser: (updated: Partial<User>) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔧 AUTH PROVIDER INICIADO');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 AUTH PROVIDER - CARREGANDO USUÁRIO ARMAZENADO');
    loadStoredUser();
  }, []);

  // Configurar callback para logout automático quando token for inválido
  useEffect(() => {
    setTokenInvalidCallback(() => {
      console.log('🔐 CALLBACK DE LOGOUT AUTOMÁTICO EXECUTADO');
      console.log('🔐 USUÁRIO ATUAL:', user);
      setUser(null);
      console.log('🔐 USUÁRIO DEFINIDO COMO NULL - REDIRECIONANDO PARA LOGIN');
    });
  }, [user]);

  const loadStoredUser = async () => {
    console.log('🔧 LOAD STORED USER - INICIANDO');
    try {
      console.log('Carregando usuário armazenado...');
      const storedUser = await AsyncStorage.getItem('@FlashcardApp:user');
      const storedToken = await AsyncStorage.getItem('@FlashcardApp:token');
      
      console.log('🔧 DADOS ARMAZENADOS:');
      console.log('🔧 storedUser:', !!storedUser);
      console.log('🔧 storedToken:', !!storedToken);
      console.log('🔧 storedToken valor:', storedToken ? storedToken.substring(0, 30) + '...' : 'null');
      
      console.log('Dados armazenados:', { storedUser: !!storedUser, storedToken: !!storedToken });
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Usuário parseado:', parsedUser);
        
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          console.log('Usuário definido no contexto:', parsedUser);
        } else {
          console.log('Usuário inválido, limpando dados...');
          await AsyncStorage.removeItem('@FlashcardApp:user');
          await AsyncStorage.removeItem('@FlashcardApp:token');
        }
      } else {
        console.log('Nenhum usuário armazenado encontrado');
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      // Limpar dados corrompidos
      await AsyncStorage.removeItem('@FlashcardApp:user');
      await AsyncStorage.removeItem('@FlashcardApp:token');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await authService.signInWithGoogle();
      
      if (result && result.user && result.user.id) {
        setUser(result.user);
      } else {
        throw new Error('Invalid user data received from Google sign in');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      await AsyncStorage.removeItem('@FlashcardApp:user');
      await AsyncStorage.removeItem('@FlashcardApp:token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      setIsLoading(true);
      const result = await authService.signInWithLinkedIn();
      
      if (result && result.user && result.user.id) {
        setUser(result.user);
      } else {
        throw new Error('Invalid user data received from LinkedIn sign in');
      }
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      await AsyncStorage.removeItem('@FlashcardApp:user');
      await AsyncStorage.removeItem('@FlashcardApp:token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log('🔧 LOGIN INICIADO');
    console.log('🔧 EMAIL:', email);
    console.log('🔧 PASSWORD LENGTH:', password.length);
    
    try {
      setIsLoading(true);
      
      console.log('🔧 FAZENDO REQUISIÇÃO PARA:', '/auth/login');
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      console.log('🔧 STATUS LOGIN:', response.status);
      console.log('🔧 RESPONSE OK:', response.ok);

      if (!response.ok) {
        console.log('🔧 ERRO LOGIN:', response.data);
        throw new Error(response.data.error || 'Login failed');
      }

      const result = response.data;
      console.log('🔧 LOGIN SUCESSO:', !!result.token);
      console.log('🔧 RESULT COMPLETO:', JSON.stringify(result, null, 2));
      
      if (result && result.user && result.token) {
        console.log('🔧 SALVANDO TOKEN...');
        console.log('🔧 TOKEN RECEBIDO:', result.token);
        console.log('🔧 TOKEN LENGTH:', result.token.length);
        console.log('🔧 TOKEN TYPE:', typeof result.token);
        
        // Verificar se o token tem caracteres especiais
        const cleanToken = result.token.trim();
        console.log('🔧 TOKEN LIMPO:', cleanToken);
        console.log('🔧 TOKEN LIMPO LENGTH:', cleanToken.length);
        
        await AsyncStorage.setItem('@FlashcardApp:token', cleanToken);
        await AsyncStorage.setItem('@FlashcardApp:user', JSON.stringify(result.user));
        
        const savedToken = await AsyncStorage.getItem('@FlashcardApp:token');
        console.log('🔧 TOKEN SALVO:', !!savedToken);
        console.log('🔧 TOKEN SALVO VALOR:', savedToken);
        console.log('🔧 TOKEN SALVO LENGTH:', savedToken?.length);
        
        // Verificar se o token salvo é igual ao recebido
        console.log('🔧 TOKENS IGUAIS:', cleanToken === savedToken);
        
        setUser(result.user);
        console.log('🔧 USUÁRIO DEFINIDO:', result.user);
        console.log('🔧 LOGIN CONCLUÍDO COM SUCESSO!');
      } else {
        console.log('🔧 RESPOSTA INVÁLIDA DO SERVIDOR');
        console.log('🔧 RESULT:', result);
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('🔧 ERRO LOGIN:', error);
      console.error('🔧 ERRO MESSAGE:', error.message);
      console.error('🔧 ERRO STACK:', error.stack);
      
      await AsyncStorage.removeItem('@FlashcardApp:user');
      await AsyncStorage.removeItem('@FlashcardApp:token');
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🔧 LOGIN FINALIZADO - LOADING:', false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      await AsyncStorage.removeItem('@FlashcardApp:user');
      await AsyncStorage.removeItem('@FlashcardApp:token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (avatar: string) => {
    try {
      await authService.updateAvatar(avatar);
      if (user) {
        const updatedUser = { ...user, avatar };
        setUser(updatedUser);
        await AsyncStorage.setItem('@FlashcardApp:user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  };

  const updateUser = async (updated: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updated };
      setUser(newUser);
      await AsyncStorage.setItem('@FlashcardApp:user', JSON.stringify(newUser));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      await authService.register(name, email, password);
      // Não faz login automático após cadastro
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      await AsyncStorage.removeItem('@FlashcardApp:user');
      await AsyncStorage.removeItem('@FlashcardApp:token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithEmail,
    signOut,
    updateAvatar,
    updateUser,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 