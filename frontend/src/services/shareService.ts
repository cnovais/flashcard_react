import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { api } from './api';

export interface ShareableDeck {
  id: string;
  title: string;
  description: string;
  cards: Array<{
    question: string;
    answer: string;
    tags?: string[];
    difficulty: number;
  }>;
  tags: string[];
  isPublic: boolean;
  shareCode?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

export interface ShareOptions {
  format: 'json' | 'csv' | 'anki';
  includeImages: boolean;
  includeAudio: boolean;
  includeMetadata: boolean;
}

export class ShareService {
  private static instance: ShareService;

  static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  async shareDeck(deckId: string, options: ShareOptions = {
    format: 'json',
    includeImages: true,
    includeAudio: true,
    includeMetadata: true,
  }): Promise<void> {
    try {
      // Get deck data
      const deck = await this.getDeckForSharing(deckId);
      
      // Generate file content based on format
      const content = await this.generateFileContent(deck, options);
      
      // Create temporary file
      const fileName = `${deck.title.replace(/[^a-zA-Z0-9]/g, '_')}.${options.format}`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: this.getMimeType(options.format),
          dialogTitle: `Compartilhar: ${deck.title}`,
        });
      }

      // Clean up temporary file
      await FileSystem.deleteAsync(filePath, { idempotent: true });

    } catch (error) {
      console.error('Failed to share deck:', error);
      throw error;
    }
  }

  async generateShareLink(deckId: string): Promise<string> {
    try {
      const response = await api.post(`/api/decks/${deckId}/share`);
      return response.data.shareUrl;
    } catch (error) {
      console.error('Failed to generate share link:', error);
      throw error;
    }
  }

  async importDeckFromShareCode(shareCode: string): Promise<string> {
    try {
      const response = await api.post('/api/decks/import', { shareCode });
      return response.data.deckId;
    } catch (error) {
      console.error('Failed to import deck:', error);
      throw error;
    }
  }

  async importDeckFromFile(fileUri: string): Promise<string> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      const deckData = JSON.parse(content);
      
      const response = await api.post('/api/decks/import', { deckData });
      return response.data.deckId;
    } catch (error) {
      console.error('Failed to import deck from file:', error);
      throw error;
    }
  }

  async makeDeckPublic(deckId: string): Promise<void> {
    try {
      await api.put(`/api/decks/${deckId}/public`);
    } catch (error) {
      console.error('Failed to make deck public:', error);
      throw error;
    }
  }

  async makeDeckPrivate(deckId: string): Promise<void> {
    try {
      await api.put(`/api/decks/${deckId}/private`);
    } catch (error) {
      console.error('Failed to make deck private:', error);
      throw error;
    }
  }

  async getPublicDecks(search?: string, tags?: string[]): Promise<ShareableDeck[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tags) params.append('tags', tags.join(','));
      
      const response = await api.get(`/api/decks/public?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get public decks:', error);
      return [];
    }
  }

  async getDeckForSharing(deckId: string): Promise<ShareableDeck> {
    try {
      const response = await api.get(`/api/decks/${deckId}/share`);
      return response.data;
    } catch (error) {
      console.error('Failed to get deck for sharing:', error);
      throw error;
    }
  }

  private async generateFileContent(deck: ShareableDeck, options: ShareOptions): Promise<string> {
    switch (options.format) {
      case 'json':
        return this.generateJSONContent(deck, options);
      case 'csv':
        return this.generateCSVContent(deck, options);
      case 'anki':
        return this.generateAnkiContent(deck, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private generateJSONContent(deck: ShareableDeck, options: ShareOptions): string {
    const exportData: any = {
      title: deck.title,
      description: deck.description,
      cards: deck.cards,
      tags: deck.tags,
    };

    if (options.includeMetadata) {
      exportData.metadata = {
        createdAt: deck.createdAt,
        author: deck.author,
        totalCards: deck.cards.length,
        exportDate: new Date().toISOString(),
        format: 'json',
      };
    }

    return JSON.stringify(exportData, null, 2);
  }

  private generateCSVContent(deck: ShareableDeck, options: ShareOptions): string {
    let csv = 'Question,Answer,Tags,Difficulty\n';
    
    for (const card of deck.cards) {
      const question = `"${card.question.replace(/"/g, '""')}"`;
      const answer = `"${card.answer.replace(/"/g, '""')}"`;
      const tags = `"${(card.tags || []).join(', ')}"`;
      const difficulty = card.difficulty.toString();
      
      csv += `${question},${answer},${tags},${difficulty}\n`;
    }

    return csv;
  }

  private generateAnkiContent(deck: ShareableDeck, options: ShareOptions): string {
    // Generate Anki-compatible format
    let ankiContent = `#separator:tab
#html:true
#tags column:4

`;
    
    for (const card of deck.cards) {
      const question = card.question.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const answer = card.answer.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const tags = (card.tags || []).join(' ');
      
      ankiContent += `${question}\t${answer}\t${deck.title}\t${tags}\n`;
    }

    return ankiContent;
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'anki':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  async shareToSocialMedia(deckId: string, platform: 'twitter' | 'facebook' | 'whatsapp'): Promise<void> {
    try {
      const shareUrl = await this.generateShareLink(deckId);
      const deck = await this.getDeckForSharing(deckId);
      
      let shareText = `Confira este deck de flashcards: ${deck.title}\n\n`;
      shareText += `${shareUrl}`;
      
      // Use platform-specific sharing
      switch (platform) {
        case 'twitter':
          await this.shareToTwitter(shareText);
          break;
        case 'facebook':
          await this.shareToFacebook(shareText, shareUrl);
          break;
        case 'whatsapp':
          await this.shareToWhatsApp(shareText);
          break;
      }
    } catch (error) {
      console.error('Failed to share to social media:', error);
      throw error;
    }
  }

  private async shareToTwitter(text: string): Promise<void> {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    await this.openUrl(twitterUrl);
  }

  private async shareToFacebook(text: string, url: string): Promise<void> {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    await this.openUrl(facebookUrl);
  }

  private async shareToWhatsApp(text: string): Promise<void> {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    await this.openUrl(whatsappUrl);
  }

  private async openUrl(url: string): Promise<void> {
    // This would typically use Linking from React Native
    // For now, we'll just log the URL
    console.log('Opening URL:', url);
  }

  async getShareAnalytics(deckId: string): Promise<{
    totalShares: number;
    totalImports: number;
    uniqueVisitors: number;
    popularPlatforms: Array<{ platform: string; count: number }>;
  }> {
    try {
      const response = await api.get(`/api/decks/${deckId}/share-analytics`);
      return response.data;
    } catch (error) {
      console.error('Failed to get share analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const shareService = ShareService.getInstance(); 