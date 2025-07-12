import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('profile');

  // ──────────────────────────────────────────────────────────────
  // Profile
  // ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ full_name: '', avatar_url: '' });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profile);
      addNotification('success', 'Success', 'Profile updated');
    } catch (err) {
      console.error('Failed to update profile', err);
      addNotification('error', 'Error', 'Failed to update profile');
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Preferences
  // ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ──────────────────────────────────────────────────────────────
  // Notification settings
  // ──────────────────────────────────────────────────────────────
  const [emailNotif, setEmailNotif] = useState(() => localStorage.getItem('emailNotif') === 'true');
  const [pushNotif, setPushNotif] = useState(() => localStorage.getItem('pushNotif') === 'true');

  useEffect(() => {
    localStorage.setItem('emailNotif', emailNotif);
  }, [emailNotif]);

  useEffect(() => {
    localStorage.setItem('pushNotif', pushNotif);
  }, [pushNotif]);

  // ──────────────────────────────────────────────────────────────
  // Security
  // ──────────────────────────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });

  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    setPwdForm((p) => ({ ...p, [name]: value }));
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new !== pwdForm.confirm) {
      addNotification('error', 'Error', 'Passwords do not match');
      return;
    }
    try {
      await apiService.changePassword(pwdForm.current, pwdForm.new);
      addNotification('success', 'Success', 'Password updated');
      setPwdForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error('Failed to change password', err);
      addNotification('error', 'Error', 'Failed to change password');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile' },
    { id: 'preferences', name: 'Preferences' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'security', name: 'Security' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex gap-6">
        <nav className="w-48 space-y-1 text-sm" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50',
                'w-full rounded-md px-3 py-2 text-left font-medium'
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
        <div className="flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={profile.full_name}
                  onChange={handleProfileChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="avatar_url" className="mb-1 block text-sm font-medium text-gray-700">
                  Avatar URL
                </label>
                <input
                  id="avatar_url"
                  name="avatar_url"
                  type="text"
                  value={profile.avatar_url}
                  onChange={handleProfileChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <button type="submit" className="btn-primary">
                Save Profile
              </button>
            </form>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Switch.Group as="div" className="flex items-center justify-between">
                <Switch.Label className="mr-4 text-sm text-gray-700">Email Notifications</Switch.Label>
                <Switch
                  checked={emailNotif}
                  onChange={setEmailNotif}
                  className={classNames(
                    emailNotif ? 'bg-purple-600' : 'bg-gray-200',
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors'
                  )}
                >
                  <span
                    className={classNames(
                      emailNotif ? 'translate-x-6' : 'translate-x-1',
                      'inline-block h-4 w-4 transform rounded-full bg-white'
                    )}
                  />
                </Switch>
              </Switch.Group>

              <Switch.Group as="div" className="flex items-center justify-between">
                <Switch.Label className="mr-4 text-sm text-gray-700">Push Notifications</Switch.Label>
                <Switch
                  checked={pushNotif}
                  onChange={setPushNotif}
                  className={classNames(
                    pushNotif ? 'bg-purple-600' : 'bg-gray-200',
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors'
                  )}
                >
                  <span
                    className={classNames(
                      pushNotif ? 'translate-x-6' : 'translate-x-1',
                      'inline-block h-4 w-4 transform rounded-full bg-white'
                    )}
                  />
                </Switch>
              </Switch.Group>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={updatePassword} className="space-y-4 max-w-sm">
              <div>
                <label htmlFor="current" className="mb-1 block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="current"
                  name="current"
                  type="password"
                  value={pwdForm.current}
                  onChange={handlePwdChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="new" className="mb-1 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="new"
                  name="new"
                  type="password"
                  value={pwdForm.new}
                  onChange={handlePwdChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={pwdForm.confirm}
                  onChange={handlePwdChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <button type="submit" className="btn-primary">
                Change Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
