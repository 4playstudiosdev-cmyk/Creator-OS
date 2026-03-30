import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Sparkles, Brain, Inbox,
  BarChart2, Briefcase, FileText, TrendingUp, CreditCard,
  Settings, LogOut, DollarSign, FileVideo, Youtube,
  Scissors, Film,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { name: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard },
  { name: 'Scheduler',      path: '/schedule',        icon: CalendarDays },
  { name: 'Repurpose',      path: '/repurpose',       icon: Sparkles },
  { name: 'Script Studio',  path: '/script-studio',   icon: FileVideo },
  { name: 'YouTube Studio', path: '/youtube-studio',  icon: Youtube },
  { name: 'AI Tools',       path: '/ai-tools',        icon: Brain },
  { name: 'Inbox',          path: '/inbox',           icon: Inbox },
  { name: 'Analytics',      path: '/analytics',       icon: BarChart2 },
  { name: 'Brand Deals',    path: '/deals',           icon: Briefcase },
  { name: 'Video Editor',   path: '/video-editor',    icon: Film },
  { name: 'Auto Clipping',  path: '/auto-clip',       icon: Scissors },
  { name: 'Earnings',       path: '/earnings',        icon: DollarSign },
  { name: 'Media Kit',      path: '/mediakit',        icon: FileText },
  { name: 'Funding',        path: '/funding',         icon: TrendingUp },
  { name: 'Pricing',        path: '/pricing',         icon: CreditCard },
  { name: 'Settings',       path: '/settings',        icon: Settings },
]

function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: #6b7280;
          text-decoration: none;
          transition: all 0.18s;
          cursor: pointer;
        }
        .sidebar-link:hover {
          background: rgba(255,255,255,0.05);
          color: #e5e7eb;
        }
        .sidebar-link.active {
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
          border: 1px solid rgba(99,102,241,0.25);
        }
        .sidebar-link.active svg {
          color: #818cf8;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: #6b7280;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: all 0.18s;
          text-align: left;
        }
        .logout-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #f87171;
        }

        /* Scrollbar for sidebar */
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        /* Scrollbar for main */
        .main-scroll::-webkit-scrollbar { width: 6px; }
        .main-scroll::-webkit-scrollbar-track { background: transparent; }
        .main-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 6px; }
      `}</style>

      <div style={{
        width: 220,
        flexShrink: 0,
        background: '#0d0d14',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}>⚡</div>
            <span style={{
              fontFamily: 'Syne', fontWeight: 800, fontSize: 16,
              color: '#f0f0f5', letterSpacing: '-0.3px',
            }}>
              Creator <span style={{ color: '#818cf8' }}>OS</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                style={{ marginBottom: 2 }}
              >
                <Icon size={16} />
                {item.name}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

export default function Layout() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0a0a0f',
      overflow: 'hidden',
      fontFamily: "'Syne', 'DM Sans', sans-serif",
    }}>
      <Sidebar />
      <main className="main-scroll" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '36px 40px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
