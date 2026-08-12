import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, CheckCircle2, MessageSquare, Briefcase, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    import('../services/dbService').then(({ getNotifications, subscribeToNotifications }) => {
      if (!isMounted) return;
      getNotifications(user.id).then(fetched => {
        if (isMounted) setNotifications(fetched || []);
      }).catch(err => console.error("Error fetching notifications:", err));

      subscriptionRef.current = subscribeToNotifications(user.id, (newNotif) => {
        if (isMounted) setNotifications(prev => [newNotif, ...prev]);
      });
    });

    return () => {
      isMounted = false;
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, [user?.id]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const { markNotificationRead } = await import('../services/dbService');
      await markNotificationRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    try {
      const { markNotificationRead } = await import('../services/dbService');
      await Promise.all(unreadIds.map(id => markNotificationRead(id)));
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in" dir="rtl">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span>الإشعارات</span>
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-3">
                <BellOff className="w-8 h-8 opacity-50" />
                <span className="text-sm">لا توجد إشعارات حالياً</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  className={`p-4 border-b border-white/5 flex gap-3 cursor-pointer transition-colors ${
                    notif.read ? 'opacity-70 hover:bg-white/5' : 'bg-blue-500/5 hover:bg-blue-500/10'
                  }`}
                >
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    notif.title?.includes('رسالة') ? 'bg-blue-500/20 text-blue-400' :
                    notif.title?.includes('قبول') || notif.title?.includes('مبروك') ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {notif.title?.includes('رسالة') ? <MessageSquare className="w-4 h-4" /> :
                     notif.title?.includes('قبول') ? <CheckCircle2 className="w-4 h-4" /> :
                     <Sparkles className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`text-sm mb-1 ${notif.read ? 'text-slate-300' : 'text-white font-bold'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{notif.message}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(notif.created_at).toLocaleDateString('ar-DZ')} {new Date(notif.created_at).toLocaleTimeString('ar-DZ', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
