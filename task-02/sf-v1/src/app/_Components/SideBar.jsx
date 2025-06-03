// Sidebar.jsx
import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  HardDrive,
  Menu,
  Layout,
  LogOut,
  ArrowLeftCircleIcon
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: Home },
    { id: 'Organization', label: 'Organization', icon: Users },
    { id: 'Hardware', label: 'Hardware', icon: HardDrive }
    ,{ id: 'Layouts', label: 'Layout', icon:  Layout}
  ];

  return (
    <div className={`h-full min-h-screen bg-slate-800 text-white flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      
      {/* Header with Toggle */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-semibold text-blue-400">Smartan Fittech</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ArrowLeftCircleIcon className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors group relative ${
                    activeTab === item.id 
                      ? 'bg-slate-700 border-r-2 border-blue-400' 
                      : 'hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-2 border-t border-slate-700">
        <button 
          className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-slate-700 transition-colors group relative"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
          
          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;