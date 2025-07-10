import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const TaskModal = ({ task, onClose }) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (task) setTitle(task.title);
  }, [task]);

  const handleSave = () => {
    if (task) {
      apiClient.put(`/tasks/${task.id}`, { title }).then(() => onClose());
    }
  };

  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default TaskModal;
