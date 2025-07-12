// frontend/src/components/KanbanBoard.jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

function KanbanBoard({ project, tasks, taskLists, onTaskUpdated, onTaskDeleted, onCreateTask }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskModalClose = () => {
    setSelectedTask(null);
    setShowTaskModal(false);
  };

  const handleTaskUpdate = (updatedTask) => {
    onTaskUpdated(updatedTask);
    setSelectedTask(updatedTask);
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task that was moved
    const task = tasks.find(t => t.id === parseInt(draggableId));
    if (!task) return;

    // Update task with new list and position
    const updatedTask = {
      ...task,
      task_list_id: parseInt(destination.droppableId),
      position: destination.index
    };

    onTaskUpdated(updatedTask);
    
    // TODO: Call API to update task position
    // apiClient.put(`/tasks/${task.id}`, updatedTask);
  };

  const getTasksForList = (listId) => {
    return tasks
      .filter(task => task.task_list_id === listId)
      .sort((a, b) => a.position - b.position);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-orange-500';
      case 'done':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full overflow-x-auto p-6 space-x-6">
          {taskLists.map((list) => (
            <div key={list.id} className="flex-shrink-0 w-80">
              <Droppable droppableId={list.id.toString()}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-white rounded-lg shadow-sm border h-full flex flex-col ${
                      snapshot.isDraggingOver ? 'bg-purple-50 border-purple-200' : 'border-gray-200'
                    }`}
                  >
                    {/* List Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(list.name.toLowerCase().replace(' ', '_'))}`}
                        ></div>
                        <h3 className="font-medium text-gray-900">{list.name}</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {getTasksForList(list.id).length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onCreateTask(list.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
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
                              className={`${
                                snapshot.isDragging ? 'transform rotate-2 shadow-lg' : ''
                              }`}
                            >
                              <TaskCard
                                task={task}
                                onClick={() => handleTaskClick(task)}
                                onUpdate={onTaskUpdated}
                                onDelete={onTaskDeleted}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Add Task Button */}
                      <button
                        onClick={() => onCreateTask(list.id)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Add task</span>
                      </button>
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {/* Add New List */}
          <div className="flex-shrink-0 w-80">
            <button className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors duration-200 flex items-center justify-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>Add list</span>
            </button>
          </div>
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          project={project}
          taskLists={taskLists}
          onClose={handleTaskModalClose}
          onUpdate={handleTaskUpdate}
          onDelete={onTaskDeleted}
        />
      )}
    </div>
  );
}

export default KanbanBoard;