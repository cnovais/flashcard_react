import AsyncStorage from '@react-native-async-storage/async-storage';

// Para desenvolvimento, use o IP da sua máquina em vez de localhost
// Substitua pelo IP da sua máquina na rede local
//rexport const API_BASE_URL = 'http://192.168.0.8:3000'; // IP da sua máquina
export const API_BASE_URL = 'http://localhost:3000';
//export const API_BASE_URL = 'https://d1h379aybkcnk9.cloudfront.net';

// Callback para logout quando token for inválido
let onTokenInvalid: (() => void) | null = null;

export const setTokenInvalidCallback = (callback: () => void) => {
  onTokenInvalid = callback;
};

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('@FlashcardApp:token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'X-Auth-Token': token }),
        ...options.headers,
      },
    };

    console.log(`🌐 API Request: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData: any = {};
      
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Se não conseguir parsear JSON, usar o texto da resposta
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (e2) {
          // Se nada funcionar, usar a mensagem padrão
        }
      }
      
      // Verificar se é erro 401 (token inválido)
      if (response.status === 401) {
        console.log('🔐 TOKEN INVÁLIDO DETECTADO - FAZENDO LOGOUT AUTOMÁTICO');
        
        // Limpar dados do usuário
        await AsyncStorage.removeItem('@FlashcardApp:user');
        await AsyncStorage.removeItem('@FlashcardApp:token');
        
        // Chamar callback de logout se existir
        if (onTokenInvalid) {
          onTokenInvalid();
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).response = { status: response.status, data: errorMessage };
      throw error;
    }
    
    // Aqui faz o parse automático do JSON
    const data = await response.json();
    return { data, status: response.status, ok: response.ok };
  },

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
}; 