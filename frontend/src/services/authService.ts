import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthResult {
  user: any;
  token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await api.post('/auth/login', { email, password });
      const result = response.data;
      
      // Validate the response
      if (!result || !result.user || !result.token) {
        throw new Error('Invalid response from login');
      }
      
      // Store token and user data
      await AsyncStorage.setItem('@FlashcardApp:token', result.token);
      await AsyncStorage.setItem('@FlashcardApp:user', JSON.stringify(result.user));
      
      return result;
    } catch (error) {
      console.error('Email sign in error:', error);
      // Clear any partial data
      await AsyncStorage.removeItem('@FlashcardApp:token');
      await AsyncStorage.removeItem('@FlashcardApp:user');
      throw error;
    }
  }

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      // Primeiro, obter a URL de autorização do Google
      const urlsResponse = await api.get('/auth/urls');
      const urls = urlsResponse.data;
      
      if (!urls.google) {
        throw new Error('Google OAuth URL not available');
      }

      // Para React Native, você precisará usar uma biblioteca como @react-native-google-signin/google-signin
      // Por enquanto, vamos simular o processo
      console.log('Google OAuth URL:', urls.google);
      
      // TODO: Implementar integração real com Google Sign-In
      // Por enquanto, vamos retornar um erro informativo
      throw new Error('Google Sign-In not yet implemented. Please use email/password login for now.');
      
    } catch (error) {
      console.error('Google sign in error:', error);
      // Clear any partial data
      await AsyncStorage.removeItem('@FlashcardApp:token');
      await AsyncStorage.removeItem('@FlashcardApp:user');
      throw error;
    }
  }

  async signInWithLinkedIn(): Promise<AuthResult> {
    try {
      // Primeiro, obter a URL de autorização do LinkedIn
      const urlsResponse = await api.get('/auth/urls');
      const urls = urlsResponse.data;
      
      if (!urls.linkedin) {
        throw new Error('LinkedIn OAuth URL not available');
      }

      // Para React Native, você precisará usar uma biblioteca específica para LinkedIn
      console.log('LinkedIn OAuth URL:', urls.linkedin);
      
      // TODO: Implementar integração real com LinkedIn Sign-In
      throw new Error('LinkedIn Sign-In not yet implemented. Please use email/password login for now.');
      
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      // Clear any partial data
      await AsyncStorage.removeItem('@FlashcardApp:token');
      await AsyncStorage.removeItem('@FlashcardApp:user');
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      // Clear local storage
      await AsyncStorage.removeItem('@FlashcardApp:token');
      await AsyncStorage.removeItem('@FlashcardApp:user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getStoredUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem('@FlashcardApp:user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@FlashcardApp:token');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async updateAvatar(avatar: string): Promise<void> {
    try {
      await api.put('/api/user/avatar', { avatar });
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const result = response.data;
      if (!result || !result.user || !result.token) {
        throw new Error('Invalid response from register');
      }
      await AsyncStorage.setItem('@FlashcardApp:token', result.token);
      await AsyncStorage.setItem('@FlashcardApp:user', JSON.stringify(result.user));
      return result;
    } catch (error) {
      console.error('Register error:', error);
      await AsyncStorage.removeItem('@FlashcardApp:token');
      await AsyncStorage.removeItem('@FlashcardApp:user');
      throw error;
    }
  }
}

export const authService = AuthService.getInstance(); 