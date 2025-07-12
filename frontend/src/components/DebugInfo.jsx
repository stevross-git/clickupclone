// frontend/src/components/DebugInfo.jsx
import React from 'react';

const DebugInfo = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

  // Test API endpoint directly
  const testApi = async () => {
    try {
      console.log('Testing API URL:', apiUrl);
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.text();
      console.log('API Response:', data);
      alert(`API Test: ${response.status} - ${data}`);
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`API Test Failed: ${error.message}`);
    }
  };

  if (import.meta.env.DEV) {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-800 p-4 text-xs text-white">
        <h4 className="mb-2 font-bold">Debug Info</h4>
        <div>API URL: {apiUrl}</div>
        <div>WS URL: {wsUrl}</div>
        <div>Mode: {import.meta.env.MODE}</div>
        <button onClick={testApi} className="mt-2 rounded bg-blue-600 px-2 py-1 text-xs">
          Test API
        </button>
      </div>
    );
  }

  return null;
};

export default DebugInfo;
