import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  LayoutDashboard, CalendarDays, FileText, Settings,
  LogOut, Briefcase, Youtube, Linkedin, Instagram,
  Scissors, Video, Wand2, DollarSign, BookOpen,
  BarChart2, MessageSquare, Repeat2
} from 'lucide-react'

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navSections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard',   path: '/dashboard',      icon: LayoutDashboard },
        { name: 'Scheduler',   path: '/schedule',       icon: CalendarDays    },
        { name: 'Analytics',   path: '/analytics',      icon: BarChart2       },
        { name: 'Inbox',       path: '/inbox',          icon: MessageSquare   },
      ]
    },
    {
      title: 'Platforms',
      items: [
        { name: 'YouTube Studio', path: '/youtube-studio', icon: Youtube,   color: '#FF0000' },
        { name: 'LinkedIn',       path: '/linkedin',        icon: Linkedin,  color: '#0A66C2' },
        { name: 'Instagram',      path: '/instagram',       icon: Instagram, color: '#E1306C' },
      ]
    },
    {
      title: 'Creator Tools',
      items: [
        { name: 'Auto Clipping',   path: '/auto-clip',      icon: Scissors      },
        { name: 'Video Editor',    path: '/video-editor',   icon: Video         },
        { name: 'Script Studio',   path: '/script-studio',  icon: BookOpen      },
        { name: 'AI Tools',        path: '/ai-tools',       icon: Wand2         },
        { name: 'Repurpose',       path: '/repurpose',      icon: Repeat2       },
      ]
    },
    {
      title: 'Business',
      items: [
        { name: 'Brand Deals',  path: '/deals',    icon: Briefcase   },
        { name: 'Media Kit',    path: '/mediakit', icon: FileText    },
        { name: 'Earnings',     path: '/earnings', icon: DollarSign  },
      ]
    },
    {
      title: 'Account',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ]

  return (
    <div style={{
      width: 230,
      background: '#070D0A',
      borderRight: '1px solid rgba(0,229,160,0.08)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(0,229,160,0.06)' }}>
          <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, fontSize: 18, color: '#fff', margin: 0 }}>
            Nexora <span style={{ color: '#00E5A0' }}>OS</span>
          </h1>
        </div>

        {/* Nav sections */}
        <nav style={{ padding: '12px 10px' }}>
          {navSections.map((section) => (
            <div key={section.title} style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#2D4A3E', textTransform: 'uppercase', letterSpacing: '.1em', padding: '0 10px', marginBottom: 4 }}>
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 9,
                      marginBottom: 2,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 400,
                      fontFamily: "'Instrument Sans',system-ui,sans-serif",
                      background: isActive ? 'rgba(0,229,160,0.08)' : 'transparent',
                      color: isActive ? '#00E5A0' : '#6B8F7E',
                      transition: 'all .15s',
                      borderLeft: isActive ? '2px solid #00E5A0' : '2px solid transparent',
                    })}
                  >
                    <Icon
                      size={16}
                      color={item.color || 'currentColor'}
                      style={{ flexShrink: 0 }}
                    />
                    {item.name}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Sign out */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(0,229,160,0.06)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', width: '100%', textAlign: 'left',
            background: 'none', border: 'none', borderRadius: 9,
            color: '#6B8F7E', cursor: 'pointer', fontSize: 13,
            fontFamily: "'Instrument Sans',system-ui,sans-serif",
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#F87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B8F7E' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}