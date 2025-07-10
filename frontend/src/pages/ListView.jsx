import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import TaskModal from '../components/TaskModal';

const ListView = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = () => {
    apiClient.get(`/tasks/`).then(res => setTasks(res.data));
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleAdd = async () => {
    if (!newTask) return;
    const res = await apiClient.post('/tasks/', {
      title: newTask,
      description: '',
      status: 'open',
    });
    setTasks([...tasks, res.data]);
    setNewTask('');
  };

  return (
    <div>
      <div>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="New task"
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <ul>
        {tasks.map(t => (
          <li key={t.id} onClick={() => setEditingTask(t)}>
            {t.title}
            {t.due_date && ` (due ${t.due_date})`}
          </li>
        ))}
      </ul>
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};

export default ListView;
