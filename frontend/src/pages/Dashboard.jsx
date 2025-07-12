// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BoltIcon,
  StarIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    workspaces: [],
    recent_projects: [],
    recent_tasks: [],
    task_summary: {
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      overdue_tasks: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    fetchDashboardData();
    setShowCreateProject(false);
  };

  const handleWorkspaceCreated = () => {
    fetchDashboardData();
    setShowCreateWorkspace(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { task_summary } = dashboardData;
  const completionRate = task_summary.total_tasks > 0 
    ? Math.round((task_summary.completed_tasks / task_summary.total_tasks) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good morning, {user?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your projects today.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateWorkspace(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Workspace
            </button>
            <button
              onClick={() => setShowCreateProject(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Project
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Task Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{task_summary.total_tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{task_summary.completed_tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{task_summary.in_progress_tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{task_summary.overdue_tasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Progress Overview</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Completion</span>
              <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
              <Link
                to="/projects"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="p-6">
              {dashboardData.recent_projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No projects yet</p>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create your first project
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recent_projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="block p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {project.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {project.members?.length || 0}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workspaces */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Workspaces</h2>
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Add workspace
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {workspace.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {workspace.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {workspace.members?.length || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
          workspaces={dashboardData.workspaces}
        />
      )}

      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onWorkspaceCreated={handleWorkspaceCreated}
        />
      )}
    </div>
  );
}

export default Dashboard;