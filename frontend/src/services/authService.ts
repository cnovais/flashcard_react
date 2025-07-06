import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthResult {
  user: any;
  token: string;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      // Mock authentication for now
      const response = await api.get('/auth/google');
      const result = response.data;
      
      // Validate the response
      if (!result || !result.user || !result.token) {
        throw new Error('Invalid response from Google authentication');
      }
      
      // Store token and user data
      await AsyncStorage.setItem('@FlashcardApp:token', result.token);
      await AsyncStorage.setItem('@FlashcardApp:user', JSON.stringify(result.user));
      
      return result;
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
      // Mock authentication for now
      const response = await api.get('/auth/linkedin');
      const result = response.data;
      
      // Validate the response
      if (!result || !result.user || !result.token) {
        throw new Error('Invalid response from LinkedIn authentication');
      }
      
      // Store token and user data
      await AsyncStorage.setItem('@FlashcardApp:token', result.token);
      await AsyncStorage.setItem('@FlashcardApp:user', JSON.stringify(result.user));
      
      return result;
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
      
      // Clear API headers
      delete api.defaults.headers.authorization;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
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
}

export const authService = AuthService.getInstance(); 