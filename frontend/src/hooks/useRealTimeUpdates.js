// hooks/useRealTimeUpdates.js
import { useCallback, useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

// WebSocket Service
class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.messageHandlers = new Map();
  }

  connect(projectId) {
    if (this.connections.has(projectId)) {
      return this.connections.get(projectId);
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/${projectId}`);
    
    ws.onopen = () => {
      console.log(`WebSocket connected for project ${projectId}`);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(projectId, message);
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected for project ${projectId}`);
      this.connections.delete(projectId);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.connections.set(projectId, ws);
    return ws;
  }

  disconnect(projectId) {
    const ws = this.connections.get(projectId);
    if (ws) {
      ws.close();
      this.connections.delete(projectId);
    }
  }

  addMessageHandler(projectId, handler) {
    if (!this.messageHandlers.has(projectId)) {
      this.messageHandlers.set(projectId, []);
    }
    this.messageHandlers.get(projectId).push(handler);
  }

  removeMessageHandler(projectId, handler) {
    const handlers = this.messageHandlers.get(projectId);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  handleMessage(projectId, message) {
    const handlers = this.messageHandlers.get(projectId);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  sendMessage(projectId, message) {
    const ws = this.connections.get(projectId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService();

// Hook for WebSocket connection
export function useWebSocket(projectId, onMessage) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!projectId) return;

    const handleMessage = (message) => {
      if (onMessageRef.current) {
        onMessageRef.current(message);
      }
    };

    websocketService.connect(projectId);
    websocketService.addMessageHandler(projectId, handleMessage);

    return () => {
      websocketService.removeMessageHandler(projectId, handleMessage);
    };
  }, [projectId]);

  const sendMessage = useCallback((message) => {
    websocketService.sendMessage(projectId, message);
  }, [projectId]);

  return { sendMessage };
}

// Hook for real-time updates with notifications
export function useRealTimeUpdates(projectId, onTaskUpdate) {
  const { addNotification } = useNotification();

  const handleMessage = useCallback((message) => {
    const { type, data } = message;

    switch (type) {
      case 'task_created':
        addNotification('New task created', 'info');
        if (onTaskUpdate) onTaskUpdate('created', data);
        break;
      
      case 'task_updated':
        addNotification('Task updated', 'info');
        if (onTaskUpdate) onTaskUpdate('updated', data);
        break;
      
      case 'task_moved':
        addNotification('Task moved', 'info');
        if (onTaskUpdate) onTaskUpdate('moved', data);
        break;
      
      case 'comment_added':
        addNotification('New comment added', 'info');
        if (onTaskUpdate) onTaskUpdate('comment', data);
        break;
      
      case 'task_deleted':
        addNotification('Task deleted', 'info');
        if (onTaskUpdate) onTaskUpdate('deleted', data);
        break;
      
      default:
        console.log('Unknown message type:', type);
    }
  }, [addNotification, onTaskUpdate]);

  const { sendMessage } = useWebSocket(projectId, handleMessage);

  return { sendMessage };
}