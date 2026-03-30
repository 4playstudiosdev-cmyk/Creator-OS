import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const PLATFORM_COLORS = {
  YouTube: 'bg-red-100 text-red-600',
  Twitter: 'bg-blue-100 text-blue-600',
  LinkedIn: 'bg-blue-100 text-blue-800',
  Instagram: 'bg-pink-100 text-pink-600',
  Multiple: 'bg-gray-100 text-gray-600',
}

const REVENUE_DATA = [
  { month: 'Oct', revenue: 1200 },
  { month: 'Nov', revenue: 2100 },
  { month: 'Dec', revenue: 1800 },
  { month: 'Jan', revenue: 3200 },
  { month: 'Feb', revenue: 2800 },
  { month: 'Mar', revenue: 4200 },
]

export default function AgencyPage({ activeTab: propTab, setActiveTab: setPropTab }) {
  const [localTab, setLocalTab] = useState('overview')
  const activeTab = propTab || localTab
  const setActiveTab = setPropTab || setLocalTab

  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [invitePlatform, setInvitePlatform] = useState('Multiple')
  const [inviteRevenue, setInviteRevenue] = useState('')
  const [inviteFollowers, setInviteFollowers] = useState('')
  const [inviting, setInviting] = useState(false)

  // Schedule form
  const [scheduleContent, setScheduleContent] = useState('')
  const [schedulePlatform, setSchedulePlatform] = useState('Twitter')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [agencyPosts, setAgencyPosts] = useState([])
  const [postFilter, setPostFilter] = useState('all')

  useEffect(() => {
    fetchCreators()
    fetchAgencyPosts()
  }, [])

  const fetchCreators = async () => {
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const { data, error } = await supabase
      .from('agency_creators')
      .select('*')
      .eq('agency_id', sessionData.session.user.id)
      .order('invited_at', { ascending: false })
    if (!error) setCreators(data || [])
    setLoading(false)
  }

  const fetchAgencyPosts = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('scheduled_by', 'agency')
      .eq('user_id', sessionData.session.user.id)
      .order('scheduled_for', { ascending: true })
    if (!error) setAgencyPosts(data || [])
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const { error } = await supabase
        .from('agency_creators')
        .insert({
          agency_id: sessionData.session.user.id,
          creator_email: inviteEmail,
          creator_name: inviteName || inviteEmail.split('@')[0],
          status: 'invited',
          platform: invitePlatform,
          monthly_revenue: parseFloat(inviteRevenue) || 0,
          followers_count: parseInt(inviteFollowers) || 0,
        })
      if (error) throw error
      await fetchCreators()
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRevenue('')
      setInviteFollowers('')
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setInviting(false)
    }
  }

  const handleSchedulePost = async () => {
    if (!scheduleContent.trim() || !selectedCreator) return
    setScheduling(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: sessionData.session.user.id,
          content: scheduleContent,
          platforms: [schedulePlatform],
          scheduled_for: scheduleDate || new Date().toISOString(),
          status: 'scheduled',
          creator_email: selectedCreator.creator_email,
          scheduled_by: 'agency'
        })
      if (error) throw error
      await fetchAgencyPosts()
      setScheduleContent('')
      setScheduleDate('')
      alert("Post scheduled! ✅")
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setScheduling(false)
    }
  }

  const handleRemoveCreator = async (id) => {
    if (!window.confirm("Is creator ko remove karein?")) return
    const { error } = await supabase
      .from('agency_creators')
      .delete()
      .eq('id', id)
    if (!error) {
      setCreators(prev => prev.filter(c => c.id !== id))
      if (selectedCreator?.id === id) setSelectedCreator(null)
    }
  }

  const handleMarkActive = async (id) => {
    const { error } = await supabase
      .from('agency_creators')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) fetchCreators()
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const filteredCreators = creators.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter
    const matchesSearch =
      c.creator_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.creator_email?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalRevenue = creators.reduce((s, c) => s + (c.monthly_revenue || 0), 0)
  const totalFollowers = creators.reduce((s, c) => s + (c.followers_count || 0), 0)
  const totalDeals = creators.reduce((s, c) => s + (c.brand_deals || 0), 0)
  const activeCreators = creators.filter(c => c.status === 'active').length

  const creatorChartData = creators.map(c => ({
    name: c.creator_name?.split(' ')[0] || 'Unknown',
    revenue: c.monthly_revenue || 0,
    followers: c.followers_count || 0
  }))

  const filteredPosts = postFilter === 'all'
    ? agencyPosts
    : agencyPosts.filter(p => p.creator_email === postFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard 🏢</h1>
          <p className="text-gray-500 mt-1">Apne saare creators ek jagah se manage karein</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-md"
        >
          + Invite Creator
        </button>
      </header>

      {/* ===== TAB: OVERVIEW ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Creators</p>
              <p className="text-2xl font-bold text-gray-900">{creators.length}</p>
              <p className="text-xs text-green-500 mt-1">{activeCreators} active</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Combined Audience</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(totalFollowers)}</p>
              <p className="text-xs text-gray-400 mt-1">Across all creators</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{totalDeals} active deals</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Pending Invites</p>
              <p className="text-2xl font-bold text-orange-500">{creators.filter(c => c.status === 'invited').length}</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting response</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">📈 Agency Revenue Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => '$' + v} />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {creatorChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">💰 Revenue Per Creator</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={creatorChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => '$' + v} />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: CREATORS ===== */}
      {activeTab === 'creators' && (
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Creator search karein..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
              />
              <div className="flex gap-1">
                {['all', 'active', 'invited'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={"px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all " + (filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : filteredCreators.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-500 font-medium mb-1">Koi creator nahi</p>
                <p className="text-gray-400 text-sm">Invite Creator button se creators add karein</p>
              </div>
            ) : (
              filteredCreators.map(creator => (
                <div
                  key={creator.id}
                  onClick={() => setSelectedCreator(creator)}
                  className={"bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md " + (selectedCreator?.id === creator.id ? 'border-purple-500 shadow-md' : 'border-gray-100')}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl font-bold text-purple-600">
                        {creator.creator_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className={"absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white " + (creator.status === 'active' ? 'bg-green-500' : 'bg-yellow-400')}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{creator.creator_name}</h3>
                        <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (creator.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                          {creator.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{creator.creator_email}</p>
                      <span className={"text-xs px-2 py-0.5 rounded mt-1 inline-block " + (PLATFORM_COLORS[creator.platform] || 'bg-gray-100 text-gray-600')}>
                        {creator.platform}
                      </span>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-center">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{formatNumber(creator.followers_count)}</p>
                        <p className="text-xs text-gray-400">Followers</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-600">${(creator.monthly_revenue || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Revenue</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {creator.status === 'invited' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkActive(creator.id) }}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Mark Active
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveCreator(creator.id) }}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Creator Detail Panel */}
          {selectedCreator && (
            <div className="w-72 flex-shrink-0 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 mx-auto mb-2">
                    {selectedCreator.creator_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <h3 className="font-bold text-gray-900">{selectedCreator.creator_name}</h3>
                  <p className="text-sm text-gray-400">{selectedCreator.creator_email}</p>
                  <span className={"mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium " + (selectedCreator.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                    {selectedCreator.status}
                  </span>
                </div>
                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">👥 Followers</span>
                    <span className="font-semibold text-gray-800">{formatNumber(selectedCreator.followers_count)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">💰 Revenue</span>
                    <span className="font-semibold text-green-600">${(selectedCreator.monthly_revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">📱 Platform</span>
                    <span className="font-semibold text-gray-800">{selectedCreator.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">📅 Invited</span>
                    <span className="font-semibold text-gray-800">{new Date(selectedCreator.invited_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    📅 Schedule Post
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    📊 View Analytics
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: ANALYTICS ===== */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {creators.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
              <div className="text-4xl mb-3">📈</div>
              <p className="text-gray-400">Pehle creators add karein</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creators.map(creator => (
                  <div key={creator.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                        {creator.creator_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{creator.creator_name}</h4>
                        <p className="text-xs text-gray-400">{creator.platform}</p>
                      </div>
                      <span className={"ml-auto text-xs px-2 py-1 rounded-full font-medium " + (creator.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                        {creator.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-gray-900">{formatNumber(creator.followers_count)}</p>
                        <p className="text-xs text-gray-400">Followers</p>
                      </div>
                      <div className="text-center bg-green-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-green-600">${(creator.monthly_revenue || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Revenue</p>
                      </div>
                      <div className="text-center bg-blue-50 rounded-lg p-2">
                        <p className="text-lg font-bold text-blue-600">{creator.scheduled_posts || 0}</p>
                        <p className="text-xs text-gray-400">Posts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">👥 Followers Per Creator</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={creatorChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="followers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== TAB: SCHEDULE ===== */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Schedule Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">📅 Creator ke liye Post Schedule Karein</h2>
            <p className="text-gray-400 text-sm mb-5">Kisi bhi creator ka post agency se directly schedule karein</p>

            {creators.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-gray-400">Pehle creators add karein</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creator Chunein</label>
                  <select
                    value={selectedCreator?.id || ''}
                    onChange={(e) => setSelectedCreator(creators.find(c => c.id === e.target.value) || null)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="">-- Creator chunein --</option>
                    {creators.map(c => (
                      <option key={c.id} value={c.id}>{c.creator_name} ({c.creator_email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <div className="flex gap-2">
                    {['Twitter', 'LinkedIn', 'Instagram', 'YouTube'].map(p => (
                      <button
                        key={p}
                        onClick={() => setSchedulePlatform(p)}
                        className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-all " + (schedulePlatform === p ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200')}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post Content</label>
                  <textarea
                    value={scheduleContent}
                    onChange={(e) => setScheduleContent(e.target.value)}
                    placeholder="Post ka content likhein..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <button
                  onClick={handleSchedulePost}
                  disabled={scheduling || !scheduleContent.trim() || !selectedCreator}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {scheduling ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Scheduling...
                    </div>
                  ) : '📅 Schedule Post'}
                </button>
              </div>
            )}
          </div>

          {/* Scheduled Posts Calendar View */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">🗓️ Creators ki Scheduled Posts</h2>
              <button
                onClick={fetchAgencyPosts}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                🔄 Refresh
              </button>
            </div>

            {/* Filter by Creator */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setPostFilter('all')}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (postFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                All Creators
              </button>
              {creators.map(c => (
                <button
                  key={c.id}
                  onClick={() => setPostFilter(c.creator_email)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (postFilter === c.creator_email ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                >
                  {c.creator_name}
                </button>
              ))}
            </div>

            {/* Posts List */}
            {filteredPosts.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-gray-400 text-sm">Koi scheduled post nahi — upar se schedule karein!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map(post => (
                  <div key={post.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 text-center bg-purple-100 rounded-xl px-3 py-2 min-w-[60px]">
                      <p className="text-xs font-bold text-purple-600">
                        {new Date(post.scheduled_for).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-purple-800">
                        {new Date(post.scheduled_for).getDate()}
                      </p>
                      <p className="text-xs text-purple-500">
                        {new Date(post.scheduled_for).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {post.creator_email && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
                            {creators.find(c => c.creator_email === post.creator_email)?.creator_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs font-medium text-purple-700">
                            {creators.find(c => c.creator_email === post.creator_email)?.creator_name || post.creator_email}
                          </span>
                          <span className="text-xs text-gray-400">• Scheduled by Agency</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-800 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {post.platforms?.map(p => (
                          <span key={p} className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                        <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (post.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== INVITE MODAL ===== */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-5">✉️ Creator Invite Karein</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creator Email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="creator@email.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creator Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Creator ka naam"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Platform</label>
                <select
                  value={invitePlatform}
                  onChange={(e) => setInvitePlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                >
                  {['Multiple', 'YouTube', 'Instagram', 'Twitter', 'LinkedIn'].map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue ($)</label>
                  <input
                    type="number"
                    value={inviteRevenue}
                    onChange={(e) => setInviteRevenue(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                  <input
                    type="number"
                    value={inviteFollowers}
                    onChange={(e) => setInviteFollowers(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {inviting ? 'Inviting...' : '✉️ Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
