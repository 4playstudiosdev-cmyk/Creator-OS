import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Sparkles, Brain,
  Inbox, BarChart2, Briefcase, FileText, TrendingUp,
  CreditCard, Settings, LogOut, DollarSign, FileVideo,
  Youtube, Scissors, Film, Instagram, Linkedin,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { name: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard },
  { name: 'Scheduler',      path: '/schedule',       icon: CalendarDays    },
  { name: 'Repurpose',      path: '/repurpose',      icon: Sparkles        },
  { name: 'Script Studio',  path: '/script-studio',  icon: FileVideo       },
  { name: 'YouTube Studio', path: '/youtube-studio', icon: Youtube, color: '#FF0000' },
  { name: 'LinkedIn',       path: '/linkedin',       icon: Linkedin, color: '#0A66C2' },
  { name: 'Instagram',      path: '/instagram',      icon: Instagram, color: '#E1306C' },
  { name: 'TikTok',         path: '/tiktok',         icon: Music,     color: '#FE2C55' },
  { name: 'AI Tools',       path: '/ai-tools',       icon: Brain           },
  { name: 'Inbox',          path: '/inbox',          icon: Inbox           },
  { name: 'Analytics',      path: '/analytics',      icon: BarChart2       },
  { name: 'Brand Deals',    path: '/deals',          icon: Briefcase       },
  { name: 'Video Editor',   path: '/video-editor',   icon: Film            },
  { name: 'Auto Clipping',  path: '/auto-clip',      icon: Scissors        },
  { name: 'Earnings',       path: '/earnings',       icon: DollarSign      },
  { name: 'Media Kit',      path: '/mediakit',       icon: FileText        },
  { name: 'Funding',        path: '/funding',        icon: TrendingUp      },
  { name: 'Pricing',        path: '/pricing',        icon: CreditCard      },
  { name: 'Settings',       path: '/settings',       icon: Settings        },
]

function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="sidebar">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@800;900&display=swap');
        .sidebar {
          width: 240px;
          background: #0A1510;
          border-right: 1px solid rgba(0,229,160,0.08);
          height: 100vh;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sidebar-logo {
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 18px;
          border-bottom: 1px solid rgba(0,229,160,0.08);
          flex-shrink: 0;
          gap: 10px;
        }
        .sidebar-logo-img {
          width: 32px; height: 32px; border-radius: 8px;
          object-fit: contain;
          box-shadow: 0 2px 10px rgba(0,229,160,0.25);
        }
        .sidebar-logo-fallback {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #00E5A0, #00B87A);
          display: none; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .sidebar-logo-text {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: 17px; font-weight: 900;
          color: #fff; letter-spacing: -0.02em;
        }
        .sidebar-logo-text span { color: #00E5A0; }
        .sidebar-nav {
          flex: 1; overflow-y: auto; padding: 10px 8px;
        }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(0,229,160,0.15); border-radius: 2px; }
        .sidebar-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          color: #4A6357; text-decoration: none;
          transition: background 0.15s, color 0.15s;
          margin-bottom: 1px;
        }
        .sidebar-nav-item:hover {
          background: rgba(0,229,160,0.06);
          color: #9DC4B0;
        }
        .sidebar-nav-item.active {
          background: rgba(0,229,160,0.1);
          color: #00E5A0;
        }
        .sidebar-footer {
          padding: 10px 8px;
          border-top: 1px solid rgba(0,229,160,0.08);
          flex-shrink: 0;
        }
        .sidebar-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px;
          width: 100%; text-align: left; cursor: pointer;
          background: none; border: none;
          font-size: 13px; font-weight: 500; color: #4A6357;
          transition: background 0.15s, color 0.15s;
          font-family: inherit;
        }
        .sidebar-logout:hover {
          background: rgba(248,113,113,0.08);
          color: #F87171;
        }
      `}</style>

      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src="/logo.png"
          alt="Nexora OS"
          className="sidebar-logo-img"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'flex'
          }}
        />
        <div className="sidebar-logo-fallback">⚡</div>
        <div className="sidebar-logo-text">
          Nexora <span>OS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={16} color={item.color || 'currentColor'} />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070D0A', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}