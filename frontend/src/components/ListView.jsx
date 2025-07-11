// components/ListView.jsx
import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { useNotification } from '../contexts/NotificationContext';

function ListView({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get(`/tasks/?project_id=${projectId}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      addNotification('Error loading tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [...prev, newTask]);
    setShowCreateTask(false);
  };

  const groupTasksByStatus = () => {
    const groups = {
      todo: [],
      in_progress: [],
      done: [],
      blocked: []
    };

    tasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });

    return groups;
  };

  const getStatusTitle = (status) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedTasks = groupTasksByStatus();

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
          <button
            onClick={() => setShowCreateTask(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>

        {/* Task Groups */}
        <div className="space-y-8">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(status)}`}>
                      {getStatusTitle(status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {statusTasks.length} task{statusTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {statusTasks.length > 0 ? (
                  <div className="space-y-3">
                    {statusTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No {getStatusTitle(status).toLowerCase()} tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first task</p>
            <button
              onClick={() => setShowCreateTask(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Task
            </button>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  );
}

export default ListView;