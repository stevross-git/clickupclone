// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  FolderIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BoltIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import CreateProjectModal from './CreateProjectModal';

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(new Set());
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspacesAndProjects();
  }, []);

  const loadWorkspacesAndProjects = async () => {
    try {
      const [workspacesData, projectsData] = await Promise.all([
        apiService.getWorkspaces(),
        apiService.getProjects()
      ]);
      
      setWorkspaces(workspacesData);
      setProjects(projectsData);
      
      // Auto-expand workspaces with projects
      const workspacesWithProjects = new Set(
        projectsData.map(p => p.workspace_id)
      );
      setExpandedWorkspaces(workspacesWithProjects);
    } catch (error) {
      console.error('Failed to load workspaces and projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkspace = (workspaceId) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId);
    } else {
      newExpanded.add(workspaceId);
    }
    setExpandedWorkspaces(newExpanded);
  };

  const getProjectsForWorkspace = (workspaceId) => {
    return projects.filter(p => p.workspace_id === workspaceId);
  };

  const handleWorkspaceCreated = () => {
    loadWorkspacesAndProjects();
    setShowCreateWorkspace(false);
  };

  const handleProjectCreated = () => {
    loadWorkspacesAndProjects();
    setShowCreateProject(false);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Time Tracking', href: '/time-tracking', icon: ClockIcon },
    { name: 'Goals', href: '/goals', icon: BoltIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: BellIcon,
      badge: unreadCount > 0 ? unreadCount : null
    },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ClickUp Clone</span>
            </Link>
            
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <label htmlFor="sidebar-search" className="sr-only">
                Search
              </label>
              <input
                id="sidebar-search"
                name="sidebar-search"
                type="text"
                autoComplete="off"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md relative
                  ${isActive(item.href)
                    ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${isActive(item.href) ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                {item.name}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Workspaces section */}
            <div className="pt-6">
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Workspaces
                </h3>
                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Create workspace"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="px-3 py-2">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {workspaces.map((workspace) => {
                    const workspaceProjects = getProjectsForWorkspace(workspace.id);
                    const isExpanded = expandedWorkspaces.has(workspace.id);

                    return (
                      <div key={workspace.id}>
                        <button
                          onClick={() => toggleWorkspace(workspace.id)}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                        >
                          {workspaceProjects.length > 0 ? (
                            isExpanded ? (
                              <ChevronDownIcon className="w-4 h-4 mr-2 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 mr-2 text-gray-400" />
                            )
                          ) : (
                            <div className="w-4 h-4 mr-2" />
                          )}
                          <FolderIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="flex-1 text-left truncate">{workspace.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCreateProject(true);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100"
                            title="Create project"
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </button>

                        {/* Projects */}
                        {isExpanded && workspaceProjects.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {workspaceProjects.map((project) => (
                              <Link
                                key={project.id}
                                to={`/project/${project.id}`}
                                onClick={() => onClose()}
                                className={`
                                  flex items-center px-3 py-1.5 text-sm rounded-md
                                  ${location.pathname === `/project/${project.id}`
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                  }
                                `}
                              >
                                <div 
                                  className="w-3 h-3 rounded mr-2 flex-shrink-0"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="truncate">{project.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {workspaces.length === 0 && (
                    <button
                      onClick={() => setShowCreateWorkspace(true)}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md border-2 border-dashed border-gray-300"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create your first workspace
                    </button>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onSuccess={handleWorkspaceCreated}
      />

      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={handleProjectCreated}
        workspaces={workspaces}
      />
    </>
  );
};

export default Sidebar;