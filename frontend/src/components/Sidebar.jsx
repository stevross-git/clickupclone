// components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  ChartBarIcon,
  InboxIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import CreateProjectModal from './CreateProjectModal';

function Sidebar() {
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(new Set());
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedWorkspaceForProject, setSelectedWorkspaceForProject] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchWorkspaces();
    fetchProjects();
    loadProjectsFromStorage();
  }, []);

  const loadProjectsFromStorage = () => {
    const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    if (storedProjects.length > 0) {
      setProjects(prev => {
        const combined = [...prev, ...storedProjects];
        // Remove duplicates by id
        const unique = combined.filter((project, index, self) => 
          index === self.findIndex(p => p.id === project.id)
        );
        return unique;
      });
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await apiClient.get('/workspaces/');
      setWorkspaces(response.data);
      if (response.data.length > 0) {
        setExpandedWorkspaces(new Set([response.data[0].id]));
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      // Mock data for demo
      setWorkspaces([
        { id: 1, name: "Marketing Team", description: "All marketing projects" },
        { id: 2, name: "Development", description: "Software development" }
      ]);
      setExpandedWorkspaces(new Set([1]));
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects/');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Mock data for demo
      setProjects([
        { id: 1, name: "Website Redesign", workspace_id: 1, color: "#7c3aed" },
        { id: 2, name: "Mobile App", workspace_id: 1, color: "#2563eb" },
        { id: 3, name: "Brand Guidelines", workspace_id: 2, color: "#059669" }
      ]);
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
    return projects.filter(project => project.workspace_id === workspaceId);
  };

  const handleWorkspaceCreated = (newWorkspace) => {
    setWorkspaces(prev => [...prev, newWorkspace]);
    setShowCreateWorkspace(false);
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => {
      const updated = [...prev, newProject];
      // Save to localStorage
      const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      const combined = [...allProjects, newProject];
      localStorage.setItem('projects', JSON.stringify(combined));
      return updated;
    });
    setShowCreateProject(false);
    setSelectedWorkspaceForProject(null);
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <>
      <div className={`${sidebarWidth} bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">ClickUp</h1>
                <p className="text-xs text-gray-500">Team Workspace</p>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1 mb-6">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              {!isCollapsed && <span>Home</span>}
            </Link>

            <div
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-not-allowed opacity-50`}
            >
              <InboxIcon className="h-5 w-5" />
              {!isCollapsed && <span>Inbox</span>}
              {!isCollapsed && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>}
            </div>

            <div
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-not-allowed opacity-50`}
            >
              <CalendarIcon className="h-5 w-5" />
              {!isCollapsed && <span>Calendar</span>}
            </div>

            <div
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-not-allowed opacity-50`}
            >
              <ClockIcon className="h-5 w-5" />
              {!isCollapsed && <span>Time Tracking</span>}
            </div>

            <div
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-not-allowed opacity-50`}
            >
              <ChartBarIcon className="h-5 w-5" />
              {!isCollapsed && <span>Reports</span>}
            </div>
          </div>

          {/* Workspaces Section */}
          {!isCollapsed && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Workspaces
                </h3>
                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-1">
                {workspaces.map(workspace => {
                  const isExpanded = expandedWorkspaces.has(workspace.id);
                  const workspaceProjects = getProjectsForWorkspace(workspace.id);
                  
                  return (
                    <div key={workspace.id}>
                      <div className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg group">
                        <button
                          onClick={() => toggleWorkspace(workspace.id)}
                          className="flex items-center flex-1"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4 mr-2 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 mr-2 text-gray-400" />
                          )}
                          <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                          <span className="flex-1 text-left truncate font-medium">{workspace.name}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorkspaceForProject(workspace);
                            setShowCreateProject(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded ml-2"
                          title="Create Project"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                      </div>
                      
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {workspaceProjects.map(project => (
                            <Link
                              key={project.id}
                              to={`/project/${project.id}`}
                              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors group ${
                                location.pathname === `/project/${project.id}`
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              <div
                                className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="truncate">{project.name}</span>
                              <StarIcon className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 text-gray-400 hover:text-yellow-500" />
                            </Link>
                          ))}
                          {workspaceProjects.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-500">
                              No projects yet
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Favorites */}
          {!isCollapsed && (
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Favorites
              </h3>
              <div className="space-y-1">
                <Link
                  to="/project/1"
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <StarIcon className="h-4 w-4 mr-3 text-yellow-500" />
                  <span className="truncate">Website Redesign</span>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-1">
            <button className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg w-full">
              <UserGroupIcon className="h-5 w-5" />
              {!isCollapsed && <span>Invite People</span>}
            </button>
            <button className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg w-full">
              <Cog6ToothIcon className="h-5 w-5" />
              {!isCollapsed && <span>Settings</span>}
            </button>
          </div>
          
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700"
            >
              Collapse sidebar
            </button>
          )}
          
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center py-2"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onWorkspaceCreated={handleWorkspaceCreated}
        />
      )}

      {showCreateProject && (
        <CreateProjectModal
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspaceForProject}
          onClose={() => {
            setShowCreateProject(false);
            setSelectedWorkspaceForProject(null);
          }}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </>
  );
}

export default Sidebar;