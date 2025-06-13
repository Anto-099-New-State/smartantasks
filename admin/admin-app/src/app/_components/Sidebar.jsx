// _components/Sidebar.js
import React from 'react';
import {   
  X,   
  Home,   
  Bell,   
  Calendar,   
  Users,   
  UserCheck,   
  User,  
  HelpCircle 
} from 'lucide-react'; 

const Sidebar = ({ isOpen, onClose, activeItem, onItemClick }) => {
  const sidebarItems = [
    { id: 'my-gyms', icon: Home, label: 'My Gyms' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'attendance', icon: Calendar, label: 'Attendance' },
  ];

  const teamItems = [
    { id: 'head-coaches', icon: Users, label: 'Head Coaches' },
    { id: 'trainers', icon: UserCheck, label: 'Trainers' },
    { id: 'users', icon: User, label: 'Users' },
    { id: 'support', icon: HelpCircle, label: 'Support' }
  ];

  const handleItemClick = (itemId) => {
    onItemClick(itemId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        <div className="flex items-center justify-between h-16 px-4 bg-black">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">⚡</span>
            </div>
            <span className="text-white font-semibold">Day of Organization</span>
          </div>
          <button             
            onClick={onClose}
            className="lg:hidden text-white hover:bg-emerald-400 p-1 rounded"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-green-900 text-md font-medium mb-4">WorkSpace</h2>
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  activeItem === item.id
                     ? 'bg-white text-emerald-600'
                     : 'text-green-950 hover:bg-emerald-300'
                }`}
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8">
            <h2 className="text-gray-700 text-md font-medium mb-4">Teams</h2>
            <nav className="space-y-2">
              {teamItems.map((item) => (
                <button                   
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    activeItem === item.id
                       ? 'bg-white text-emerald-600'
                       : 'text-green-950 hover:bg-emerald-300'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 text-white text-xs">
          2024 Appname v1
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div           
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;