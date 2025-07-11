// components/CreateTaskModal.jsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

function CreateTaskModal({ projectId, listId, onClose, onTaskCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    assignee_ids: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : '') : value
    }));
  };

  const handleAssigneeChange = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter(id => id !== userId)
        : [...prev.assignee_ids, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addNotification('Task title is required', 'error');
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        ...formData,
        project_id: projectId,
        task_list_id: listId,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours || null
      };

      const response = await apiClient.post('/tasks/', taskData);
      onTaskCreated(response.data);
      addNotification('Task created successfully', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      addNotification('Error creating task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the task..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Hours
            </label>
            <input
              type="number"
              name="estimated_hours"
              value={formData.estimated_hours}
              onChange={handleChange}
              placeholder="Enter estimated hours..."
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              {users.length > 0 ? (
                <div className="space-y-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.assignee_ids.includes(user.id)}
                        onChange={() => handleAssigneeChange(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.full_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No users available
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTaskModal;