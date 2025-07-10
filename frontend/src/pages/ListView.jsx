import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const ListView = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    apiClient.get(`/tasks/`).then(res => setTasks(res.data));
  }, [projectId]);

  return (
    <ul>
      {tasks.map(t => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  );
};

export default ListView;
