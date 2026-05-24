import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NOTIFICATIONS_REFRESH_EVENT } from '../utils/notifications';

export function useNotifications(pollMs = 30000) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const prevUnreadRef = useRef(0);
  const initializedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getNotifications(50);
      if (!mountedRef.current) return;
      const nextUnread = data?.unreadCount ?? 0;
      setItems(data?.items || []);
      setUnreadCount(nextUnread);

      if (
        initializedRef.current &&
        nextUnread > prevUnreadRef.current &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const latest = (data?.items || []).find((n) => !n.read);
        if (latest) {
          new Notification(latest.title, { body: latest.body, tag: latest.notifId });
        }
      }
      prevUnreadRef.current = nextUnread;
      initializedRef.current = true;
    } catch (err) {
      console.warn('Notifications fetch failed:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    if (!user) return undefined;

    const onRefresh = () => refresh();
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);

    const tick = () => {
      const ms = document.hidden ? pollMs * 3 : pollMs;
      return ms;
    };
    let intervalId = setInterval(refresh, tick());

    const onVisibility = () => {
      clearInterval(intervalId);
      if (!document.hidden) refresh();
      intervalId = setInterval(refresh, tick());
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mountedRef.current = false;
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(intervalId);
    };
  }, [user, pollMs, refresh]);

  const markRead = useCallback(async (notifId) => {
    const data = await api.markNotificationRead(notifId);
    setItems(data?.items || []);
    const next = data?.unreadCount ?? 0;
    setUnreadCount(next);
    prevUnreadRef.current = next;
  }, []);

  const markAllRead = useCallback(async () => {
    const data = await api.markAllNotificationsRead();
    setItems(data?.items || []);
    setUnreadCount(0);
    prevUnreadRef.current = 0;
  }, []);

  return { items, unreadCount, loading, refresh, markRead, markAllRead };
}

export function formatNotifTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} giờ trước`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export function requestBrowserNotificationPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}
