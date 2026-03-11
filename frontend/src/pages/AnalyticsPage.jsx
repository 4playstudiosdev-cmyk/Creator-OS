import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import axios from 'axios'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

// Mock Analytics Data
const AUDIENCE_GROWTH = [
  { month: 'Oct', twitter: 1200, youtube: 800, linkedin: 400, instagram: 600 },
  { month: 'Nov', twitter: 1800, youtube: 1100, linkedin: 550, instagram: 900 },
  { month: 'Dec', twitter: 2400, youtube: 1600, linkedin: 700, instagram: 1400 },
  { month: 'Jan', twitter: 3100, youtube: 2200, linkedin: 950, instagram: 2000 },
  { month: 'Feb', twitter: 4200, youtube: 3100, linkedin: 1200, instagram: 2800 },
  { month: 'Mar', twitter: 5800, youtube: 4200, linkedin: 1600, instagram: 3900 },
]

const POSTING_TIME_DATA = [
  { time: '6am', engagement: 12 },
  { time: '8am', engagement: 45 },
  { time: '10am', engagement: 78 },
  { time: '12pm', engagement: 92 },
  { time: '2pm', engagement: 65 },
  { time: '4pm', engagement: 88 },
  { time: '6pm', engagement: 95 },
  { time: '8pm', engagement: 72 },
  { time: '10pm', engagement: 38 },
]

const PLATFORM_BREAKDOWN = [
  { name: 'Twitter', value: 42, color: '#3b82f6' },
  { name: 'YouTube', value: 28, color: '#ef4444' },
  { name: 'LinkedIn', value: 18, color: '#1d4ed8' },
  { name: 'Instagram', value: 12, color: '#ec4899' },
]

const TOP_POSTS = [
  {
    id: 1,
    platform: '🐦',
    content: 'AI is revolutionizing content creation...',
    engagement: 1240,
    reach: 8900,
    deal: 'Samsung — $150',
    date: 'Mar 7'
  },
  {
    id: 2,
    platform: '💼',
    content: 'The Rise of AI-Assisted Design...',
    engagement: 890,
    reach: 5600,
    deal: null,
    date: 'Mar 6'
  },
  {
    id: 3,
    platform: '🐦',
    content: 'YouTube has completely changed how...',
    engagement: 2100,
    reach: 14200,
    deal: 'Nike — $300',
    date: 'Mar 5'
  },
  {
    id: 4,
    platform: '💼',
    content: 'Creators waste 2 hours daily switching...',
    engagement: 650,
    reach: 4100,
    deal: null,
    date: 'Mar 4'
  },
]

const ROI_LINKS = [
  { id: 1, brand: 'Samsung', link: 'creatoros.app/r/samsung-mar', clicks: 342, conversions: 28, deal: '$150' },
  { id: 2, brand: 'Nike', link: 'creatoros.app/r/nike-feb', clicks: 891, conversions: 67, deal: '$300' },
  { id: 3, brand: 'Notion', link: 'creatoros.app/r/notion-mar', clicks: 156, conversions: 12, deal: '$200' },
]

