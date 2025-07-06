import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

export interface Deck {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  color?: string;
  border?: string;
  background?: string;
  cardCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeckRequest {
  name: string;
  description?: string;
  tags?: string[];
  color?: string;
  border?: string;
  background?: string;
  isPublic?: boolean;
}

export interface UpdateDeckRequest {
  name: string;
  description?: string;
  tags?: string[];
  color?: string;
  border?: string;
  background?: string;
  isPublic?: boolean;
}

export class DeckService {
  static async getDecks(visibility: 'all' | 'public' | 'private' = 'all', search: string = ''): Promise<Deck[]> {
    try {
      console.log('=== DECK SERVICE - GET DECKS ===');
      
      // Obter token
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      console.log('🔍 TOKEN ENCONTRADO:', !!token);
      
      if (!token) {
        throw new Error('No token found');
      }
      
      // Limpar token
      const cleanToken = token.trim();
      console.log('🔍 TOKEN LIMPO LENGTH:', cleanToken.length);
      
      // Montar query params
      const params = new URLSearchParams();
      if (visibility && visibility !== 'all') params.append('visibility', visibility);
      if (search) params.append('search', search);
      const url = `${API_BASE_URL}/api/decks${params.toString() ? '?' + params.toString() : ''}`;
      console.log('🔍 URL:', url);
      
      // Headers com X-Auth-Token
      const headers = {
        'Content-Type': 'application/json',
        'X-Auth-Token': cleanToken,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      };
      
      console.log('🔍 HEADERS ENVIADOS:', JSON.stringify(headers, null, 2));
      
      // Fazer requisição
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      });
      
      console.log('🔍 STATUS:', response.status);
      console.log('🔍 OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DADOS RECEBIDOS:', data);
        return data.map((d: any) => ({
          ...d,
          cardCount: d.card_count,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          isPublic: d.is_public,
        }));
      } else {
        const errorData = await response.json();
        console.log('🔍 ERRO:', errorData);
        throw new Error(errorData.error || 'Failed to get decks');
      }
    } catch (error: any) {
      console.error('=== ERRO NO DECK SERVICE ===');
      console.error('Failed to get decks:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  }

  static async getDeck(id: string): Promise<Deck> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decks/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get deck');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get deck:', error);
      throw error;
    }
  }

  static async createDeck(data: CreateDeckRequest): Promise<Deck> {
    try {
      console.log('=== DECK SERVICE - CREATE DECK ===');
      
      // Obter token
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      console.log('🔍 TOKEN ENCONTRADO:', !!token);
      
      if (!token) {
        throw new Error('No token found');
      }
      
      // Limpar token
      const cleanToken = token.trim();
      console.log('🔍 TOKEN LIMPO LENGTH:', cleanToken.length);
      
      // URL - VOLTANDO PARA PORTA 3000
      const url = `${API_BASE_URL}/api/decks`;
      console.log('🔍 URL:', url);
      console.log('🔍 DATA:', JSON.stringify(data, null, 2));
      
      // Headers com X-Auth-Token
      const headers = {
        'Content-Type': 'application/json',
        'X-Auth-Token': cleanToken,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      };
      
      console.log('🔍 HEADERS ENVIADOS:', JSON.stringify(headers, null, 2));
      
      // Fazer requisição
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      });
      
      console.log('🔍 STATUS:', response.status);
      console.log('🔍 OK:', response.ok);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('🔍 DADOS RECEBIDOS:', responseData);
        return responseData;
      } else {
        const errorData = await response.json();
        console.log('🔍 ERRO:', errorData);
        throw new Error(errorData.error || 'Failed to create deck');
      }
    } catch (error: any) {
      console.error('=== ERRO NO DECK SERVICE ===');
      console.error('Failed to create deck:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  }

  static async updateDeck(id: string, data: UpdateDeckRequest): Promise<Deck> {
    try {
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      if (!token) throw new Error('No token found');
      const url = `${API_BASE_URL}/api/decks/${id}`;
      const headers = {
        'Content-Type': 'application/json',
        'X-Auth-Token': token.trim(),
      };
      const response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(data) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update deck');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to update deck:', error);
      throw error;
    }
  }

  static async deleteDeck(id: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      if (!token) throw new Error('No token found');
      const url = `${API_BASE_URL}/api/decks/${id}`;
      const headers = {
        'Content-Type': 'application/json',
        'X-Auth-Token': token.trim(),
      };
      const response = await fetch(url, { method: 'DELETE', headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete deck');
      }
    } catch (error) {
      console.error('Failed to delete deck:', error);
      throw error;
    }
  }

  static async favoriteDeck(deckId: string): Promise<void> {
    const token = await AsyncStorage.getItem('@FlashcardApp:token');
    if (!token) throw new Error('No token found');
    const url = `${API_BASE_URL}/api/decks/favorite/${deckId}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Token': token.trim(),
    };
    const response = await fetch(url, { method: 'POST', headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to favorite deck');
    }
  }

  static async unfavoriteDeck(deckId: string): Promise<void> {
    const token = await AsyncStorage.getItem('@FlashcardApp:token');
    if (!token) throw new Error('No token found');
    const url = `${API_BASE_URL}/api/decks/favorite/${deckId}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Token': token.trim(),
    };
    const response = await fetch(url, { method: 'DELETE', headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to unfavorite deck');
    }
  }

  static async getFavoriteDeckIds(): Promise<string[]> {
    const token = await AsyncStorage.getItem('@FlashcardApp:token');
    if (!token) throw new Error('No token found');
    const url = `${API_BASE_URL}/api/decks/favorites`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Token': token.trim(),
    };
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get favorite decks');
    }
    const data = await response.json();
    return data.favorite_deck_ids || [];
  }
} 