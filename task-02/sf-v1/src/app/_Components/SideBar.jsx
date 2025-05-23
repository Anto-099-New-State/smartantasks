import React from 'react';
import { 
  Home, 
  Users, 
  Settings, 
  FileText, 
  Moon, 
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: Home },
    { id: 'Organization', label: 'Organization', icon: Users },
    { id: 'Settings', label: 'Settings', icon: Settings },
    { id: 'Pages', label: 'Pages', icon: FileText }
  ];

  return (
    <div className="h-full min-h-screen w-64 bg-slate-800 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>
      
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button 
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id ? 'bg-slate-700' : 'hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <button className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
          <Moon className="w-5 h-5 mr-3" />
          Light Mode
        </button>
        <button className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors mt-2">
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;