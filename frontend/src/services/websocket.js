// frontend/src/services/websocket.js
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectInterval = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.rooms = new Set();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      upgrade: false,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      
      // Rejoin rooms
      this.rooms.forEach(room => {
        this.socket.emit('join_room', room);
      });

      // Clear any reconnection interval
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      
      // Attempt to reconnect every 5 seconds
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        this.attemptReconnect(token);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.attemptReconnect(token);
    });

    // Listen for different message types
    this.socket.on('task_created', (data) => {
      this.emit('task_created', data);
      toast.success('New task created');
    });

    this.socket.on('task_updated', (data) => {
      this.emit('task_updated', data);
    });

    this.socket.on('task_deleted', (data) => {
      this.emit('task_deleted', data);
    });

    this.socket.on('comment_created', (data) => {
      this.emit('comment_created', data);
      toast.success('New comment added');
    });

    this.socket.on('project_updated', (data) => {
      this.emit('project_updated', data);
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
      toast.success(data.title, {
        description: data.message,
        action: data.action_url ? {
          label: 'View',
          onClick: () => window.location.href = data.action_url
        } : null
      });
    });

    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    this.socket.on('heartbeat', () => {
      // Keep connection alive
    });
  }

  attemptReconnect(token) {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect(token);
    }, 5000);
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.rooms.clear();
    this.listeners.clear();
  }

  joinRoom(room) {
    if (!this.socket?.connected) {
      // Store the room to join when connected
      this.rooms.add(room);
      return;
    }

    this.socket.emit('join_room', room);
    this.rooms.add(room);
  }

  leaveRoom(room) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', room);
    }
    this.rooms.delete(room);
  }

  sendMessage(type, data, room = null) {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, message not sent');
      return;
    }

    this.socket.emit('message', {
      type,
      data,
      room
    });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  // Typing indicators
  startTyping(room, taskId = null) {
    this.sendMessage('typing_start', { task_id: taskId }, room);
  }

  stopTyping(room, taskId = null) {
    this.sendMessage('typing_stop', { task_id: taskId }, room);
  }

  // Presence
  updatePresence(status, activity = null) {
    this.sendMessage('presence_update', { status, activity });
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket?.connected || false,
      rooms: Array.from(this.rooms)
    };
  }
}

const wsService = new WebSocketService();
export default wsService;