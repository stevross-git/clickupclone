import React, { useEffect, useState } from 'react';
import { differenceInDays, format, eachDayOfInterval } from 'date-fns';
import apiClient from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

function GanttView({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get(`/tasks/?project_id=${projectId}`);
      const filtered = response.data.filter(t => t.start_date && t.due_date);
      setTasks(filtered);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      addNotification('Error loading gantt data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Gantt View</h2>
        <p className="text-gray-500">No tasks with start and due dates</p>
      </div>
    );
  }

  const startDates = tasks.map(t => new Date(t.start_date));
  const endDates = tasks.map(t => new Date(t.due_date));
  const start = new Date(Math.min(...startDates));
  const end = new Date(Math.max(...endDates));
  const totalDays = differenceInDays(end, start) + 1;
  const days = eachDayOfInterval({ start, end });

  const getColor = priority => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const dayWidth = 100 / totalDays;

  const getLeft = date => {
    return differenceInDays(new Date(date), start) * dayWidth;
  };

  const getWidth = (s, e) => {
    return (differenceInDays(new Date(e), new Date(s)) + 1) * dayWidth;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Gantt View</h2>
          <p className="text-sm text-gray-600">Timeline of tasks in this project</p>
        </div>
        <div className="p-4 overflow-auto">
          {/* Header dates */}
          <div className="relative mb-4 flex text-sm font-medium text-gray-600">
            {days.map(d => (
              <div
                key={d.toISOString()}
                className="border-r border-gray-200 px-2"
                style={{ width: `${dayWidth}%` }}
              >
                {format(d, 'MMM d')}
              </div>
            ))}
          </div>

          {/* Task bars */}
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="relative h-6 text-xs">
                <div
                  className={`absolute h-6 rounded ${getColor(task.priority)} text-white flex items-center px-2`}
                  style={{
                    left: `${getLeft(task.start_date)}%`,
                    width: `${getWidth(task.start_date, task.due_date)}%`
                  }}
                >
                  {task.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GanttView;
