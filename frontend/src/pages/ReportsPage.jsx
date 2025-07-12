import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

function ReportsPage() {
  const { addNotification } = useNotification();
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selected) fetchAnalytics(selected);
  }, [selected]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await apiClient.getProjects();
      setProjects(res);
      if (res.length > 0) setSelected(res[0].id);
    } catch (error) {
      console.error('Failed to load projects', error);
      addNotification('error', 'Error', 'Could not load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchAnalytics = async (projectId) => {
    try {
      setLoadingData(true);
      const res = await apiClient.getProjectAnalytics(projectId);
      setData(res);
    } catch (error) {
      console.error('Failed to load analytics', error);
      addNotification('error', 'Error', 'Could not load report data');
    } finally {
      setLoadingData(false);
    }
  };

  const statusColors = {
    todo: '#4b5563',
    in_progress: '#3b82f6',
    review: '#f59e0b',
    done: '#10b981',
  };

  const priorityColors = {
    urgent: '#dc2626',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#10b981',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <select
          className="rounded border-gray-300 text-sm"
          value={selected || ''}
          onChange={(e) => setSelected(parseInt(e.target.value, 10))}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {loadingProjects || loadingData ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.total_tasks}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.completed_tasks}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.in_progress_tasks}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.overdue_tasks}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-4">
              <h2 className="mb-2 text-sm font-medium text-gray-700">Status Distribution</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.status_distribution}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {data.status_distribution.map((entry) => (
                        <Cell key={entry.status} fill={statusColors[entry.status] || '#a3a3a3'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Tasks']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="mb-2 text-sm font-medium text-gray-700">Priority Distribution</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.priority_distribution}
                      dataKey="count"
                      nameKey="priority"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {data.priority_distribution.map((entry) => (
                        <Cell key={entry.priority} fill={priorityColors[entry.priority] || '#a3a3a3'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Tasks']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Completion Timeline */}
          <div className="card p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-700">Completions (last 30 days)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.completion_timeline}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7b68ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="card p-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{data.time_tracking.total_hours.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Hours / Entry</p>
              <p className="text-2xl font-bold text-gray-900">{data.time_tracking.average_hours.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">No data available</p>
      )}
    </div>
  );
}

export default ReportsPage;
