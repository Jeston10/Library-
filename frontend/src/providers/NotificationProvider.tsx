'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  show: (type: NotificationType, title: string, message: string, duration?: number) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const show = useCallback((type: NotificationType, title: string, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, title, message, duration };

    setNotifications((prev) => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((title: string, message: string) => show('success', title, message), [show]);
  const error = useCallback((title: string, message: string) => show('error', title, message), [show]);
  const warning = useCallback((title: string, message: string) => show('warning', title, message), [show]);
  const info = useCallback((title: string, message: string) => show('info', title, message), [show]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <NotificationPopup
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationPopupProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification, onRemove }) => {
  const bgColor = {
    success: 'bg-white border-l-4 border-green-500',
    error: 'bg-white border-l-4 border-red-500',
    warning: 'bg-white border-l-4 border-yellow-500',
    info: 'bg-white border-l-4 border-blue-500',
  }[notification.type];

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }[notification.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[notification.type];

  return (
    <div
      className={`${bgColor} rounded-lg shadow-lg p-4 text-neutral-900 flex gap-3 animate-in slide-in-from-right-5 fade-in-80 duration-300`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`${iconColor} h-5 w-5 flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{notification.title}</h3>
        <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
