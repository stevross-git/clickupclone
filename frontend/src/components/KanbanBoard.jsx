// components/KanbanBoard.jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/api';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { useNotification } from '../contexts/NotificationContext';

function KanbanBoard({ projectId }) {
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchLists();
    fetchTasks();
  }, [projectId]);

  const fetchLists = async () => {
    try {
      const response = await apiClient.get(`/task-lists/?project_id=${projectId}`);
      setLists(response.data);
    } catch (error) {
      console.error('Error fetching lists:', error);
      addNotification('Error loading task lists', 'error');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get(`/tasks/?project_id=${projectId}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      addNotification('Error loading tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const taskId = parseInt(draggableId);

    // Optimistic update
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { ...t, task_list_id: parseInt(destination.droppableId), position: destination.index }
        : t
    );
    setTasks(updatedTasks);

    try {
      if (source.droppableId !== destination.droppableId) {
        // Moving between lists
        await apiClient.post(`/tasks/${taskId}/move`, {
          task_list_id: parseInt(destination.droppableId),
          position: destination.index
        });
        addNotification('Task moved successfully', 'success');
      } else {
        // Reordering within the same list
        await apiClient.put(`/tasks/${taskId}`, {
          position: destination.index
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setTasks(tasks);
      addNotification('Error moving task', 'error');
    }
  };

  const getTasksForList = (listId) => {
    return tasks
      .filter(task => task.task_list_id === listId)
      .sort((a, b) => a.position - b.position);
  };

  const handleCreateTask = (listId) => {
    setSelectedListId(listId);
    setShowCreateTask(true);
  };

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [...prev, newTask]);
    setShowCreateTask(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-6 p-6 overflow-x-auto min-h-full">
          {lists.map(list => (
            <div key={list.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-100 rounded-lg">
                {/* List Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: list.color }}
                      />
                      <h3 className="font-semibold text-gray-900">{list.name}</h3>
                      <span className="text-sm text-gray-500">
                        ({getTasksForList(list.id).length})
                      </span>
                    </div>
                    <button
                      onClick={() => handleCreateTask(list.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <Droppable droppableId={list.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 min-h-32 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        {getTasksForList(list.id).map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transform transition-transform ${
                                  snapshot.isDragging ? 'rotate-3 scale-105' : ''
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform} rotate(3deg)` 
                                    : provided.draggableProps.style?.transform
                                }}
                              >
                                <TaskCard task={task} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                      
                      {/* Add Task Button */}
                      <button
                        onClick={() => handleCreateTask(list.id)}
                        className="w-full mt-3 p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <PlusIcon className="h-4 w-4" />
                          <span className="text-sm">Add Task</span>
                        </div>
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}

          {/* Add List Button */}
          <div className="flex-shrink-0 w-80">
            <button className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
              <div className="flex flex-col items-center justify-center space-y-2">
                <PlusIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Add List</span>
              </div>
            </button>
          </div>
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={projectId}
          listId={selectedListId}
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  );
}

export default KanbanBoard;