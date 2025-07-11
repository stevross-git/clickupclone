// contexts/NotificationContext.jsx
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 ${
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          } text-white hover:scale-105`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="flex items-center">
            <div className="flex-1">
              {notification.message}
            </div>
            <button 
              className="ml-2 text-white hover:text-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}