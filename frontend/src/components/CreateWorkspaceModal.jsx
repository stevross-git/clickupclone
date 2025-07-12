// frontend/src/components/CreateWorkspaceModal.jsx
import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const CreateWorkspaceModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addNotification('error', 'Error', 'Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createWorkspace(formData);
      addNotification('success', 'Success', 'Workspace created successfully!');
      setFormData({ name: '', description: '' });
      onSuccess();
    } catch (error) {
      console.error('Error creating workspace:', error);
      addNotification('error', 'Error', 'Failed to create workspace');
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
                    Create New Workspace
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
                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                      Workspace Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter workspace name"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                      required
                    />
                  </div>
=======
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
                      placeholder="Enter workspace description"
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                    />
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
                      {isSubmitting ? 'Creating...' : 'Create Workspace'}
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

export default CreateWorkspaceModal;
