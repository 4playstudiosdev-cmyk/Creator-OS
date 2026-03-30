import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, FileText, Settings, LogOut, Briefcase } from 'lucide-react'

// Preview environment mein error ko theek karne ke liye mock object
// Locally run karte waqt wapis "import { supabase } from '../lib/supabaseClient'" use karein
const supabase = { 
  auth: { 
    signOut: async () => { 
      console.log("Sign out ho gaya") 
    } 
  } 
}

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Scheduler', path: '/schedule', icon: CalendarDays },
    { name: 'Brand Deals', path: '/deals', icon: Briefcase },
    { name: 'Media Kit', path: '/mediakit', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col justify-between">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Creator <span className="text-creator-500">OS</span></h1>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-creator-50 text-creator-500 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={20} />
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
