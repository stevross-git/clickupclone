// components/TaskCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import {
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ArchiveBoxIcon } from '@heroicons/react/24/solid';

function TaskCard({ task, onArchived }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const { addNotification } = useNotification();

  const handleArchive = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/tasks/${task.id}/archive`);
      addNotification('Task archived', 'success');
      if (onArchived) onArchived(task);
    } catch (error) {
      console.error('Error archiving task:', error);
      addNotification('Error archiving task', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, className: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', className: 'text-yellow-600' };
    } else {
      return { text: `Due in ${diffDays} days`, className: 'text-gray-600' };
    }
  };

  const dueDate = formatDate(task.due_date);

  return (
    <Link to={`/task/${task.id}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group">
        {/* Priority and Status Badges */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {task.status !== 'todo' && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
          )}
          <button
            onClick={handleArchive}
            className="ml-2 text-gray-400 hover:text-gray-600"
            title="Archive task"
          >
            <ArchiveBoxIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Task Title */}
        <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {task.title}
        </h4>
        
        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Meta Information */}
        <div className="space-y-2">
          {/* Due Date */}
          {dueDate && (
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className={`text-xs ${dueDate.className}`}>
                {dueDate.text}
              </span>
            </div>
          )}

          {/* Time Estimates */}
          {(task.estimated_hours || task.actual_hours) && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {task.estimated_hours && `${task.estimated_hours}h est`}
                {task.estimated_hours && task.actual_hours && ' / '}
                {task.actual_hours && `${task.actual_hours}h actual`}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Section - Assignees and Activity */}
        <div className="flex items-center justify-between mt-4">
          {/* Assignees */}
          <div className="flex items-center">
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map(assignee => (
                  <div
                    key={assignee.id}
                    className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden"
                    title={assignee.full_name}
                  >
                    {assignee.avatar_url ? (
                      <img
                        src={assignee.avatar_url}
                        alt={assignee.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      assignee.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-400">?</span>
              </div>
            )}
          </div>

          {/* Activity Indicators */}
          <div className="flex items-center space-x-3 text-gray-400">
            {/* Comments */}
            {task.comments_count > 0 && (
              <div className="flex items-center space-x-1">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                <span className="text-xs">{task.comments_count}</span>
              </div>
            )}

            {/* Attachments */}
            {task.attachments_count > 0 && (
              <div className="flex items-center space-x-1">
                <PaperClipIcon className="h-4 w-4" />
                <span className="text-xs">{task.attachments_count}</span>
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="text-xs">
                {task.subtasks.filter(sub => sub.status === 'done').length}/{task.subtasks.length}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar for Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(task.subtasks.filter(sub => sub.status === 'done').length / task.subtasks.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default TaskCard;