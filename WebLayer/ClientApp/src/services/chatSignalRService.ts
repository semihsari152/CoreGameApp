import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Message, TypingIndicator, MessageReadEvent, ReactionUpdateEvent } from '../types/messaging';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

class ChatSignalRService {
  private connection: HubConnection | null = null;
  private connectionPromise: Promise<void> | null = null;

  // Event callbacks
  private onMessageReceived: ((message: Message) => void) | null = null;
  private onUserTyping: ((indicator: TypingIndicator) => void) | null = null;
  private onUserStoppedTyping: ((indicator: TypingIndicator) => void) | null = null;
  private onMessageRead: ((event: MessageReadEvent) => void) | null = null;
  private onReactionUpdate: ((event: ReactionUpdateEvent) => void) | null = null;
  private onMessageError: ((error: string) => void) | null = null;
  
  // Global state
  private isOnChatPage: boolean = false;
  private currentUserId: number | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  

  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.connection?.state === 'Connected') {
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Force cleanup any existing connection first
    if (this.connection) {
      console.log('Cleaning up existing connection...');
      try {
        if (this.connection.state !== 'Disconnected') {
          await this.connection.stop();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      this.connection = null;
    }

    const token = Cookies.get('accessToken');
    if (!token) {
      throw new Error('No authentication token available');
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5124'}/chatHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    // Event handlers
    this.connection.on('ReceiveMessage', (message: Message) => {
      console.log('Message received:', message);
      
      // Chat sayfasında değilsek ve mesaj başka birinden geldiyse toast göster
      if (!this.isOnChatPage && this.currentUserId && message.sender.id !== this.currentUserId) {
        const senderName = message.sender.firstName && message.sender.lastName 
          ? `${message.sender.firstName} ${message.sender.lastName}`
          : message.sender.username;
        
        const content = message.content || 'Medya mesajı';
        const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
        
        // Dark mode kontrolü
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        toast.success(`💬 ${senderName}: ${shortContent}`, {
          duration: 6000,
          position: 'top-right',
          id: `chat-${message.id}`, // Her mesaj için unique ID
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f9fafb' : '#374151',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '20px',
            boxShadow: isDarkMode 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 12px 24px -6px rgba(0, 0, 0, 0.3)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 12px 24px -6px rgba(0, 0, 0, 0.15)',
            padding: '20px 24px',
            minWidth: '420px',
            maxWidth: '500px',
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '1.5',
            cursor: 'pointer',
            borderLeft: '6px solid #3b82f6',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            transition: 'all 0.3s ease',
            transform: 'scale(1.02)'
          }
        });
        
        // Toast'a tıklama event'i ekle
        setTimeout(() => {
          const toastElement = document.querySelector(`[data-id="chat-${message.id}"]`);
          if (toastElement) {
            toastElement.addEventListener('click', () => {
              window.location.href = '/chat';
            });
          }
        }, 100);
      }
      
      this.onMessageReceived?.(message);
    });

    this.connection.on('UserTyping', (indicator: TypingIndicator) => {
      console.log('User typing:', indicator);
      this.onUserTyping?.(indicator);
    });

    this.connection.on('UserStoppedTyping', (indicator: TypingIndicator) => {
      console.log('User stopped typing:', indicator);
      this.onUserStoppedTyping?.(indicator);
    });

    this.connection.on('MessageRead', (event: MessageReadEvent) => {
      console.log('Message read:', event);
      this.onMessageRead?.(event);
    });

    this.connection.on('ReactionUpdate', (event: ReactionUpdateEvent) => {
      console.log('Reaction update:', event);
      this.onReactionUpdate?.(event);
    });

    this.connection.on('MessageError', (errorMessage: string) => {
      console.log('Message error received:', errorMessage);
      
      // Güzel merkezi bir hata kartı göster
      this.showFriendshipErrorModal();
      
      this.onMessageError?.(errorMessage);
    });


    // Connection lifecycle
    this.connection.onreconnecting(() => {
      console.log('Chat SignalR reconnecting...');
    });

    this.connection.onreconnected(() => {
      console.log('Chat SignalR reconnected successfully');
    });

    this.connection.onclose((error) => {
      console.log('Chat SignalR connection closed:', (error as Error)?.message || 'Clean disconnect');
      this.connectionPromise = null;
      
      // Only auto-reconnect if it was an unexpected disconnection (not during development hot-reload)
      if (error && !(error as Error)?.message?.includes('canceled') && process.env.NODE_ENV === 'production') {
        console.log('Auto-reconnecting in 5 seconds...');
        setTimeout(() => {
          if (!this.connection || this.connection.state === 'Disconnected') {
            this.connect().catch(console.error);
          }
        }, 5000);
      }
    });

    this.connectionPromise = this.connection.start();
    await this.connectionPromise;
    console.log('Chat SignalR connected successfully');
    
    // Start heartbeat to keep user online
    this.startHeartbeat();
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    
    if (!this.connection) {
      return;
    }

    
    try {
      if (this.connection.state !== 'Disconnected') {
        await Promise.race([
          this.connection.stop(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
        ]);
      }
    } catch (error) {
      // Ignore all disconnect errors
    } finally {
      this.connection = null;
      this.connectionPromise = null;
    }
  }

  // Heartbeat sistemi
  private startHeartbeat(): void {
    // Her 30 saniyede bir aktiviteyi güncelle
    this.heartbeatInterval = setInterval(() => {
      if (this.connection?.state === 'Connected') {
        this.connection.invoke('UpdateActivity').catch(error => {
          console.error('Error updating activity:', error);
        });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Konuşmaya katıl
  async joinConversation(conversationId: number): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('JoinConversation', conversationId);
    }
  }

  // Konuşmadan ayrıl
  async leaveConversation(conversationId: number): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('LeaveConversation', conversationId);
    }
  }

  // Mesaj gönder
  async sendMessage(
    conversationId: number, 
    content?: string, 
    mediaUrl?: string, 
    mediaType?: string, 
    replyToMessageId?: number
  ): Promise<void> {
    console.log('SignalR sendMessage called:', { conversationId, content, mediaUrl, mediaType, replyToMessageId });
    console.log('Connection state:', this.connection?.state);
    
    if (this.connection?.state === 'Connected') {
      console.log('Invoking SendMessage on SignalR connection');
      await this.connection.invoke('SendMessage', conversationId, content, mediaUrl, mediaType, replyToMessageId);
      console.log('SendMessage invoked successfully');
    } else {
      console.error('SignalR connection not connected. State:', this.connection?.state);
    }
  }

  // Mesaj okundu olarak işaretle
  async markMessageAsRead(messageId: number): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('MarkMessageAsRead', messageId);
    }
  }

  // Mesaja tepki ekle/kaldır
  async toggleReaction(messageId: number, emoji: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('ToggleReaction', messageId, emoji);
    }
  }

  // Yazıyor bildirimi gönder
  async sendTyping(conversationId: number): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('SendTyping', conversationId);
    }
  }

  // Yazıyor bildirimini durdur
  async stopTyping(conversationId: number): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('StopTyping', conversationId);
    }
  }

  // Event handlers
  setOnMessageReceived(callback: (message: Message) => void): void {
    this.onMessageReceived = callback;
  }

  setOnUserTyping(callback: (indicator: TypingIndicator) => void): void {
    this.onUserTyping = callback;
  }

  setOnUserStoppedTyping(callback: (indicator: TypingIndicator) => void): void {
    this.onUserStoppedTyping = callback;
  }

  setOnMessageRead(callback: (event: MessageReadEvent) => void): void {
    this.onMessageRead = callback;
  }

  setOnReactionUpdate(callback: (event: ReactionUpdateEvent) => void): void {
    this.onReactionUpdate = callback;
  }

  setOnMessageError(callback: (error: string) => void): void {
    this.onMessageError = callback;
  }


  // Connection durumunu kontrol et
  public isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  public connectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  // Chat sayfası durumunu set et
  setIsOnChatPage(isOnChatPage: boolean): void {
    this.isOnChatPage = isOnChatPage;
  }

  // Kullanıcı ID'sini set et
  setCurrentUserId(userId: number | null): void {
    this.currentUserId = userId;
  }

  // Arkadaşlık hata modalını göster
  private showFriendshipErrorModal(): void {
    // Mevcut modallar varsa temizle
    const existingModals = document.querySelectorAll('.friendship-error-modal');
    existingModals.forEach(modal => modal.remove());

    // Modal oluştur
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'friendship-error-modal fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4';
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    modalOverlay.innerHTML = `
      <div class="max-w-md w-full mx-auto transform transition-all duration-300 scale-100">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white">Mesaj Gönderilemez</h3>
          </div>
          
          <!-- Body -->
          <div class="p-6 text-center space-y-4">
            <div class="text-gray-700 dark:text-gray-300">
              <p class="text-lg font-semibold mb-3">Sadece arkadaşlarınızla mesajlaşabilirsiniz!</p>
              <div class="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                <p>Bu durumun nedeni şunlardan biri olabilir:</p>
                <ul class="list-disc list-inside space-y-1 mt-3">
                  <li>Arkadaşlık isteğiniz henüz kabul edilmemiş</li>
                  <li>Arkadaşlık isteği reddedilmiş veya iptal edilmiş</li>
                  <li>Kullanıcı tarafından engellenmiş olabilirsiniz</li>
                  <li>Daha önce arkadaşlıktan çıkarılmış olabilir</li>
                </ul>
              </div>
            </div>
            
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div class="flex items-center text-blue-700 dark:text-blue-300">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <span class="text-sm font-medium">
                  Mesajlaşmak için önce arkadaş olmanız gerekiyor
                </span>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="p-6 pt-0">
            <button class="friendship-modal-close w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
              Anladım
            </button>
          </div>
        </div>
      </div>
    `;

    // Modalı DOM'a ekle
    document.body.appendChild(modalOverlay);
    
    // Animasyon için kısa gecikme
    requestAnimationFrame(() => {
      modalOverlay.style.opacity = '0';
      modalOverlay.style.transform = 'scale(0.95)';
      
      requestAnimationFrame(() => {
        modalOverlay.style.opacity = '1';
        modalOverlay.style.transform = 'scale(1)';
        modalOverlay.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    });

    // Kapatma event'leri
    const closeModal = () => {
      modalOverlay.style.opacity = '0';
      modalOverlay.style.transform = 'scale(0.95)';
      setTimeout(() => {
        modalOverlay.remove();
      }, 300);
    };

    // Buton ve overlay click event'leri
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    
    const closeButton = modalOverlay.querySelector('.friendship-modal-close');
    closeButton?.addEventListener('click', closeModal);

    // ESC tuşu ile kapatma
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // 10 saniye sonra otomatik kapat
    setTimeout(closeModal, 10000);
  }

}

// Singleton instance
export const chatSignalRService = new ChatSignalRService();

// Development helper: clean up on window reload
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('beforeunload', () => {
    try {
      (chatSignalRService as any).connection = null;
      (chatSignalRService as any).connectionPromise = null;
    } catch (error) {
      // Ignore cleanup errors
    }
  });
}