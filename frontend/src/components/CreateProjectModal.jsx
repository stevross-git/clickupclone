// frontend/src/components/CreateProjectModal.jsx
import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const CreateProjectModal = ({ isOpen, onClose, onSuccess, workspaces = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workspace_id: '',
    color: '#7c3aed',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotification();

  const colorOptions = [
    '#7c3aed',
    '#2563eb',
    '#059669',
    '#dc2626',
    '#ea580c',
    '#ca8a04',
    '#7c2d12',
    '#be185d',
    '#9333ea',
    '#0891b2',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addNotification('error', 'Error', 'Project name is required');
      return;
    }
    if (!formData.workspace_id) {
      addNotification('error', 'Error', 'Please select a workspace');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createProject(formData);
      addNotification('success', 'Success', 'Project created successfully!');
      setFormData({ name: '', description: '', workspace_id: '', color: '#7c3aed' });
      onSuccess();
    } catch (error) {
      console.error('Error creating project:', error);
      addNotification('error', 'Error', 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleColorSelect = (color) => {
    setFormData({
      ...formData,
      color,
    });
  };

  // Set default workspace if only one available
  React.useEffect(() => {
    if (workspaces.length === 1 && !formData.workspace_id) {
      setFormData((prev) => ({
        ...prev,
        workspace_id: workspaces[0].id,
      }));
    }
  }, [workspaces, formData.workspace_id]);

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Create New Project
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="workspace_id"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Workspace *
                    </label>
                    <select
                      id="workspace_id"
                      name="workspace_id"
                      value={formData.workspace_id}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                      required
                    >
                      <option value="">Select a workspace</option>
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter project name"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter project description"
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Project Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`h-8 w-8 rounded-full border-2 ${
                            formData.color === color ? 'border-gray-400' : 'border-gray-200'
                          } transition-colors hover:border-gray-400`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateProjectModal;
