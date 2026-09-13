import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../api/audit';
import type { Notification } from '../../types';
import {
  Bell,
  Search,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await auditApi.getNotifications(10);
      setNotifications(data);
      const countData = await auditApi.getUnreadCount();
      setUnreadCount(countData.unread_count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string, refType?: string, refId?: string) => {
    try {
      await auditApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (refType === 'CLAIM' && refId) {
        navigate(`/claims/${refId}`);
        setShowNotifs(false);
      } else if (refType === 'INVESTIGATION' && refId) {
        navigate(`/investigations/${refId}`);
        setShowNotifs(false);
      } else if (refType === 'REPORT') {
        navigate('/reports');
        setShowNotifs(false);
      }
    } catch {
      // ignore
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case 'REPORT':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'RULE_CHANGE':
        return <Sliders className="h-4 w-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex items-center w-80">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search claims, members, providers..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (val) navigate(`/claims?search=${encodeURIComponent(val)}`);
              }
            }}
            className="w-full rounded-lg border border-slate-750 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-84 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
                <span className="text-xs font-bold text-slate-200">Alerts & Notifications</span>
                <span className="text-[11px] text-blue-400 font-semibold">{unreadCount} Unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No new alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkRead(n.id, n.reference_type, n.reference_id)}
                      className={`p-3 flex items-start gap-3 text-xs transition-colors cursor-pointer hover:bg-slate-800/60 ${
                        !n.is_read ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="mt-0.5">{getNotifIcon(n.notification_type)}</div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(n.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Profile Badge */}
        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm border border-blue-400/20">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              {user?.first_name} {user?.last_name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-slate-800 text-blue-400 border border-blue-500/20 uppercase">
                {user?.role}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.department}</span>
            </div>
          </div>
        </div>

        {/* Logout CTA */}
        <button
          onClick={logout}
          className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
