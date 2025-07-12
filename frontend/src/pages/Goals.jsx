import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '' });

  const fetchGoals = () => {
    apiClient.get('/goals')
      .then(res => setGoals(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/goals', {
        ...formData,
        workspace_id: user?.workspaces?.[0]?.id || 1
      });
      setFormData({ title: '', description: '', due_date: '' });
      fetchGoals();
    } catch (err) {
      console.error('Error creating goal', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Goals</h1>
      <form onSubmit={handleSubmit} className="space-x-2 mb-4">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Title"
          className="border px-2"
          required
        />
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          className="border px-2"
        />
        <input
          type="date"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
          className="border px-2"
        />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Add Goal</button>
      </form>
      <ul className="space-y-2">
        {goals.map(goal => (
          <li key={goal.id} className="border px-3 py-2 rounded">
            {goal.title} {goal.progress}% {goal.is_completed ? '(Done)' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Goals;
