// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const apiService = {
  // Auth methods
  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/api/v1/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  async register(userData) {
    const response = await apiClient.post('/api/v1/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
  },

  // Dashboard methods
  async getDashboard() {
    const response = await apiClient.get('/api/v1/dashboard');
    return response.data;
  },

  // Workspace methods
  async createWorkspace(workspaceData) {
    const response = await apiClient.post('/api/v1/workspaces/', workspaceData);
    return response.data;
  },

  async getWorkspaces() {
    const response = await apiClient.get('/api/v1/workspaces/');
    return response.data;
  },

  async getWorkspace(workspaceId) {
    const response = await apiClient.get(`/api/v1/workspaces/${workspaceId}`);
    return response.data;
  },

  // Project methods
  async createProject(projectData) {
    const response = await apiClient.post('/api/v1/projects/', projectData);
    return response.data;
  },

  async getProjects(workspaceId = null) {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await apiClient.get('/api/v1/projects/', { params });
    return response.data;
  },

  async getProject(projectId) {
    const response = await apiClient.get(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  // Task methods
  async createTask(taskData) {
    const response = await apiClient.post('/api/v1/tasks/', taskData);
    return response.data;
  },

  async getTasks(filters = {}) {
    const response = await apiClient.get('/api/v1/tasks/', { params: filters });
    return response.data;
  },

  async getTask(taskId) {
    const response = await apiClient.get(`/api/v1/tasks/${taskId}`);
    return response.data;
  },

  async updateTask(taskId, taskData) {
    const response = await apiClient.put(`/api/v1/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Task list methods
  async createTaskList(taskListData) {
    const response = await apiClient.post('/api/v1/task-lists/', taskListData);
    return response.data;
  },

  async getTaskLists(projectId) {
    const response = await apiClient.get('/api/v1/task-lists/', {
      params: { project_id: projectId },
    });
    return response.data;
  },

  // Time tracking methods
  async createTimeEntry(timeEntryData) {
    const response = await apiClient.post('/api/v1/time-entries/', timeEntryData);
    return response.data;
  },

  async getTimeEntries(filters = {}) {
    const response = await apiClient.get('/api/v1/time-entries/', { params: filters });
    return response.data;
  },

  // Comment methods
  async createComment(commentData) {
    const response = await apiClient.post('/api/v1/comments/', commentData);
    return response.data;
  },

  async getComments(taskId) {
    const response = await apiClient.get('/api/v1/comments/', {
      params: { task_id: taskId },
    });
    return response.data;
  },

  // Notification methods
  async getNotifications() {
    const response = await apiClient.get('/api/v1/notifications/');
    return response.data;
  },

  async getUnreadCount() {
    const response = await apiClient.get('/api/v1/notifications/unread-count');
    return response.data.count;
  },

  async markNotificationRead(notificationId) {
    const response = await apiClient.put(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  },

  // Search methods
  async search(query, type = null, projectId = null) {
    const params = { q: query };
    if (type) params.type = type;
    if (projectId) params.project_id = projectId;

    const response = await apiClient.get('/api/v1/search/', { params });
    return response.data;
  },

  // File upload methods
  async uploadFile(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/api/v1/tasks/${taskId}/attachments/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getAttachments(taskId) {
    const response = await apiClient.get(`/api/v1/tasks/${taskId}/attachments/`);
    return response.data;
  },

  // Goals methods
  async createGoal(goalData) {
    const response = await apiClient.post('/api/v1/goals/', goalData);
    return response.data;
  },

  async getGoals(workspaceId) {
    const response = await apiClient.get('/api/v1/goals/', {
      params: { workspace_id: workspaceId },
    });
    return response.data;
  },

  // Analytics methods
  async getProjectAnalytics(projectId, startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await apiClient.get(`/api/v1/analytics/project/${projectId}`, { params });
    return response.data;
  },
};

export default apiService;
