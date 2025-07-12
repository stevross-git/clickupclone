// pages/TimeTracking.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function TimeTracking() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    duration: 0
  });

  useEffect(() => {
    if (!user) return;
    apiClient.get(`/tasks?assignee_id=${user.id}`)
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  }, [user]);

  const loadEntries = (taskId) => {
    apiClient.get(`/tasks/${taskId}/time-entries`)
      .then(res => setEntries(res.data))
      .catch(err => console.error(err));
  };

  const handleSelectTask = (e) => {
    const taskId = e.target.value;
    setSelectedTask(taskId);
    if (taskId) loadEntries(taskId);
    else setEntries([]);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await apiClient.post(`/tasks/${selectedTask}/time-entries`, {
        task_id: parseInt(selectedTask),
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration: parseFloat(formData.duration)
      });
      setFormData({ start_time: '', end_time: '', duration: 0 });
      loadEntries(selectedTask);
    } catch (err) {
      console.error('Error creating entry', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Time Tracking</h1>
      <div className="mb-4">
        <select value={selectedTask} onChange={handleSelectTask} className="border px-2 py-1">
          <option value="">Select task</option>
          {tasks.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>
      {selectedTask && (
        <div>
          <form onSubmit={handleSubmit} className="space-x-2 mb-4">
            <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} className="border px-2" required />
            <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} className="border px-2" required />
            <input type="number" step="0.1" name="duration" value={formData.duration} onChange={handleChange} className="border px-2 w-24" />
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Add Entry</button>
          </form>
          <ul className="space-y-2">
            {entries.map(entry => (
              <li key={entry.id} className="border px-3 py-2 rounded">
                {new Date(entry.start_time).toLocaleString()} - {new Date(entry.end_time).toLocaleString()} ({entry.duration}h)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TimeTracking;
