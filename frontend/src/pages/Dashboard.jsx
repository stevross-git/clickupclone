// pages/Dashboard.jsx
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
  StarIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    workspaces: [],
    recent_projects: [],
    recent_tasks: [],
    task_summary: {
      total_tasks: 24,
      completed_tasks: 18,
      in_progress_tasks: 4,
      overdue_tasks: 2
    }
  });
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
      // Mock data for demo
      setDashboardData({
        workspaces: [
          { id: 1, name: "Marketing Team", description: "All marketing projects", color: "#7c3aed" },
          { id: 2, name: "Development", description: "Software development", color: "#2563eb" }
        ],
        recent_projects: [
          { id: 1, name: "Website Redesign", description: "Q1 website overhaul", color: "#7c3aed", members: [{}, {}, {}] },
          { id: 2, name: "Mobile App", description: "iOS and Android app", color: "#2563eb", members: [{}, {}] },
          { id: 3, name: "Brand Guidelines", description: "New brand identity", color: "#059669", members: [{}, {}, {}, {}] }
        ],
        recent_tasks: [],
        task_summary: {
          total_tasks: 24,
          completed_tasks: 18,
          in_progress_tasks: 4,
          overdue_tasks: 2
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good morning, {user?.full_name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              You have <span className="font-medium text-purple-600">{dashboardData.task_summary.in_progress_tasks} tasks</span> in progress and <span className="font-medium text-red-600">{dashboardData.task_summary.overdue_tasks} overdue</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.task_summary.total_tasks}</p>
                <p className="text-sm text-green-600 mt-1">+12% from last week</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.task_summary.completed_tasks}</p>
                <p className="text-sm text-green-600 mt-1">+8% from last week</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.task_summary.in_progress_tasks}</p>
                <p className="text-sm text-blue-600 mt-1">Active tasks</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.task_summary.overdue_tasks}</p>
                <p className="text-sm text-red-600 mt-1">Needs attention</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
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
                        className="block p-4 rounded-xl hover:bg-gray-50 transition-colors group border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                              style={{ backgroundColor: project.color }}
                            >
                              {project.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                {project.name}
                              </h3>
                              <p className="text-sm text-gray-600">{project.description}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <div className="flex items-center text-sm text-gray-500">
                                  <UserGroupIcon className="h-4 w-4 mr-1" />
                                  {project.members?.length || 0} members
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <ChartBarIcon className="h-4 w-4 mr-1" />
                                  85% complete
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(project.members?.length || 0, 3))].map((_, i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                              >
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <PlusIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-4">Create your first project to get started</p>
                    <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                  <PlusIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">Create Task</span>
                </button>
                <button className="w-full flex items-center p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  <UserGroupIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">Invite Team</span>
                </button>
                <button className="w-full flex items-center p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <ChartBarIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">View Reports</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Sarah</span> completed task "Design review"
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <PlusIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">John</span> created a new project
                    </p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <StarIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Mike</span> starred "Mobile App" project
                    </p>
                    <p className="text-xs text-gray-500">6 hours ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center mb-3">
                <BoltIcon className="h-6 w-6 mr-2" />
                <h3 className="font-semibold">Upgrade to Pro</h3>
              </div>
              <p className="text-sm opacity-90 mb-4">
                Unlock unlimited projects, advanced reporting, and more features.
              </p>
              <button className="w-full bg-white text-purple-600 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;