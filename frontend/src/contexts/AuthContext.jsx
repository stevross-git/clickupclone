// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';
import wsService from '../services/websocket';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        
        // Verify token is still valid
        try {
          const currentUser = await apiService.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: currentUser });
          
          // Connect WebSocket
          wsService.connect(token);
          
          // Join user's personal room for notifications
          wsService.joinRoom(`user_${currentUser.id}`);
          
        } catch (error) {
          // Token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'SET_USER', payload: null });
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await apiService.login(credentials);
      const user = await apiService.getCurrentUser();
      
      dispatch({ type: 'SET_USER', payload: user });
      
      // Connect WebSocket
      const token = localStorage.getItem('token');
      wsService.connect(token);
      wsService.joinRoom(`user_${user.id}`);
      
      toast.success(`Welcome back, ${user.full_name}!`);
      return { success: true };
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await apiService.register(userData);
      toast.success('Registration successful! Please log in.');
      
      return { success: true };
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Disconnect WebSocket
    wsService.disconnect();
    
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await apiService.updateUser(state.user.id, profileData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshUser = async () => {
    try {
      const user = await apiService.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;