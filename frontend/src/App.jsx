// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';
import TimeTracking from './pages/TimeTracking';

// Placeholder components for missing routes
const InboxPage = () => (
  <div className="p-8 text-center">
    <h1 className="mb-4 text-2xl font-bold text-gray-900">Inbox</h1>
    <p className="text-gray-600">Inbox functionality coming soon...</p>
  </div>
);

const CalendarPage = () => (
  <div className="p-8 text-center">
    <h1 className="mb-4 text-2xl font-bold text-gray-900">Calendar</h1>
    <p className="text-gray-600">Calendar functionality coming soon...</p>
  </div>
);

const GoalsPage = () => (
  <div className="p-8 text-center">
    <h1 className="mb-4 text-2xl font-bold text-gray-900">Goals</h1>
    <p className="text-gray-600">Goals functionality coming soon...</p>
  </div>
);

const ReportsPage = () => (
  <div className="p-8 text-center">
    <h1 className="mb-4 text-2xl font-bold text-gray-900">Reports</h1>
    <p className="text-gray-600">Reports functionality coming soon...</p>
  </div>
);

const NotificationsPage = () => (
  <div className="p-8 text-center">
    <h1 className="mb-4 text-2xl font-bold text-gray-900">Notifications</h1>
    <p className="text-gray-600">Notifications functionality coming soon...</p>
  </div>
);

const SettingsPage = () => (
  <div className="p-8 text-center">
    <h1 className="mb-4 text-2xl font-bold text-gray-900">Settings</h1>
    <p className="text-gray-600">Settings functionality coming soon...</p>
  </div>
);

const WorkspaceView = () => (
  <div className="p-8 text-center">
    <h1 className="mb-4 text-2xl font-bold text-gray-900">Workspace View</h1>
    <p className="text-gray-600">Workspace view functionality coming soon...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="time-tracking" element={<TimeTracking />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="workspace/:workspaceId" element={<WorkspaceView />} />
                <Route path="project/:projectId" element={<ProjectView />} />
                <Route index element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
