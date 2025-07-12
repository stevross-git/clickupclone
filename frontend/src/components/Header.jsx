// frontend/src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  PlusIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    // Debounced search
    if (searchQuery.trim()) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults(null);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      setIsSearching(true);
      const results = await apiService.search(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    setShowNotifications(false);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tasks, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults && (
              <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                {searchResults.tasks?.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                      Tasks
                    </div>
                    {searchResults.tasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/project/${task.project_id}?task=${task.id}`}
                        className="block px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                        onClick={() => setSearchQuery('')}
                      >
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-500 truncate">{task.description}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.projects?.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                      Projects
                    </div>
                    {searchResults.projects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/project/${project.id}`}
                        className="block px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                        onClick={() => setSearchQuery('')}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded mr-2"
                            style={{ backgroundColor: project.color }}
                          />
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{project.description}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.tasks?.length === 0 && 
                 searchResults.projects?.length === 0 && 
                 searchResults.comments?.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Quick create button */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <PlusIcon className="w-6 h-6" />
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } group flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        Create Task
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } group flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        Create Project
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } group flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        Create Workspace
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      <Link
                        to="/notifications"
                        className="text-sm text-purple-600 hover:text-purple-500"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                  
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } ${
                              notification.status === 'unread' ? 'bg-blue-50' : ''
                            } w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`
                                w-2 h-2 rounded-full mt-2 flex-shrink-0
                                ${notification.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'}
                              `} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        )}
                      </Menu.Item>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No notifications yet
                    </div>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block px-4 py-2 text-sm text-gray-700`}
                      >
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } w-full text-left px-4 py-2 text-sm text-gray-700`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;