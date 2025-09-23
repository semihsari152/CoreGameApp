import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import Cookies from 'js-cookie';
import { Notification } from '../types';

class SignalRService {
  private connection: HubConnection | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  // Event handlers
  private onNotificationReceived?: (notification: Notification) => void;
  private onUnreadCountUpdated?: (count: number) => void;
  private onSystemNotification?: (notification: { title: string; message: string; timestamp: string }) => void;
  private onUserTyping?: (data: { userId: number; entityType: string; entityId: number }) => void;
  private onUserStoppedTyping?: (data: { userId: number; entityType: string; entityId: number }) => void;
  private onUserOnlineStatusChanged?: (data: { userId: number; isOnline: boolean; timestamp: string }) => void;

  public async startConnection(): Promise<void> {
    if (this.isConnected || this.connection?.state === 'Connected') {
      return;
    }

    const token = Cookies.get('accessToken');
    if (!token) {
      console.log('No token available for SignalR connection');
      return;
    }

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:5124'}/notificationHub`, {
          accessTokenFactory: () => token,
          withCredentials: false // Set to false for CORS compatibility
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('SignalR connection established successfully');
    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
      this.handleReconnection();
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      } finally {
        this.isConnected = false;
        this.connection = null;
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle connection events
    this.connection.onclose((error) => {
      this.isConnected = false;
      console.log('SignalR connection closed:', error);
      this.handleReconnection();
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Handle incoming messages
    this.connection.on('ReceiveNotification', (notification: Notification) => {
      console.log('Received notification:', notification);
      this.onNotificationReceived?.(notification);
    });

    this.connection.on('UnreadCountUpdated', (count: number) => {
      console.log('Unread count updated:', count);
      this.onUnreadCountUpdated?.(count);
    });

    this.connection.on('ReceiveSystemNotification', (notification: { title: string; message: string; timestamp: string }) => {
      console.log('Received system notification:', notification);
      this.onSystemNotification?.(notification);
    });

    this.connection.on('UserTyping', (data: { userId: number; entityType: string; entityId: number }) => {
      this.onUserTyping?.(data);
    });

    this.connection.on('UserStoppedTyping', (data: { userId: number; entityType: string; entityId: number }) => {
      this.onUserStoppedTyping?.(data);
    });

    this.connection.on('UserOnlineStatusChanged', (data: { userId: number; isOnline: boolean; timestamp: string }) => {
      this.onUserOnlineStatusChanged?.(data);
    });
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.startConnection();
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        this.handleReconnection();
      }
    }, delay);
  }

  // Public methods to send messages
  public async joinGroup(groupName: string): Promise<void> {
    if (this.isConnected && this.connection) {
      try {
        await this.connection.invoke('JoinGroup', groupName);
      } catch (error) {
        console.error('Failed to join group:', error);
      }
    }
  }

  public async leaveGroup(groupName: string): Promise<void> {
    if (this.isConnected && this.connection) {
      try {
        await this.connection.invoke('LeaveGroup', groupName);
      } catch (error) {
        console.error('Failed to leave group:', error);
      }
    }
  }

  // Event handler setters
  public setOnNotificationReceived(handler: (notification: Notification) => void): void {
    this.onNotificationReceived = handler;
  }

  public setOnUnreadCountUpdated(handler: (count: number) => void): void {
    this.onUnreadCountUpdated = handler;
  }

  public setOnSystemNotification(handler: (notification: { title: string; message: string; timestamp: string }) => void): void {
    this.onSystemNotification = handler;
  }

  public setOnUserTyping(handler: (data: { userId: number; entityType: string; entityId: number }) => void): void {
    this.onUserTyping = handler;
  }

  public setOnUserStoppedTyping(handler: (data: { userId: number; entityType: string; entityId: number }) => void): void {
    this.onUserStoppedTyping = handler;
  }

  public setOnUserOnlineStatusChanged(handler: (data: { userId: number; isOnline: boolean; timestamp: string }) => void): void {
    this.onUserOnlineStatusChanged = handler;
  }

  // Getters
  public get connectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  public get connected(): boolean {
    return this.isConnected;
  }
}

// Export a singleton instance
export const signalRService = new SignalRService();