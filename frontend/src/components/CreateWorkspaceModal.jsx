// components/CreateWorkspaceModal.jsx
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../contexts/NotificationContext';

function CreateWorkspaceModal({ onClose, onWorkspaceCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addNotification('Workspace name is required', 'error');
      return;
    }

    setLoading(true);

    try {
      // For now, create a mock workspace
      const newWorkspace = {
        id: Date.now(), // Simple ID generation for demo
        name: formData.name,
        description: formData.description
      };
      
      onWorkspaceCreated(newWorkspace);
      addNotification('Workspace created successfully', 'success');
    } catch (error) {
      console.error('Error creating workspace:', error);
      addNotification('Error creating workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Workspace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name *
            </label>
            <input
              id="workspace-name"
              type="text"
              name="name"
              autoComplete="organization"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter workspace name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label htmlFor="workspace-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="workspace-description"
              name="description"
              autoComplete="off"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your workspace..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWorkspaceModal;