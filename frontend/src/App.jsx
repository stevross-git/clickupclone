// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import TaskView from './pages/TaskView';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/project/:projectId" element={
                <ProtectedRoute>
                  <ProjectView />
                </ProtectedRoute>
              } />
              <Route path="/task/:taskId" element={
                <ProtectedRoute>
                  <TaskView />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient.get('/auth/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    localStorage.setItem('accessToken', response.data.access_token);
    
    const userResponse = await apiClient.get('/auth/me');
    setUser(userResponse.data);
    
    return userResponse.data;
  };

  const register = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// contexts/NotificationContext.jsx
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg ${
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'success' ? 'bg-green-500' :
            'bg-blue-500'
          } text-white`}
          onClick={() => removeNotification(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}

// components/Header.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">ClickUp Clone</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">Welcome, {user?.full_name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

// components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';

function Sidebar() {
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const location = useLocation();

  useEffect(() => {
    fetchWorkspaces();
    fetchProjects();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await apiClient.get('/workspaces/');
      setWorkspaces(response.data);
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

  return (
    <div className="bg-gray-900 text-white w-64 flex-shrink-0">
      <div className="p-4">
        <nav className="space-y-2">
          <Link
            to="/dashboard"
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === '/dashboard'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Workspaces
          </h3>
          <div className="mt-2 space-y-1">
            {workspaces.map(workspace => (
              <div key={workspace.id} className="px-3 py-1 text-sm text-gray-300">
                {workspace.name}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Projects
          </h3>
          <div className="mt-2 space-y-1">
            {projects.map(project => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className={`block px-3 py-2 rounded-md text-sm ${
                  location.pathname === `/project/${project.id}`
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// components/KanbanBoard.jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import apiClient from '../services/api';
import TaskCard from './TaskCard';
import { useNotification } from '../contexts/NotificationContext';

function KanbanBoard({ projectId }) {
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchLists();
    fetchTasks();
  }, [projectId]);

  const fetchLists = async () => {
    try {
      const response = await apiClient.get(`/task-lists/?project_id=${projectId}`);
      setLists(response.data);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get(`/tasks/?project_id=${projectId}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const taskId = parseInt(draggableId);

    if (source.droppableId !== destination.droppableId) {
      // Moving between lists
      try {
        await apiClient.post(`/tasks/${taskId}/move`, {
          task_list_id: parseInt(destination.droppableId),
          position: destination.index
        });
        
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { ...task, task_list_id: parseInt(destination.droppableId) }
              : task
          )
        );
        
        addNotification('Task moved successfully', 'success');
      } catch (error) {
        addNotification('Error moving task', 'error');
      }
    }
  };

  const getTasksForList = (listId) => {
    return tasks.filter(task => task.task_list_id === listId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex space-x-4 p-4 overflow-x-auto">
        {lists.map(list => (
          <div key={list.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">{list.name}</h3>
              
              <Droppable droppableId={list.id.toString()}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-32 ${
                      snapshot.isDraggingOver ? 'bg-gray-200' : ''
                    }`}
                  >
                    {getTasksForList(list.id).map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? 'rotate-2' : ''}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

// components/TaskCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function TaskCard({ task }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link to={`/task/${task.id}`}>
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
        <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
        
        {task.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 3).map(assignee => (
                <img
                  key={assignee.id}
                  className="w-6 h-6 rounded-full border-2 border-white"
                  src={assignee.avatar_url || `https://ui-avatars.com/api/?name=${assignee.full_name}&background=random`}
                  alt={assignee.full_name}
                  title={assignee.full_name}
                />
              ))}
              {task.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        
        {task.due_date && (
          <div className="mt-2 text-xs text-gray-500">
            Due: {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
      </div>
    </Link>
  );
}

// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{dashboardData.task_summary.in_progress_tasks}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{dashboardData.task_summary.overdue_tasks}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {dashboardData.recent_projects.map(project => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{project.name}</div>
                    <div className="text-sm text-gray-500">{project.description}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
          <div className="space-y-3">
            {dashboardData.recent_tasks.map(task => (
              <Link
                key={task.id}
                to={`/task/${task.id}`}
                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      {task.status.replace('_', ' ')} • {task.priority}
                    </div>
                  </div>
                  {task.due_date && (
                    <div className="text-sm text-gray-500">
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// pages/ProjectView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import KanbanBoard from '../components/KanbanBoard';
import ListView from '../components/ListView';
import CalendarView from '../components/CalendarView';
import apiClient from '../services/api';

function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [view, setView] = useState('kanban');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className="w-6 h-6 rounded-full mr-3"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">{project.description}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-2 text-sm rounded-md ${
                view === 'kanban'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm rounded-md ${
                view === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 text-sm rounded-md ${
                view === 'calendar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'kanban' && <KanbanBoard projectId={projectId} />}
        {view === 'list' && <ListView projectId={projectId} />}
        {view === 'calendar' && <CalendarView projectId={projectId} />}
      </div>
    </div>
  );
}

// components/ListView.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';

function ListView({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [projectId, filters]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({ project_id: projectId });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await apiClient.get(`/tasks/?${params}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setShowCreateModal(false);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex space-x-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm"
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TaskCard task={task} />
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks found</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}

// components/CreateTaskModal.jsx
import React, { useState } from 'react';
import apiClient from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

function CreateTaskModal({ projectId, onClose, onTaskCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assignee_ids: []
  });
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        ...formData,
        project_id: projectId,
        due_date: formData.due_date || null
      };

      const response = await apiClient.post('/tasks/', taskData);
      onTaskCreated(response.data);
      addNotification('Task created successfully', 'success');
    } catch (error) {
      addNotification('Error creating task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// components/CalendarView.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiClient from '../services/api';

const localizer = momentLocalizer(moment);

function CalendarView({ projectId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get(`/tasks/?project_id=${projectId}`);
      const calendarEvents = response.data
        .filter(task => task.due_date)
        .map(task => ({
          id: task.id,
          title: task.title,
          start: new Date(task.due_date),
          end: new Date(task.due_date),
          allDay: true,
          resource: task
        }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    const task = event.resource;
    let backgroundColor = '#3174ad';
    
    switch (task.priority) {
      case 'urgent':
        backgroundColor = '#dc2626';
        break;
      case 'high':
        backgroundColor = '#ea580c';
        break;
      case 'medium':
        backgroundColor = '#ca8a04';
        break;
      case 'low':
        backgroundColor = '#16a34a';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: task.status === 'done' ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="h-full p-6">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 200px)' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => {
          // Navigate to task detail
          window.location.href = `/task/${event.id}`;
        }}
      />
    </div>
  );
}

// pages/TaskView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import CommentSection from '../components/CommentSection';
import { useNotification } from '../contexts/NotificationContext';

function TaskView() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await apiClient.get(`/tasks/${taskId}`);
      setTask(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, formData);
      setTask(response.data);
      setEditing(false);
      addNotification('Task updated successfully', 'success');
    } catch (error) {
      addNotification('Error updating task', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiClient.delete(`/tasks/${taskId}`);
        addNotification('Task deleted successfully', 'success');
        navigate(`/project/${task.project_id}`);
      } catch (error) {
        addNotification('Error deleting task', 'error');
      }
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!task) return <div className="p-8">Task not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Task Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/project/${task.project_id}`)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Project
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Task Content */}
        <div className="space-y-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date ? formData.due_date.split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{task.title}</h1>
              
              {task.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Status</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'done' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Priority</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Created</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>

                {task.due_date && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Due Date</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {task.assignees && task.assignees.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Assignees</h4>
                  <div className="flex space-x-2">
                    {task.assignees.map(assignee => (
                      <div key={assignee.id} className="flex items-center space-x-2">
                        <img
                          className="w-8 h-8 rounded-full"
                          src={assignee.avatar_url || `https://ui-avatars.com/api/?name=${assignee.full_name}&background=random`}
                          alt={assignee.full_name}
                        />
                        <span className="text-sm text-gray-700">{assignee.full_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <CommentSection taskId={taskId} />
        </div>
      </div>
    </div>
  );
}

// components/CommentSection.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function CommentSection({ taskId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const response = await apiClient.get(`/comments/?task_id=${taskId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await apiClient.post('/comments/', {
        content: newComment,
        task_id: parseInt(taskId)
      });
      
      setComments(prev => [...prev, response.data]);
      setNewComment('');
      addNotification('Comment added successfully', 'success');
    } catch (error) {
      addNotification('Error adding comment', 'error');
    }
  };

  if (loading) return <div>Loading comments...</div>;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
      
      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex space-x-3">
          <img
            className="w-8 h-8 rounded-full"
            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&background=random`}
            alt={user?.full_name}
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full rounded-md border-gray-300 shadow-sm"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex space-x-3">
            <img
              className="w-8 h-8 rounded-full"
              src={comment.author.avatar_url || `https://ui-avatars.com/api/?name=${comment.author.full_name}&background=random`}
              alt={comment.author.full_name}
            />
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{comment.author.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-4">No comments yet</p>
        )}
      </div>
    </div>
  );
}

export default App;2xl font-bold text-gray-900">{dashboardData.task_summary.total_tasks}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{dashboardData.task_summary.completed_tasks}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-