import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { api } from './api';

export interface SyncItem {
  id: string;
  type: 'deck' | 'card' | 'study_session' | 'achievement';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface SyncStatus {
  lastSync: number;
  pendingItems: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export class SyncService {
  private static instance: SyncService;
  private syncQueue: SyncItem[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize(): Promise<void> {
    // Load sync queue from storage
    await this.loadSyncQueue();
    
    // Set up network monitoring
    this.setupNetworkMonitoring();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Initial sync if online
    if (this.isOnline) {
      await this.sync();
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (!wasOnline && this.isOnline) {
        // Came back online, sync immediately
        this.sync();
      }
    });
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  async addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const syncItem: SyncItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      synced: false,
    };

    this.syncQueue.push(syncItem);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.sync();
    }
  }

  async sync(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      const itemsToSync = this.syncQueue.filter(item => !item.synced);
      
      for (const item of itemsToSync) {
        await this.syncItem(item);
        item.synced = true;
      }

      // Remove synced items from queue
      this.syncQueue = this.syncQueue.filter(item => !item.synced);
      await this.saveSyncQueue();

      // Update last sync timestamp
      await AsyncStorage.setItem('last_sync', Date.now().toString());

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItem(item: SyncItem): Promise<void> {
    try {
      switch (item.type) {
        case 'deck':
          await this.syncDeck(item);
          break;
        case 'card':
          await this.syncCard(item);
          break;
        case 'study_session':
          await this.syncStudySession(item);
          break;
        case 'achievement':
          await this.syncAchievement(item);
          break;
      }
    } catch (error) {
      console.error(`Failed to sync ${item.type}:`, error);
      throw error;
    }
  }

  private async syncDeck(item: SyncItem): Promise<void> {
    switch (item.action) {
      case 'create':
        await api.post('/api/decks', item.data);
        break;
      case 'update':
        await api.put(`/api/decks/${item.data.id}`, item.data);
        break;
      case 'delete':
        await api.delete(`/api/decks/${item.data.id}`);
        break;
    }
  }

  private async syncCard(item: SyncItem): Promise<void> {
    switch (item.action) {
      case 'create':
        await api.post('/api/cards', item.data);
        break;
      case 'update':
        await api.put(`/api/cards/${item.data.id}`, item.data);
        break;
      case 'delete':
        await api.delete(`/api/cards/${item.data.id}`);
        break;
    }
  }

  private async syncStudySession(item: SyncItem): Promise<void> {
    await api.post('/api/study-sessions', item.data);
  }

  private async syncAchievement(item: SyncItem): Promise<void> {
    await api.post('/api/achievements', item.data);
  }

  async pullFromServer(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    try {
      const lastSync = await AsyncStorage.getItem('last_sync');
      const lastSyncTime = lastSync ? parseInt(lastSync) : 0;

      // Pull decks
      const decksResponse = await api.get(`/api/decks?since=${lastSyncTime}`);
      await this.updateLocalData('decks', decksResponse.data);

      // Pull cards - TODO: Backend doesn't have a route to get all cards
      // const cardsResponse = await api.get(`/api/cards?since=${lastSyncTime}`);
      // await this.updateLocalData('cards', cardsResponse.data);

      // Pull study sessions
      const sessionsResponse = await api.get(`/api/study-sessions?since=${lastSyncTime}`);
      await this.updateLocalData('study_sessions', sessionsResponse.data);

    } catch (error) {
      console.error('Failed to pull from server:', error);
    }
  }

  private async updateLocalData(type: string, data: any[]): Promise<void> {
    try {
      const key = `local_${type}`;
      const existingData = await AsyncStorage.getItem(key);
      const existing = existingData ? JSON.parse(existingData) : [];

      // Merge with existing data
      const merged = this.mergeData(existing, data);
      await AsyncStorage.setItem(key, JSON.stringify(merged));
    } catch (error) {
      console.error(`Failed to update local ${type}:`, error);
    }
  }

  private mergeData(existing: any[], incoming: any[]): any[] {
    const merged = [...existing];
    
    for (const item of incoming) {
      const existingIndex = merged.findIndex(e => e.id === item.id);
      if (existingIndex >= 0) {
        // Update existing item if incoming is newer
        if (item.updatedAt > merged[existingIndex].updatedAt) {
          merged[existingIndex] = item;
        }
      } else {
        // Add new item
        merged.push(item);
      }
    }

    return merged;
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const lastSync = await AsyncStorage.getItem('last_sync');
    
    return {
      lastSync: lastSync ? parseInt(lastSync) : 0,
      pendingItems: this.syncQueue.filter(item => !item.synced).length,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }

  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
  }

  async forceSync(): Promise<void> {
    await this.sync();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance(); 