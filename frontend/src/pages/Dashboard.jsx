// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-pink-500 to-blue-700 p-8">
      <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your projects today.
        </p>
      </div>
      
      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.task_summary.total_tasks}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.task_summary.completed_tasks}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.task_summary.in_progress_tasks}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.task_summary.overdue_tasks}
              </div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {dashboardData.recent_projects.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recent_projects.map(project => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="block p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {project.description || 'No description'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {project.members?.length || 0} members
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No projects yet</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Recent Tasks</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {dashboardData.recent_tasks.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recent_tasks.slice(0, 5).map(task => (
                  <div key={task.id} className="border border-gray-200 rounded-lg">
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No tasks assigned to you</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Browse projects
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-colors">
            <PlusIcon className="h-6 w-6 mb-2" />
            <div className="font-medium">Create Task</div>
            <div className="text-sm opacity-90">Add a new task to any project</div>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-colors">
            <ChartBarIcon className="h-6 w-6 mb-2" />
            <div className="font-medium">New Project</div>
            <div className="text-sm opacity-90">Start a new project</div>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-colors">
            <ClockIcon className="h-6 w-6 mb-2" />
            <div className="font-medium">Time Tracking</div>
            <div className="text-sm opacity-90">Track time on tasks</div>
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            Activity feed coming soon...
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Dashboard;
