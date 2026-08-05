import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, DollarSign, Briefcase, Star, Megaphone } from 'lucide-react';
import { mockNotifications } from '../data/mockData';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications || []);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOpen = () => setIsOpen(!isOpen);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'deal': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'review': return <Star className="w-5 h-5 text-amber-400" />;
      case 'campaign': return <Megaphone className="w-5 h-5 text-purple-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      <button 
        onClick={toggleOpen}
        className="p-2 rounded-full hover:bg-white/10 transition-colors relative focus:outline-none"
      >
        <Bell className="w-6 h-6 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 glass-card w-80 max-h-96 flex flex-col overflow-hidden animate-fade-in-up z-50">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-white font-semibold">الإشعارات</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-white/10 text-slate-300 px-2 py-1 rounded-full">
                {unreadCount} جديد
              </span>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
                <BellOff className="w-10 h-10 opacity-50" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`flex gap-3 p-4 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-emerald-500/5 border-r-2 border-r-emerald-500' : ''
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div>
                      <p className={`text-sm ${!notification.isRead ? 'text-white font-medium' : 'text-slate-300'}`}>
                        {notification.message}
                      </p>
                      <span className="text-xs text-slate-500 mt-1 block">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
