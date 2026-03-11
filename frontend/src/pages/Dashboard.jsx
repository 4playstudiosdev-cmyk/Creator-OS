import { useState, useEffect } from 'react'
import { Users, CalendarCheck, TrendingUp, Link, Copy, CheckCheck, Zap, Clock, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [copied, setCopied] = useState(false)
  const [scheduledCount, setScheduledCount] = useState(0)
  const [pipelineValue, setPipelineValue] = useState(0)
  const [upcomingPosts, setUpcomingPosts] = useState([])
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  useEffect(() => {
    if (session) {
      fetchProfile()
      fetchStats()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile(data)
    } catch (e) {}
  }

  const fetchStats = async () => {
    try {
      const postsRes = await axios.get(
        "http://localhost:8000/api/posts/user/" + session.user.id,
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
      const posts = postsRes.data?.data || []
      setScheduledCount(posts.length)

      const now = new Date()
      const upcoming = posts
        .filter(p => new Date(p.scheduled_for) >= now)
        .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for))
        .slice(0, 3)
      setUpcomingPosts(upcoming)

      const dealsRes = await axios.get(
        "http://localhost:8000/api/deals/user/" + session.user.id,
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
      const deals = dealsRes.data || []
      const total = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
      setPipelineValue(total)
    } catch (e) {}
  }

  const publicUrl = profile?.username
    ? window.location.origin + "/u/" + profile.username
    : null

  const handleCopy = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats = [
    {
      label: 'Scheduled Posts',
      value: scheduledCount.toString(),
      icon: CalendarCheck,
      sub: 'Total drafts & scheduled',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      label: 'Pipeline Value',
      value: '$' + pipelineValue.toLocaleString(),
      icon: TrendingUp,
      sub: 'Active brand deals',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      label: 'Total Audience',
      value: '—',
      icon: Users,
      sub: 'Connect accounts to see',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    },
  ]

  const quickActions = [
    { label: 'Schedule a Post', icon: CalendarCheck, path: '/schedule', color: 'bg-blue-600' },
    { label: 'Generate Clips', icon: Zap, path: '/auto-clip', color: 'bg-violet-600' },
    { label: 'Write a Script', icon: ArrowRight, path: '/script-studio', color: 'bg-emerald-600' },
  ]

  const getPlatformStyle = (platforms) => {
    if (platforms?.includes('twitter')) return { label: 'Twitter', cls: 'bg-blue-100 text-blue-600' }
    if (platforms?.includes('linkedin')) return { label: 'LinkedIn', cls: 'bg-sky-100 text-sky-700' }
    if (platforms?.includes('youtube')) return { label: 'YouTube', cls: 'bg-red-100 text-red-600' }
    return { label: 'Post', cls: 'bg-gray-100 text-gray-600' }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'Creator'}! 🚀
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Here's a summary of your brand's performance today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className={`bg-white p-5 rounded-xl border ${stat.border} shadow-sm flex items-center justify-between`}>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs mt-1.5 text-gray-400">{stat.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <Icon size={22} className={stat.color} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Media Kit Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Link size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">Your Public Media Kit</p>
              {publicUrl ? (
                <p className="text-blue-200 text-xs mt-0.5">{publicUrl}</p>
              ) : (
                <p className="text-blue-200 text-xs mt-0.5">
                  No username set —{' '}
                  <button onClick={() => navigate('/settings')} className="underline hover:text-white">
                    Set it in Settings
                  </button>
                </p>
              )}
            </div>
          </div>
          {publicUrl && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              {copied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <Icon size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Upcoming Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Upcoming Content</h2>
          </div>
          <button
            onClick={() => navigate('/schedule')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All <ArrowRight size={12} />
          </button>
        </div>

        {upcomingPosts.length > 0 ? (
          <div className="space-y-2">
            {upcomingPosts.map((post, i) => {
              const platform = getPlatformStyle(post.platforms)
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${platform.cls}`}>
                    {platform.label}
                  </span>
                  <p className="text-sm text-gray-700 flex-1 truncate">{post.content}</p>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(post.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">No upcoming posts scheduled.</p>
            <button
              onClick={() => navigate('/schedule')}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create New Post
            </button>
          </div>
        )}
      </div>

    </div>
  )
}