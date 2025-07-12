import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiClient from '../services/api';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({ full_name: '', avatar_url: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.put('/users/me', formData);
      setUser(response.data);
      addNotification('Profile updated', 'success');
    } catch (error) {
      addNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={user.username}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
          <input
            type="text"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
