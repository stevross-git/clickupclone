import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ListView from './pages/ListView';
import CalendarView from './pages/CalendarView';
import BoardView from './pages/BoardView';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<ListView projectId={1} />} />
          <Route path="/calendar" element={<CalendarView projectId={1} />} />
          <Route path="/board" element={<BoardView projectId={1} workspaceId={1} />} />
        </Route>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
