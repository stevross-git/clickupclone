// frontend/src/components/TaskCard.jsx
import React from 'react';
import { 
  CalendarIcon, 
  ChatBubbleLeftIcon, 
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import moment from 'moment';

function TaskCard({ task, onClick, onUpdate, onDelete }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="h-3 w-3" />;
      case 'high':
        return <ArrowTrendingUpIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'border-l-gray-400';
      case 'in_progress':
        return 'border-l-blue-500';
      case 'review':
        return 'border-l-orange-500';
      case 'done':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-400';
    }
  };

  const isOverdue = task.due_date && moment(task.due_date).isBefore(moment()) && task.status !== 'done';
  const isDueSoon = task.due_date && moment(task.due_date).diff(moment(), 'days') <= 1 && task.status !== 'done';

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getStatusColor(task.status)} ${
        isOverdue ? 'ring-2 ring-red-200 bg-red-50' : ''
      }`}
    >
      {/* Task Title */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Priority Badge */}
      {(task.priority === 'high' || task.priority === 'urgent') && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {getPriorityIcon(task.priority)}
            <span className="ml-1 capitalize">{task.priority}</span>
          </span>
        </div>
      )}

      {/* Task Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center space-x-1 ${
              isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-500'
            }`}>
              <CalendarIcon className="h-3 w-3" />
              <span>{moment(task.due_date).format('MMM D')}</span>
              {isOverdue && <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />}
            </div>
          )}

          {/* Estimated Time */}
          {task.estimated_hours && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}

          {/* Comments Count */}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <ChatBubbleLeftIcon className="h-3 w-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        <div className="flex items-center">
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 3).map((assignee, index) => (
                <div
                  key={assignee.id}
                  className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                  title={assignee.full_name}
                  style={{ zIndex: task.assignees.length - index }}
                >
                  {assignee.avatar_url ? (
                    <img
                      src={assignee.avatar_url}
                      alt={assignee.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    assignee.full_name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-medium text-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar for Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Subtasks</span>
            <span>
              {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-purple-600 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${(task.subtasks.filter(st => st.status === 'done').length / task.subtasks.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Completion Status */}
      {task.status === 'done' && (
        <div className="mt-3 flex items-center text-green-600">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Completed</span>
        </div>
      )}
    </div>
  );
}

export default TaskCard;