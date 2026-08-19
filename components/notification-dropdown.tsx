'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, BellOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/actions/notifications';
import { toast } from 'sonner';
import { formatDate } from '@/utils/date';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getUserNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Check for updates every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      const res = await markNotificationRead(id);
      if (res.error) {
        toast.error(res.error);
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to mark notification as read');
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const res = await markAllNotificationsRead();
      if (res.success) {
        toast.success('All notifications marked as read');
      } else if (res.error) {
        toast.error(res.error);
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to mark all notifications as read');
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative animate-in fade-in" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-full hover:bg-secondary text-foreground/80 hover:text-foreground transition-all cursor-pointer focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive text-[9px] text-destructive-foreground font-extrabold flex items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-[380px] max-w-[calc(100vw-32px)] z-50 bg-popover text-popover-foreground border border-border shadow-2xl rounded-2xl overflow-hidden focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary hover:opacity-80 cursor-pointer transition-opacity"
                >
                  <Check className="h-3 w-3" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-border/20">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center px-6 gap-3">
                  <div className="p-3 bg-secondary/40 rounded-full text-muted-foreground/60">
                    <BellOff className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">All caught up!</p>
                    <p className="text-[11px] mt-0.5 text-muted-foreground">You have no new notifications.</p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                    className={`flex items-start gap-3 p-4 transition-colors cursor-pointer ${
                      n.read ? 'hover:bg-secondary/20' : 'bg-primary/5 hover:bg-primary/10'
                    }`}
                  >
                    {/* Unread indicator */}
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0 pulse-subtle" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${n.read ? 'font-medium text-foreground/80' : 'font-bold text-foreground'}`}>
                          {n.title}
                        </p>
                        {n.paperId && (
                          <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-secondary border border-border/40 text-muted-foreground rounded-md shrink-0">
                            {n.paperId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-muted-foreground/80 pt-0.5">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
