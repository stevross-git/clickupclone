// components/CalendarView.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiClient from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const localizer = momentLocalizer(moment);

function CalendarView({ projectId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get(`/tasks/?project_id=${projectId}`);
      const calendarEvents = response.data
        .filter(task => task.due_date) // Only tasks with due dates
        .map(task => ({
          id: task.id,
          title: task.title,
          start: new Date(task.due_date),
          end: new Date(task.due_date),
          allDay: true,
          resource: task
        }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      addNotification('Error loading calendar events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event, start, end, isSelected) => {
    const task = event.resource;
    let backgroundColor = '#3174ad';
    
    // Color based on priority
    switch (task.priority) {
      case 'urgent':
        backgroundColor = '#dc2626';
        break;
      case 'high':
        backgroundColor = '#f97316';
        break;
      case 'medium':
        backgroundColor = '#3b82f6';
        break;
      case 'low':
        backgroundColor = '#10b981';
        break;
    }

    // Darken if overdue
    const now = new Date();
    if (new Date(task.due_date) < now && task.status !== 'done') {
      backgroundColor = '#7f1d1d';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: task.status === 'done' ? 0.6 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px'
      }
    };
  };

  const handleSelectEvent = (event) => {
    // Navigate to task detail or open task modal
    console.log('Selected task:', event.resource);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task Calendar</h2>
          <p className="text-sm text-gray-600">View tasks by due date</p>
        </div>
        
        <div className="p-4" style={{ height: 'calc(100% - 80px)' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            views={['month', 'week', 'day']}
            defaultView="month"
            popup
            tooltipAccessor={event => {
              const task = event.resource;
              return `${task.title} (${task.priority} priority)`;
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarView;