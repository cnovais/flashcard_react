import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  alternatives?: string[];
  correctAlternative?: number;
  imageUrl?: string;
  audioUrl?: string;
  tags?: string[];
  difficulty: number;
  lastReviewed?: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  deck_id: string;
  question: string;
  answer?: string;
  alternatives?: string[];
  correctAlternative?: number;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  difficulty?: number;
}

export interface UpdateCardRequest {
  question: string;
  answer?: string;
  alternatives?: string[];
  correctAlternative?: number | null;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
  difficulty?: number;
}

export class CardService {
  static async getCards(deckId: string): Promise<Flashcard[]> {
    try {
      console.log('=== CARD SERVICE - GET CARDS ===');
      
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
      const url = `${API_BASE_URL}/api/cards/deck/${deckId}`;
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
        return data;
      } else {
        const errorData = await response.json();
        console.log('🔍 ERRO:', errorData);
        throw new Error(errorData.error || 'Failed to get cards');
      }
    } catch (error: any) {
      console.error('=== ERRO NO CARD SERVICE ===');
      console.error('Failed to get cards:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  }

  static async createCard(data: CreateCardRequest): Promise<Flashcard> {
    try {
      console.log('=== CARD SERVICE - CREATE CARD ===');
      
      // Obter token
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      console.log('🔍 TOKEN ENCONTRADO:', !!token);
      
      if (!token) {
        throw new Error('No token found');
      }
      
      // Limpar token
      const cleanToken = token.trim();
      console.log('🔍 TOKEN LIMPO LENGTH:', cleanToken.length);
      
      // URL - SEM BARRA FINAL para evitar redirect 307
      const url = `${API_BASE_URL}/api/cards`;
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
        throw new Error(errorData.error || 'Failed to create card');
      }
    } catch (error: any) {
      console.error('=== ERRO NO CARD SERVICE ===');
      console.error('Failed to create card:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  }

  static async updateCard(id: string, data: UpdateCardRequest): Promise<Flashcard> {
    try {
      console.log('=== CARD SERVICE - UPDATE CARD ===');
      
      // Obter token
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      console.log('🔍 TOKEN ENCONTRADO:', !!token);
      
      if (!token) {
        throw new Error('No token found');
      }
      
      // Limpar token
      const cleanToken = token.trim();
      console.log('🔍 TOKEN LIMPO LENGTH:', cleanToken.length);
      
      // URL
      const url = `${API_BASE_URL}/api/cards/${id}`;
      console.log('�� URL:', url);
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
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update card');
      }
    } catch (error: any) {
      console.error('=== ERRO NO CARD SERVICE ===');
      console.error('Failed to update card:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  }

  static async deleteCard(id: string): Promise<void> {
    try {
      console.log('=== CARD SERVICE - DELETE CARD ===');
      
      // Obter token
      const token = await AsyncStorage.getItem('@FlashcardApp:token');
      console.log('🔍 TOKEN ENCONTRADO:', !!token);
      
      if (!token) {
        throw new Error('No token found');
      }
      
      // Limpar token
      const cleanToken = token.trim();
      console.log('🔍 TOKEN LIMPO LENGTH:', cleanToken.length);
      
      // URL
      const url = `${API_BASE_URL}/api/cards/${id}`;
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
        method: 'DELETE',
        headers: headers,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      });
      
      console.log('🔍 STATUS:', response.status);
      console.log('🔍 OK:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 ERRO:', errorData);
        throw new Error(errorData.error || 'Failed to delete card');
      }
    } catch (error: any) {
      console.error('=== ERRO NO CARD SERVICE ===');
      console.error('Failed to delete card:', error);
      console.error('Detalhes do erro:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  }
} 