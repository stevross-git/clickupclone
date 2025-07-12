// frontend/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.response?.data?.detail) {
          toast.error(error.response.data.detail);
        } else if (error.message) {
          toast.error(error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(credentials) {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await this.client.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      // Get user info
      const userResponse = await this.client.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(userResponse.data));
    }

    return response.data;
  }

  async register(userData) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Dashboard
  async getDashboard() {
    const response = await this.client.get('/dashboard');
    return response.data;
  }

  // Workspaces
  async getWorkspaces() {
    const response = await this.client.get('/workspaces/');
    return response.data;
  }

  async createWorkspace(data) {
    const response = await this.client.post('/workspaces/', data);
    return response.data;
  }

  async getWorkspace(id) {
    const response = await this.client.get(`/workspaces/${id}`);
    return response.data;
  }

  async updateWorkspace(id, data) {
    const response = await this.client.put(`/workspaces/${id}`, data);
    return response.data;
  }

  // Projects
  async getProjects(workspaceId = null) {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.client.get('/projects/', { params });
    return response.data;
  }

  async createProject(data) {
    const response = await this.client.post('/projects/', data);
    return response.data;
  }

  async getProject(id) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async updateProject(id, data) {
    const response = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  // Task Lists
  async getTaskLists(projectId) {
    const response = await this.client.get('/task-lists/', {
      params: { project_id: projectId },
    });
    return response.data;
  }

  async createTaskList(data) {
    const response = await this.client.post('/task-lists/', data);
    return response.data;
  }

  async updateTaskList(id, data) {
    const response = await this.client.put(`/task-lists/${id}`, data);
    return response.data;
  }

  // Tasks
  async getTasks(params = {}) {
    const response = await this.client.get('/tasks/', { params });
    return response.data;
  }

  async createTask(data) {
    const response = await this.client.post('/tasks/', data);
    return response.data;
  }

  async getTask(id) {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  async updateTask(id, data) {
    const response = await this.client.put(`/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id) {
    await this.client.delete(`/tasks/${id}`);
  }

  // Time Entries
  async getTimeEntries(params = {}) {
    const response = await this.client.get('/time-entries/', { params });
    return response.data;
  }

  async createTimeEntry(data) {
    const response = await this.client.post('/time-entries/', data);
    return response.data;
  }

  async updateTimeEntry(id, data) {
    const response = await this.client.put(`/time-entries/${id}`, data);
    return response.data;
  }

  async deleteTimeEntry(id) {
    await this.client.delete(`/time-entries/${id}`);
  }

  // Comments
  async getComments(taskId) {
    const response = await this.client.get('/comments/', {
      params: { task_id: taskId },
    });
    return response.data;
  }

  async createComment(data) {
    const response = await this.client.post('/comments/', data);
    return response.data;
  }

  async updateComment(id, data) {
    const response = await this.client.put(`/comments/${id}`, data);
    return response.data;
  }

  async deleteComment(id) {
    await this.client.delete(`/comments/${id}`);
  }

  // File uploads
  async uploadFile(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(`/tasks/${taskId}/attachments/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getAttachments(taskId) {
    const response = await this.client.get(`/tasks/${taskId}/attachments/`);
    return response.data;
  }

  // Custom Fields
  async getCustomFields(projectId) {
    const response = await this.client.get('/custom-fields/', {
      params: { project_id: projectId },
    });
    return response.data;
  }

  async createCustomField(data) {
    const response = await this.client.post('/custom-fields/', data);
    return response.data;
  }

  async updateCustomField(id, data) {
    const response = await this.client.put(`/custom-fields/${id}`, data);
    return response.data;
  }

  // Goals
  async getGoals(workspaceId) {
    const response = await this.client.get('/goals/', {
      params: { workspace_id: workspaceId },
    });
    return response.data;
  }

  async createGoal(data) {
    const response = await this.client.post('/goals/', data);
    return response.data;
  }

  async updateGoal(id, data) {
    const response = await this.client.put(`/goals/${id}`, data);
    return response.data;
  }

  // Notifications
  async getNotifications() {
    const response = await this.client.get('/notifications/');
    return response.data;
  }

  async markNotificationRead(id) {
    await this.client.put(`/notifications/${id}/read`);
  }

  // Search
  async search(query, type = null, projectId = null) {
    const params = { q: query };
    if (type) params.type = type;
    if (projectId) params.project_id = projectId;

    const response = await this.client.get('/search/', { params });
    return response.data;
  }

  // Generic CRUD methods
  async get(endpoint, params = {}) {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  async post(endpoint, data) {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async put(endpoint, data) {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint) {
    await this.client.delete(endpoint);
  }
}

const apiService = new ApiService();
export default apiService;
