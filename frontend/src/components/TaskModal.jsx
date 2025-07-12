import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const TaskModal = ({ task, onClose }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.due_date || '');
    }
  }, [task]);

  const handleSave = () => {
    if (task) {
      apiClient
        .put(`/tasks/${task.id}`, {
          title,
          description: task.description || '',
          status: task.status || 'open',
          due_date: dueDate || null,
        })
        .then(() => onClose());
    }
  };

  const handleDelete = () => {
    if (task) {
      apiClient.delete(`/tasks/${task.id}`).then(() => onClose());
    }
  };

  return (
    <div>
      <label htmlFor="task-modal-title">Title</label>
      <input
        id="task-modal-title"
        name="title"
        type="text"
        autoComplete="off"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <label htmlFor="task-modal-due-date">Due Date</label>
      <input
        id="task-modal-due-date"
        name="due_date"
        type="date"
        autoComplete="off"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default TaskModal;
