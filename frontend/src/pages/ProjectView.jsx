// pages/ProjectView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  CalendarIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import ListView from './ListView';
import CalendarView from './CalendarView';
import { useNotification } from '../contexts/NotificationContext';

const VIEW_TYPES = {
  BOARD: 'board',
  LIST: 'list',
  CALENDAR: 'calendar',
  GANTT: 'gantt'
};

function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [currentView, setCurrentView] = useState(VIEW_TYPES.BOARD);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      addNotification('Error loading project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case VIEW_TYPES.BOARD:
        return <KanbanBoard projectId={parseInt(projectId)} />;
      case VIEW_TYPES.LIST:
        return <ListView projectId={parseInt(projectId)} />;
      case VIEW_TYPES.CALENDAR:
        return <CalendarView projectId={parseInt(projectId)} />;
      case VIEW_TYPES.GANTT:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gantt View</h3>
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </div>
        );
      default:
        return <KanbanBoard projectId={parseInt(projectId)} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-500">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: project.color }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600">{project.description}</p>
              )}
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentView(VIEW_TYPES.BOARD)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === VIEW_TYPES.BOARD
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setCurrentView(VIEW_TYPES.LIST)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === VIEW_TYPES.LIST
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setCurrentView(VIEW_TYPES.CALENDAR)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === VIEW_TYPES.CALENDAR
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setCurrentView(VIEW_TYPES.GANTT)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === VIEW_TYPES.GANTT
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChartBarIcon className="h-4 w-4" />
              <span>Gantt</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}

export default ProjectView;