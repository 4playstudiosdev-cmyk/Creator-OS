import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Brain,
  Inbox,
  BarChart2,
  Briefcase,
  FileText,
  TrendingUp,
  CreditCard,
  Settings,
  LogOut,
  DollarSign,
  FileVideo,
  Youtube,
  Scissors,
  Film,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { name: 'Dashboard',     path: '/dashboard',     icon: LayoutDashboard },
  { name: 'Scheduler',     path: '/schedule',      icon: CalendarDays },
  { name: 'Repurpose',     path: '/repurpose',     icon: Sparkles },
  { name: 'Script Studio', path: '/script-studio', icon: FileVideo },
  { name: 'YouTube Studio',path: '/youtube-studio',icon: Youtube },
  { name: 'AI Tools',      path: '/ai-tools',      icon: Brain },
  { name: 'Inbox',         path: '/inbox',         icon: Inbox },
  { name: 'Analytics',     path: '/analytics',     icon: BarChart2 },
  { name: 'Brand Deals',   path: '/deals',         icon: Briefcase },
  { name: 'Video Editor',  path: '/video-editor',  icon: Film },
  { name: 'Auto Clipping', path: '/auto-clip',     icon: Scissors },
  { name: 'Earnings',      path: '/earnings',      icon: DollarSign },
  { name: 'Media Kit',     path: '/mediakit',      icon: FileText },
  { name: 'Funding',       path: '/funding',       icon: TrendingUp },
  { name: 'Pricing',       path: '/pricing',       icon: CreditCard },
  { name: 'Settings',      path: '/settings',      icon: Settings },
]

function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')   // ✅ fixed — was '/' which showed landing page
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">
          Creator <span className="text-blue-500">OS</span>
        </h1>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}