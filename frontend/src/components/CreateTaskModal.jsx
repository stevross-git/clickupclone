// frontend/src/components/CreateTaskModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const CreateTaskModal = ({ isOpen, onClose, onSuccess, projects = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    task_list_id: '',
    priority: 'medium',
    due_date: '',
    assignee_ids: [],
  });
  const [taskLists, setTaskLists] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotification();

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  useEffect(() => {
    if (formData.project_id) {
      loadTaskLists(formData.project_id);
      loadProjectMembers(formData.project_id);
    }
  }, [formData.project_id]);

  const loadTaskLists = async (projectId) => {
    try {
      const lists = await apiService.getTaskLists(projectId);
      setTaskLists(lists);

      // Auto-select first task list (usually "To Do")
      if (lists.length > 0 && !formData.task_list_id) {
        setFormData((prev) => ({
          ...prev,
          task_list_id: lists[0].id,
        }));
      }
    } catch (error) {
      console.error('Error loading task lists:', error);
    }
  };

  const loadProjectMembers = async (projectId) => {
    try {
      const project = await apiService.getProject(projectId);
      setProjectMembers(project.members || []);
    } catch (error) {
      console.error('Error loading project members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addNotification('error', 'Error', 'Task title is required');
      return;
    }
    if (!formData.project_id) {
      addNotification('error', 'Error', 'Please select a project');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = { ...formData };

      // Convert due_date to proper format if provided
      if (taskData.due_date) {
        taskData.due_date = new Date(taskData.due_date).toISOString();
      } else {
        delete taskData.due_date;
      }

      await apiService.createTask(taskData);
      addNotification('success', 'Success', 'Task created successfully!');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error creating task:', error);
      addNotification('error', 'Error', 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_id: '',
      task_list_id: '',
      priority: 'medium',
      due_date: '',
      assignee_ids: [],
    });
    setTaskLists([]);
    setProjectMembers([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAssigneeChange = (e) => {
    const { value, checked } = e.target;
    const userId = parseInt(value);

    setFormData((prev) => ({
      ...prev,
      assignee_ids: checked
        ? [...prev.assignee_ids, userId]
        : prev.assignee_ids.filter((id) => id !== userId),
    }));
  };

  // Set default project if only one available
  useEffect(() => {
    if (projects.length === 1 && !formData.project_id) {
      setFormData((prev) => ({
        ...prev,
        project_id: projects[0].id,
      }));
    }
  }, [projects, formData.project_id]);

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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Create New Task
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
                      htmlFor="project_id"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Project *
                    </label>
                    <select
                      id="project_id"
                      name="project_id"
                      value={formData.project_id}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter task title"
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
                      placeholder="Enter task description"
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="task_list_id"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        List
                      </label>
                      <select
                        id="task_list_id"
                        name="task_list_id"
                        value={formData.task_list_id}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                      >
                        <option value="">Select list</option>
                        {taskLists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="priority"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              id="task-title"
              type="text"
              name="title"
              autoComplete="off"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="task-description"
              name="description"
              autoComplete="off"
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
              <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                autoComplete="off"
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
              <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                name="due_date"
                autoComplete="off"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label htmlFor="task-est-hours" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Hours
            </label>
            <input
              id="task-est-hours"
              type="number"
              name="estimated_hours"
              autoComplete="off"
              value={formData.estimated_hours}
              onChange={handleChange}
              placeholder="Enter estimated hours..."
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>


                  <div>
                    <label
                      htmlFor="due_date"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      id="due_date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                    />
                  </div>

                  {projectMembers.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Assignees
                      </label>
                      <div className="max-h-32 space-y-2 overflow-y-auto">
                        {projectMembers.map((member) => (
                          <label key={member.id} className="flex items-center">
                            <input
                              type="checkbox"
                              value={member.id}
                              checked={formData.assignee_ids.includes(member.id)}
                              onChange={handleAssigneeChange}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {member.full_name} ({member.email})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

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
                      {isSubmitting ? 'Creating...' : 'Create Task'}
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

export default CreateTaskModal;
