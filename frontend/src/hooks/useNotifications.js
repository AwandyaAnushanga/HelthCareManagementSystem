import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

const useNotifications = (pollInterval = 30000) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationService.getNotifications({ limit: 10 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollInterval]);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    fetchNotifications();
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, refresh: fetchNotifications };
};

export default useNotifications;
