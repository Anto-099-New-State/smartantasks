import React, { useState } from 'react';
import { Menu, Bell, Search } from 'lucide-react';

const Header = ({ 
  onMenuClick, 
  user = { name: 'David Billy', email: 'davidbilly@gmail.com' },
  notificationCount = 3,
  onSearch,
  onNotificationClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Optional: Real-time search
    if (onSearch && e.target.value.length > 2) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-500">powered by</p>
            <p className="font-semibold text-blue-600">Smartan Fittech</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          
          {/* Notifications */}
          <button 
            onClick={onNotificationClick}
            className="relative p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <Bell size={24} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
          
          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;