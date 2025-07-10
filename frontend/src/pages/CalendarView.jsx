import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiClient from '../services/api';

const localizer = momentLocalizer(moment);

const CalendarView = ({ projectId }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    apiClient.get(`/tasks/`).then(res => {
      const calendarEvents = res.data.map(task => ({
        id: task.id,
        title: task.title,
        start: task.due_date ? new Date(task.due_date) : new Date(),
        end: task.due_date ? new Date(task.due_date) : new Date(),
        allDay: true,
      }));
      setEvents(calendarEvents);
    });
  }, [projectId]);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
    />
  );
};

export default CalendarView;