export default function AnalyticsPage() {
  const [activeChart, setActiveChart] = useState('all')
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(null)
  const [newRoiLink, setNewRoiLink] = useState({ brand: '', deal: '' })
  const [roiLinks, setRoiLinks] = useState(ROI_LINKS)
  const [showRoiForm, setShowRoiForm] = useState(false)

  const totalAudience = AUDIENCE_GROWTH[AUDIENCE_GROWTH.length - 1]
  const prevMonth = AUDIENCE_GROWTH[AUDIENCE_GROWTH.length - 2]
  const totalNow = totalAudience.twitter + totalAudience.youtube + totalAudience.linkedin + totalAudience.instagram
  const totalPrev = prevMonth.twitter + prevMonth.youtube + prevMonth.linkedin + prevMonth.instagram
  const growthPercent = (((totalNow - totalPrev) / totalPrev) * 100).toFixed(1)

  const bestTime = POSTING_TIME_DATA.reduce((a, b) => a.engagement > b.engagement ? a : b)

  const handleAiInsight = async () => {
    setAiLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/ai/analytics-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_audience: totalNow,
          growth_percent: growthPercent,
          best_time: bestTime.time,
          top_platform: PLATFORM_BREAKDOWN[0].name,
          total_posts: TOP_POSTS.length
        })
      })
      const data = await response.json()
      setAiInsight(data.insight)
    } catch (error) {
      setAiInsight("AI insight generate nahi hua. Backend check karein.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleCopyLink = (linkId, link) => {
    navigator.clipboard.writeText("https://" + link)
    setCopiedLink(linkId)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleCreateRoiLink = () => {
    if (!newRoiLink.brand.trim()) return
    const slug = newRoiLink.brand.toLowerCase().replace(/\s/g, '-') + '-' + new Date().getMonth()
    const newLink = {
      id: roiLinks.length + 1,
      brand: newRoiLink.brand,
      link: 'creatoros.app/r/' + slug,
      clicks: 0,
      conversions: 0,
      deal: newRoiLink.deal
    }
    setRoiLinks(prev => [...prev, newLink])
    setNewRoiLink({ brand: '', deal: '' })
    setShowRoiForm(false)
  }

  const chartLines = [
    { key: 'twitter', color: '#3b82f6', label: 'Twitter' },
    { key: 'youtube', color: '#ef4444', label: 'YouTube' },
    { key: 'linkedin', color: '#1d4ed8', label: 'LinkedIn' },
    { key: 'instagram', color: '#ec4899', label: 'Instagram' },
  ]

  const visibleLines = activeChart === 'all'
    ? chartLines
    : chartLines.filter(l => l.key === activeChart)

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics 📊</h1>
        <p className="text-gray-500 mt-1">Apni growth, engagement aur ROI track karein</p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Audience</p>
          <p className="text-2xl font-bold text-gray-900">{totalNow.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">+{growthPercent}% this month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Best Post Time</p>
          <p className="text-2xl font-bold text-gray-900">{bestTime.time}</p>
          <p className="text-xs text-blue-500 mt-1">{bestTime.engagement}% engagement rate</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Top Platform</p>
          <p className="text-2xl font-bold text-gray-900">🐦 Twitter</p>
          <p className="text-xs text-gray-400 mt-1">{PLATFORM_BREAKDOWN[0].value}% of audience</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">ROI Links Active</p>
          <p className="text-2xl font-bold text-gray-900">{roiLinks.length}</p>
          <p className="text-xs text-purple-500 mt-1">{roiLinks.reduce((s, l) => s + l.clicks, 0)} total clicks</p>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold mb-1">✨ AI Growth Insight</p>
            {aiInsight ? (
              <p className="text-purple-100 text-sm leading-relaxed">{aiInsight}</p>
            ) : (
              <p className="text-purple-200 text-sm">
                AI tumhara data analyze karke personalized growth tips dega!
              </p>
            )}
          </div>
          <button
            onClick={handleAiInsight}
            disabled={aiLoading}
            className="flex-shrink-0 px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            {aiLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </div>
            ) : (
              aiInsight ? 'Refresh' : 'Get Insight'
            )}
          </button>
        </div>
      </div>

      {/* Audience Growth Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Audience Growth</h2>
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'twitter', label: '🐦' },
              { id: 'youtube', label: '🎥' },
              { id: 'linkedin', label: '💼' },
              { id: 'instagram', label: '📸' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveChart(f.id)}
                className={"px-3 py-1 rounded-lg text-xs font-medium transition-all " + (activeChart === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={AUDIENCE_GROWTH}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {visibleLines.map(line => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={line.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Best Posting Time + Platform Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Best Posting Time */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Best Posting Times</h2>
          <p className="text-xs text-gray-400 mb-4">Engagement rate by hour</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={POSTING_TIME_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => val + '%'} />
              <Bar dataKey="engagement" fill="#3b82f6" radius={[4, 4, 0, 0]}
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 bg-blue-50 rounded-lg p-3">
            <p className="text-blue-700 text-sm font-medium">
              🏆 Best time: <span className="font-bold">{bestTime.time}</span> — {bestTime.engagement}% engagement
            </p>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Platform Breakdown</h2>
          <p className="text-xs text-gray-400 mb-4">Audience distribution</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={PLATFORM_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  {PLATFORM_BREAKDOWN.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => val + '%'} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {PLATFORM_BREAKDOWN.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                  <span className="text-sm text-gray-600">{p.name}</span>
                  <span className="ml-auto text-sm font-semibold text-gray-800">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts + Deal Attribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Top Posts — Deal Attribution 🔗</h2>
        <div className="space-y-3">
          {TOP_POSTS.map(post => (
            <div key={post.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-2xl">{post.platform}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{post.content}</p>
                <p className="text-xs text-gray-400 mt-0.5">{post.date}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">{post.engagement.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Engagement</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">{post.reach.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Reach</p>
              </div>
              <div className="min-w-28 text-right">
                {post.deal ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                    💰 {post.deal}
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-400 text-xs px-2 py-1 rounded-full">
                    No deal yet
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsorship ROI Tracking Links */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Sponsorship ROI Links 📈</h2>
            <p className="text-xs text-gray-400 mt-0.5">Brands ko ye links do — clicks aur conversions track hongi</p>
          </div>
          <button
            onClick={() => setShowRoiForm(!showRoiForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + New Link
          </button>
        </div>

        {/* New ROI Link Form */}
        {showRoiForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newRoiLink.brand}
                onChange={(e) => setNewRoiLink(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Brand name (e.g. Samsung)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="text"
                value={newRoiLink.deal}
                onChange={(e) => setNewRoiLink(prev => ({ ...prev, deal: e.target.value }))}
                placeholder="Deal amount (e.g. $200)"
                className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={handleCreateRoiLink}
                disabled={!newRoiLink.brand.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {roiLinks.map(link => (
            <div key={link.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{link.brand}</span>
                  {link.deal && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{link.deal}</span>
                  )}
                </div>
                <p className="text-xs text-blue-500 font-mono truncate">{link.link}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">{link.clicks}</p>
                <p className="text-xs text-gray-400">Clicks</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">{link.conversions}</p>
                <p className="text-xs text-gray-400">Conversions</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-green-600">
                  {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-400">CVR</p>
              </div>
              <button
                onClick={() => handleCopyLink(link.id, link.link)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                {copiedLink === link.id ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}