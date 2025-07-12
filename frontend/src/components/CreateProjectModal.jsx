// frontend/src/components/CreateProjectModal.jsx
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const PROJECT_COLORS = [
  '#7c3aed', // Purple
  '#2563eb', // Blue
  '#059669', // Emerald
  '#dc2626', // Red
  '#ea580c', // Orange
  '#ca8a04', // Yellow
  '#9333ea', // Violet
  '#0891b2', // Cyan
  '#16a34a', // Green
  '#be123c', // Rose
  '#9a3412', // Amber
  '#4338ca', // Indigo
];

function CreateProjectModal({ onClose, onProjectCreated, workspaces = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workspace_id: workspaces.length > 0 ? workspaces[0].id : '',
    color: PROJECT_COLORS[0]
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

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      color
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addNotification('Project name is required', 'error');
      return;
    }

    if (!formData.workspace_id) {
      addNotification('Please select a workspace', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/projects/', formData);
      addNotification('Project created successfully', 'success');
      onProjectCreated(response.data);
    } catch (error) {
      console.error('Error creating project:', error);
      addNotification(
        error.response?.data?.detail || 'Failed to create project',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter project description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors resize-none"
            />
          </div>

          {/* Workspace Selection */}
          <div>
            <label htmlFor="workspace_id" className="block text-sm font-medium text-gray-700 mb-2">
              Workspace *
            </label>
            <select
              id="workspace_id"
              name="workspace_id"
              value={formData.workspace_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
              required
            >
              {workspaces.length === 0 ? (
                <option value="">No workspaces available</option>
              ) : (
                workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    formData.color === color
                      ? 'border-gray-900 scale-110 shadow-lg'
                      : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
            <div className="flex items-center space-x-3">
              <div
                className="w-6 h-6 rounded-lg flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              ></div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {formData.name || 'Project Name'}
                </h4>
                <p className="text-xs text-gray-600">
                  {formData.description || 'No description'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.workspace_id}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;