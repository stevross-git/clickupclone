// frontend/src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import apiService from '../services/api';
import wsService from '../services/websocket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_NOTIFICATIONS':
      const unreadCount = action.payload.filter((n) => n.status === 'unread').length;
      return {
        ...state,
        notifications: action.payload,
        unreadCount,
        isLoading: false,
      };

    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      const newUnreadCount = newNotifications.filter((n) => n.status === 'unread').length;
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };

    case 'MARK_READ':
      const updatedNotifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, status: 'read', read_at: new Date().toISOString() } : n
      );
      const updatedUnreadCount = updatedNotifications.filter((n) => n.status === 'unread').length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedUnreadCount,
      };

    case 'MARK_ALL_READ':
      const allReadNotifications = state.notifications.map((n) => ({
        ...n,
        status: 'read',
        read_at: n.read_at || new Date().toISOString(),
      }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only load notifications if user is authenticated and auth is not loading
    if (user && !authLoading) {
      loadNotifications();
      setupWebSocketListeners();
    } else if (!user && !authLoading) {
      // Reset state when user logs out
      dispatch({ type: 'RESET' });
    }

    return () => {
      // Cleanup WebSocket listeners
      if (wsService && wsService.off) {
        wsService.off('notification', handleNewNotification);
      }
    };
  }, [user, authLoading]);

  const loadNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const notifications = await apiService.getNotifications();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    } catch (error) {
      console.error('Failed to load notifications:', error);
      dispatch({ type: 'SET_LOADING', payload: false });

      // Don't show error toast for auth errors (user will be redirected to login)
      if (error.response?.status !== 401) {
        toast.error('Failed to load notifications');
      }
    }
  };

  const setupWebSocketListeners = () => {
    if (wsService && wsService.on) {
      wsService.on('notification', handleNewNotification);
    }
  };

  const handleNewNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Show toast notification
    showToastNotification(notification);
  };

  const showToastNotification = (notification) => {
    const toastOptions = {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#ffffff',
        color: '#374151',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    };

    // Different toast types based on notification content
    if (notification.title.includes('Error') || notification.title.includes('Failed')) {
      toast.error(notification.message, toastOptions);
    } else if (notification.title.includes('Success') || notification.title.includes('Completed')) {
      toast.success(notification.message, toastOptions);
    } else if (notification.title.includes('Warning') || notification.title.includes('Reminder')) {
      toast(notification.message, {
        ...toastOptions,
        icon: '⚠️',
      });
    } else {
      toast(notification.message, {
        ...toastOptions,
        icon: '🔔',
      });
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user) return;

    try {
      await apiService.markNotificationRead(notificationId);
      dispatch({ type: 'MARK_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to mark notification as read');
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = state.notifications.filter((n) => n.status === 'unread');

      // Mark all unread notifications as read
      await Promise.all(unreadNotifications.map((n) => apiService.markNotificationRead(n.id)));

      dispatch({ type: 'MARK_ALL_READ' });
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to mark all notifications as read');
      }
    }
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
    toast.success('All notifications cleared');
  };

  // Custom toast methods for different scenarios
  const addNotification = (type, title, message, options = {}) => {
    const toastOptions = {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      ...options.style,
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'info':
        toast(message, { ...toastOptions, icon: 'ℹ️' });
        break;
      case 'warning':
        toast(message, { ...toastOptions, icon: '⚠️' });
        break;
      default:
        toast(message, toastOptions);
    }
  };

  const showTaskNotification = (action, taskTitle, assignee = null) => {
    let message = '';
    let type = 'info';

    switch (action) {
      case 'created':
        message = `New task created: ${taskTitle}`;
        type = 'success';
        break;
      case 'assigned':
        message = assignee
          ? `${assignee} was assigned to: ${taskTitle}`
          : `You were assigned to: ${taskTitle}`;
        type = 'info';
        break;
      case 'completed':
        message = `Task completed: ${taskTitle}`;
        type = 'success';
        break;
      case 'commented':
        message = `New comment on: ${taskTitle}`;
        type = 'info';
        break;
      case 'due_soon':
        message = `Task due soon: ${taskTitle}`;
        type = 'warning';
        break;
      case 'overdue':
        message = `Task overdue: ${taskTitle}`;
        type = 'error';
        break;
      default:
        message = `Task updated: ${taskTitle}`;
    }

    addNotification(type, action, message);
  };

  const showProjectNotification = (action, projectName) => {
    let message = '';
    let type = 'info';

    switch (action) {
      case 'created':
        message = `New project created: ${projectName}`;
        type = 'success';
        break;
      case 'invited':
        message = `You were invited to project: ${projectName}`;
        type = 'info';
        break;
      case 'updated':
        message = `Project updated: ${projectName}`;
        type = 'info';
        break;
      default:
        message = `Project notification: ${projectName}`;
    }

    addNotification(type, action, message);
  };

  const value = {
    ...state,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    showTaskNotification,
    showProjectNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
