// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import CreateProjectModal from './CreateProjectModal';

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();

  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(new Set());
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);

  // ──────────────────────────────────────────────────────────────
  // Data loading helpers
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadWorkspacesAndProjects();
    // eslint‑disable‑next‑line react-hooks/exhaustive-deps
  }, []);

  const loadWorkspacesAndProjects = async () => {
    try {
      const [workspacesData, projectsData] = await Promise.all([
        apiService.getWorkspaces(),
        apiService.getProjects(),
      ]);

      setWorkspaces(workspacesData);
      setProjects(projectsData);

      // auto‑expand every workspace that already has projects
      setExpandedWorkspaces(new Set(projectsData.map((p) => p.workspace_id)));
    } catch (err) {
      console.error('Failed to load workspaces / projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkspace = (id) =>
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const getProjectsForWorkspace = (id) => projects.filter((p) => p.workspace_id === id);

  // ──────────────────────────────────────────────────────────────
  // Navigation defs
  // ──────────────────────────────────────────────────────────────
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
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (href) => location.pathname === href;

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Sidebar container (mobile slide‑in + desktop static) ── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header / logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ClickUp&nbsp;Clone</span>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 lg:hidden"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* User panel */}
          <div className="border-b border-gray-200 p-4">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <label htmlFor="sidebar-search" className="sr-only">
                Search
              </label>
              <input
                id="sidebar-search"
                type="text"
                placeholder="Search"
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Main nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`
                  group relative flex items-center rounded-md px-3 py-2 text-sm font-medium
                  ${
                    isActive(item.href)
                      ? 'border-r-2 border-purple-700 bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${
                      isActive(item.href)
                        ? 'text-purple-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                />
                {item.name}
                {item.badge && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Workspace list */}
            <div className="pt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Workspaces
                </h3>
                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  className="rounded p-1 text-gray-400 hover:text-gray-600"
                  title="Create workspace"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="px-3 py-2">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 rounded bg-gray-200" />
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                  </div>
                </div>
              ) : workspaces.length === 0 ? (
                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  className="flex w-full items-center rounded-md border-2 border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create your first workspace
                </button>
              ) : (
                <div className="space-y-1">
                  {workspaces.map((ws) => {
                    const wsProjects = getProjectsForWorkspace(ws.id);
                    const expanded = expandedWorkspaces.has(ws.id);

                    return (
                      <div key={ws.id}>
                        <button
                          onClick={() => toggleWorkspace(ws.id)}
                          className="group flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          {wsProjects.length > 0 ? (
                            expanded ? (
                              <ChevronDownIcon className="mr-2 h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="mr-2 h-4 w-4 text-gray-400" />
                            )
                          ) : (
                            <span className="mr-2 h-4 w-4" />
                          )}
                          <FolderIcon className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="flex-1 truncate text-left">{ws.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCreateProject(true);
                            }}
                            className="rounded p-1 text-gray-400 opacity-0 hover:text-gray-600 group-hover:opacity-100"
                            title="Create project"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </button>

                        {/* Projects */}
                        {expanded && wsProjects.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {wsProjects.map((proj) => (
                              <Link
                                key={proj.id}
                                to={`/project/${proj.id}`}
                                onClick={onClose}
                                className={`
                                  flex items-center rounded-md px-3 py-1.5 text-sm
                                  ${
                                    location.pathname === `/project/${proj.id}`
                                      ? 'bg-purple-50 text-purple-700'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }
                                `}
                              >
                                <span
                                  className="mr-2 h-3 w-3 flex-shrink-0 rounded"
                                  style={{ backgroundColor: proj.color }}
                                />
                                <span className="truncate">{proj.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Sign‑out */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={logout}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
                />
              </svg>
              Sign&nbsp;out
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        onSuccess={loadWorkspacesAndProjects}
      />
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={loadWorkspacesAndProjects}
        workspaces={workspaces}
      />
    </>
  );
};

export default Sidebar;
