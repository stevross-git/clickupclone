// pages/ProjectView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  CalendarIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useNotification } from '../contexts/NotificationContext';

const VIEW_TYPES = {
  BOARD: 'board',
  LIST: 'list',
  CALENDAR: 'calendar',
  GANTT: 'gantt'
};

// Mock project data - in a real app, this would come from a global state or API
const mockProjects = {
  1: { id: 1, name: "Website Redesign", color: "#7c3aed", description: "Q1 website overhaul" },
  2: { id: 2, name: "Mobile App", color: "#2563eb", description: "iOS and Android app" },
  3: { id: 3, name: "Brand Guidelines", color: "#059669", description: "New brand identity" }
};

// Mock task lists
const mockTaskLists = [
  { id: 1, name: "To Do", color: "#6b7280", position: 0 },
  { id: 2, name: "In Progress", color: "#3b82f6", position: 1 },
  { id: 3, name: "Review", color: "#f59e0b", position: 2 },
  { id: 4, name: "Done", color: "#10b981", position: 3 }
];

// Mock tasks
const mockTasks = [
  { id: 1, title: "Design homepage mockup", listId: 1, priority: "high" },
  { id: 2, title: "Set up development environment", listId: 1, priority: "medium" },
  { id: 3, title: "Create user authentication", listId: 2, priority: "high" },
  { id: 4, title: "Implement responsive design", listId: 2, priority: "medium" },
  { id: 5, title: "Review design assets", listId: 3, priority: "low" },
  { id: 6, title: "Deploy to staging", listId: 4, priority: "high" }
];

function TaskCard({ task }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
          U
        </div>
      </div>
    </div>
  );
}

function KanbanBoard({ projectId }) {
  const [tasks, setTasks] = useState(mockTasks);
  const [lists, setLists] = useState(mockTaskLists);

  const getTasksForList = (listId) => {
    return tasks.filter(task => task.listId === listId);
  };

  return (
    <div className="flex space-x-6 p-6 overflow-x-auto min-h-full">
      {lists.map(list => (
        <div key={list.id} className="flex-shrink-0 w-80">
          <div className="bg-gray-50 rounded-lg">
            {/* List Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{list.name}</h3>
                  <span className="text-sm text-gray-500">
                    ({getTasksForList(list.id).length})
                  </span>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded">
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tasks */}
            <div className="p-4 space-y-3 min-h-32">
              {getTasksForList(list.id).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              
              {/* Add Task Button */}
              <button className="w-full p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                <div className="flex items-center justify-center space-x-2">
                  <PlusIcon className="h-4 w-4" />
                  <span className="text-sm">Add Task</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add List Button */}
      <div className="flex-shrink-0 w-80">
        <button className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
          <div className="flex flex-col items-center justify-center space-y-2">
            <PlusIcon className="h-6 w-6" />
            <span className="text-sm font-medium">Add List</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function ListView({ projectId }) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task List</h2>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {mockTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
                  <span className="font-medium text-gray-900">{task.title}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ projectId }) {
  return (
    <div className="p-6 h-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task Calendar</h2>
          <p className="text-sm text-gray-600">Calendar view coming soon...</p>
        </div>
        <div className="p-4 h-96 flex items-center justify-center">
          <div className="text-center">
            <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Calendar functionality will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [currentView, setCurrentView] = useState(VIEW_TYPES.BOARD);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    // Simulate fetching project data
    const fetchProject = () => {
      setLoading(true);
      
      // Try to find the project in mock data or localStorage
      let foundProject = mockProjects[projectId];
      
      // If not found in mock data, try to get from localStorage (for newly created projects)
      if (!foundProject) {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        foundProject = projects.find(p => p.id.toString() === projectId);
      }
      
      if (!foundProject) {
        // Create a default project if none found
        foundProject = {
          id: parseInt(projectId),
          name: `Project ${projectId}`,
          color: "#7c3aed",
          description: "Project description"
        };
      }
      
      setProject(foundProject);
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

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
          <div className="p-8 text-center">
            <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Gantt view coming soon...</p>
          </div>
        );
      default:
        return <KanbanBoard projectId={parseInt(projectId)} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Project not found</p>
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
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-600">{project.description}</p>
              )}
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
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