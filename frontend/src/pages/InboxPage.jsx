import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiClient from '../services/api';
import TaskCard from '../components/TaskCard';

function InboxPage() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    isLoading,
  } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (user) fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await apiClient.getTasks({ assignee_id: user.id });
      const upcoming = data
        .filter((t) => t.due_date && t.status !== 'done')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
      setTasks(upcoming);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleNotificationClick = (n) => {
    if (n.status === 'unread') markAsRead(n.id);
    if (n.action_url) window.open(n.action_url, '_blank');
  };

  return (
    <div className="p-6 space-y-8">
      {/* Notifications */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <div className="space-x-3 text-sm">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-purple-600 hover:underline">
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-gray-500 hover:underline">
                Clear
              </button>
            )}
          </div>
        </div>
        <ul className="max-h-80 divide-y divide-gray-200 overflow-y-auto">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`cursor-pointer p-4 hover:bg-gray-50 ${n.status === 'unread' ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{n.title}</p>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">{n.message}</p>
            </li>
          ))}
          {notifications.length === 0 && !isLoading && (
            <li className="p-4 text-center text-sm text-gray-500">No notifications</li>
          )}
        </ul>
      </div>

      {/* Upcoming Tasks */}
      <div className="card">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">My Upcoming Tasks</h2>
          <p className="text-sm text-gray-600">Tasks assigned to you with a due date.</p>
        </div>
        {loadingTasks ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {tasks.length > 0 ? (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <p className="text-center text-sm text-gray-500">No upcoming tasks</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InboxPage;
