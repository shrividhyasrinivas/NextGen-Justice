import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { X, Bell, Check, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}

export function NotificationsModal({ isOpen, onClose, notifications, onRefresh, onNavigate }: Props) {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    try {
      await api.notifications.markRead(notif._id);
      onRefresh();
      if (notif.link) {
        if (notif.link.includes('cases')) onNavigate('cases');
        else if (notif.link.includes('requests')) onNavigate('requests');
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight uppercase">System Notifications</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">{notifications.length} alerts recorded</span>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
            >
              <Check size={13} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  n.read ? 'hover:bg-slate-50' : 'bg-amber-50/40 hover:bg-amber-50/70 border-l-2 border-amber-500'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                {n.link && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                    <span>View associated matter</span>
                    <ExternalLink size={11} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
