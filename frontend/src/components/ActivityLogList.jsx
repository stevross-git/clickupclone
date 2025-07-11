import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const ActivityLogList = ({ workspaceId }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!workspaceId) return;
    apiClient
      .get('/activity/', { params: { workspace_id: workspaceId } })
      .then(res => setLogs(res.data));
  }, [workspaceId]);

  return (
    <div>
      <h3>Activity</h3>
      <ul>
        {logs.map(log => (
          <li key={log.id}>
            {log.action} task {log.task_id} by user {log.user_id}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLogList;
