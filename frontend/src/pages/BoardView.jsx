import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import apiClient from '../services/api';
import ActivityLogList from '../components/ActivityLogList';

const statuses = ['open', 'in-progress', 'done'];

const BoardView = ({ projectId, workspaceId }) => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = () => {
    apiClient.get('/tasks/').then(res => setTasks(res.data));
  };

  useEffect(() => {
    fetchTasks();
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws/tasks');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event && data.event.startsWith('task_')) {
        fetchTasks();
      }
    };
    return () => ws.close();
  }, [projectId]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = tasks.find(t => t.id === parseInt(taskId));
    if (!task) return;
    apiClient
      .put(`/tasks/${taskId}`, { ...task, status: newStatus })
      .then(fetchTasks);
  };

  return (
    <>
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {statuses.map(status => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ background: '#eee', padding: '1rem', width: '200px', minHeight: '300px' }}
              >
                <h3>{status}</h3>
                {tasks.filter(t => t.status === status).map((task, idx) => (
                  <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        style={{ padding: '0.5rem', margin: '0.5rem', background: 'white', border: '1px solid #ccc' }}
                      >
                        {task.title}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
    <ActivityLogList workspaceId={workspaceId} />
    </>
  );
};

export default BoardView;
