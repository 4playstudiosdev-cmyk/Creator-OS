import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Building2, BarChart2, CreditCard, Settings, Users, CalendarDays, LayoutDashboard } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import AgencyPage from '../pages/AgencyPage'
import SettingsPage from '../pages/SettingsPage'
import PricingPage from '../pages/PricingPage'

export default function AgencyLayout() {
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    { name: 'Overview', tab: 'overview', icon: LayoutDashboard },
    { name: 'Creators', tab: 'creators', icon: Users },
    { name: 'Analytics', tab: 'analytics', icon: BarChart2 },
    { name: 'Schedule', tab: 'schedule', icon: CalendarDays },
    { name: 'Pricing', tab: 'pricing', icon: CreditCard },
    { name: 'Settings', tab: 'settings', icon: Settings },
  ]

  const renderContent = () => {
    if (activeTab === 'pricing') return <PricingPage />
    if (activeTab === 'settings') return <SettingsPage />
    return <AgencyPage activeTab={activeTab} setActiveTab={setActiveTab} />
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Building2 size={20} className="text-purple-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Creator <span className="text-purple-500">Agency</span></h1>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.tab
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.tab)}
                  className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left " + (isActive ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}
                >
                  <Icon size={20} />
                  {item.name}
                </button>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
