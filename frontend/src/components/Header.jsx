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
    <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-purple to-brand-pink px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        {/* Left side */}

        {/* Search Bar */}
        <div className="max-w-lg flex-1">
          <form onSubmit={handleSearch} className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <label htmlFor="header-search" className="sr-only">
              Search
            </label>
            <input
              id="header-search"
              name="search"
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects..."
              className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </form>
        </div>

        {/* Right side - Notifications and User Menu */}

        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="relative max-w-lg flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tasks, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-purple-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:text-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults && (
              <div className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {searchResults.tasks?.length > 0 && (
                  <div>
                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                      Tasks
                    </div>
                    {searchResults.tasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/project/${task.project_id}?task=${task.id}`}
                        className="block border-b border-gray-100 px-4 py-2 hover:bg-gray-50"
                        onClick={() => setSearchQuery('')}
                      >
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="truncate text-xs text-gray-500">{task.description}</div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.projects?.length > 0 && (
                  <div>
                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                      Projects
                    </div>
                    {searchResults.projects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/project/${project.id}`}
                        className="block border-b border-gray-100 px-4 py-2 hover:bg-gray-50"
                        onClick={() => setSearchQuery('')}
                      >
                        <div className="flex items-center">
                          <div
                            className="mr-2 h-3 w-3 rounded"
                            style={{ backgroundColor: project.color }}
                          />
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        </div>
                        <div className="truncate text-xs text-gray-500">{project.description}</div>
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
            <Menu.Button className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
              <PlusIcon className="h-6 w-6" />
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-gray-700`}
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
                        } group flex w-full items-center px-4 py-2 text-sm text-gray-700`}
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
                        } group flex w-full items-center px-4 py-2 text-sm text-gray-700`}
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
            <Menu.Button className="relative rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
              <Menu.Items className="absolute right-0 z-50 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="max-h-96 overflow-y-auto py-1">
                  <div className="border-b border-gray-200 px-4 py-3">
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
                            className={`${active ? 'bg-gray-50' : ''} ${
                              notification.status === 'unread' ? 'bg-blue-50' : ''
                            } w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`
                                mt-2 h-2 w-2 flex-shrink-0 rounded-full
                                ${notification.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'}
                              `}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        )}
                      </Menu.Item>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">No notifications yet</div>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
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
              <Menu.Items className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="border-b border-gray-200 px-4 py-3">
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
                        } w-full px-4 py-2 text-left text-sm text-gray-700`}
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
