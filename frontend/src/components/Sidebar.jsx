// components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon 
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
  const location = useLocation();

  useEffect(() => {
    fetchWorkspaces();
    fetchProjects();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await apiClient.get('/workspaces/');
      setWorkspaces(response.data);
      // Expand first workspace by default
      if (response.data.length > 0) {
        setExpandedWorkspaces(new Set([response.data[0].id]));
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects/');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
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
    setProjects(prev => [...prev, newProject]);
    setShowCreateProject(false);
  };

  return (
    <>
      <div className="bg-gray-900 text-white w-64 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-lg font-semibold">ClickUp Clone</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Dashboard Link */}
          <Link
            to="/dashboard"
            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium mb-4 ${
              location.pathname === '/dashboard'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          {/* Workspaces Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Workspaces
              </h3>
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="p-1 text-gray-400 hover:text-white"
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
                    <button
                      onClick={() => toggleWorkspace(workspace.id)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-2" />
                      )}
                      <FolderIcon className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left truncate">{workspace.name}</span>
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Projects</span>
                          <button
                            onClick={() => setShowCreateProject(true)}
                            className="p-1 text-gray-500 hover:text-white"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </div>
                        {workspaceProjects.map(project => (
                          <Link
                            key={project.id}
                            to={`/project/${project.id}`}
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${
                              location.pathname === `/project/${project.id}`
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
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
            </div>
          </div>
        </nav>
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
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </>
  );
}

export default Sidebar;