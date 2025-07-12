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
          <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="profile-email"
            name="email"
            type="email"
            autoComplete="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="profile-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            id="profile-username"
            name="username"
            type="text"
            autoComplete="username"
            value={user.username}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="profile-full-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            id="profile-full-name"
            type="text"
            name="full_name"
            autoComplete="name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="profile-avatar-url" className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
          <input
            id="profile-avatar-url"
            type="text"
            name="avatar_url"
            autoComplete="url"
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
