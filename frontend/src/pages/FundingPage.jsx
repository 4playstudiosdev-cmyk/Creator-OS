import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

const MRR_DATA = [
  { month: 'Oct', mrr: 1200, users: 63 },
  { month: 'Nov', mrr: 2400, users: 126 },
  { month: 'Dec', mrr: 3100, users: 163 },
  { month: 'Jan', mrr: 4800, users: 252 },
  { month: 'Feb', mrr: 6200, users: 326 },
  { month: 'Mar', mrr: 8400, users: 442 },
]

const CHURN_DATA = [
  { month: 'Oct', churn: 5.2 },
  { month: 'Nov', churn: 4.8 },
  { month: 'Dec', churn: 4.1 },
  { month: 'Jan', churn: 3.6 },
  { month: 'Feb', churn: 3.2 },
  { month: 'Mar', churn: 2.8 },
]

const TIER_DATA = [
  { tier: 'Solo $19', users: 280, revenue: 5320 },
  { tier: 'Growth $49', users: 130, revenue: 6370 },
  { tier: 'Pro $99', users: 32, revenue: 3168 },
]

export default function FundingPage() {
  const [monthlyExpenses, setMonthlyExpenses] = useState(8000)
  const [cashInBank, setCashInBank] = useState(120000)
  const [activeSection, setActiveSection] = useState('metrics')

  // Calculations
  const currentMRR = 8400
  const currentARR = currentMRR * 12
  const totalUsers = 442
  const payingUsers = 442
  const avgRevenuePerUser = (currentMRR / payingUsers).toFixed(2)
  const churnRate = 2.8
  const ltv = ((currentMRR / payingUsers) / (churnRate / 100)).toFixed(0)
  const growthRate = (((8400 - 6200) / 6200) * 100).toFixed(1)
  const runway = Math.floor(cashInBank / monthlyExpenses)
  const netMRRGrowth = 8400 - 6200

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funding Metrics 📊</h1>
          <p className="text-gray-500 mt-1">Investor-ready growth dashboard</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            🖨️ Export
          </button>
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-semibold">
            🟢 Healthy
          </div>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'metrics', label: '📈 Key Metrics' },
          { id: 'growth', label: '🚀 Growth' },
          { id: 'runway', label: '🏦 Runway' },
          { id: 'pitch', label: '🎯 Pitch Summary' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={"px-4 py-2.5 text-sm font-medium border-b-2 transition-colors " + (activeSection === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== KEY METRICS ===== */}
      {activeSection === 'metrics' && (
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'MRR', value: '$' + currentMRR.toLocaleString(), sub: '+' + growthRate + '% MoM', color: 'text-blue-600', bg: 'bg-blue-50', trend: '📈' },
              { label: 'ARR', value: '$' + currentARR.toLocaleString(), sub: 'Annual Run Rate', color: 'text-green-600', bg: 'bg-green-50', trend: '💰' },
              { label: 'Paying Users', value: payingUsers, sub: '+' + Math.round(payingUsers * 0.12) + ' this month', color: 'text-purple-600', bg: 'bg-purple-50', trend: '👥' },
              { label: 'Churn Rate', value: churnRate + '%', sub: '↓ improving', color: 'text-orange-600', bg: 'bg-orange-50', trend: '📉' },
            ].map((kpi, i) => (
              <div key={i} className={"rounded-xl border border-gray-200 p-4 shadow-sm " + kpi.bg}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
                  <span className="text-lg">{kpi.trend}</span>
                </div>
                <p className={"text-2xl font-bold " + kpi.color}>{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'LTV', value: '$' + ltv, sub: 'Lifetime Value', icon: '💎' },
              { label: 'ARPU', value: '$' + avgRevenuePerUser, sub: 'Avg Revenue/User', icon: '👤' },
              { label: 'Net MRR Growth', value: '+$' + netMRRGrowth.toLocaleString(), sub: 'vs last month', icon: '📊' },
              { label: 'LTV:CAC Ratio', value: '3.2x', sub: 'Healthy > 3x', icon: '⚡' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span>{kpi.icon}</span>
                  <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* MRR Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">📈 MRR Growth</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">+35% MoM</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MRR_DATA}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => '$' + v.toLocaleString()} />
                <Area type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2.5} fill="url(#mrrGradient)" dot={{ fill: '#3b82f6', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Tier */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">💰 Revenue by Tier</h3>
            <div className="space-y-3">
              {TIER_DATA.map((tier, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 w-28">{tier.tier}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div
                      className={"h-3 rounded-full " + (i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-green-400' : 'bg-purple-400')}
                      style={{ width: (tier.revenue / 15000 * 100) + '%' }}
                    ></div>
                  </div>
                  <div className="text-right w-28">
                    <p className="text-sm font-bold text-gray-800">${tier.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{tier.users} users</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== GROWTH ===== */}
      {activeSection === 'growth' && (
        <div className="space-y-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">👥 User Growth</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">+35% MoM</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MRR_DATA}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2.5} fill="url(#userGradient)" dot={{ fill: '#7c3aed', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Churn Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">📉 Churn Rate Trend</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">↓ Improving</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={CHURN_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 8]} />
                <Tooltip formatter={(v) => v + '%'} />
                <Line type="monotone" dataKey="churn" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Milestones */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">🏆 Growth Milestones</h3>
            <div className="space-y-3">
              {[
                { milestone: '$1K MRR', date: 'Oct 2024', done: true },
                { milestone: '$5K MRR', date: 'Jan 2025', done: true },
                { milestone: '$10K MRR', date: 'Apr 2025 (projected)', done: false },
                { milestone: '1,000 Users', date: 'May 2025 (projected)', done: false },
                { milestone: '$50K MRR', date: 'Dec 2025 (projected)', done: false },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 " + (m.done ? 'bg-green-500' : 'bg-gray-200')}>
                    {m.done ? <span className="text-white text-xs">✓</span> : <span className="text-gray-400 text-xs">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className={"text-sm font-medium " + (m.done ? 'text-gray-800' : 'text-gray-400')}>{m.milestone}</p>
                  </div>
                  <span className={"text-xs px-2 py-1 rounded-full " + (m.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {m.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== RUNWAY ===== */}
      {activeSection === 'runway' && (
        <div className="space-y-6">
          {/* Runway Calculator */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-5">🏦 Runway Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash in Bank ($)</label>
                  <input
                    type="number"
                    value={cashInBank}
                    onChange={(e) => setCashInBank(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses ($)</label>
                  <input
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className={"p-4 rounded-xl border-2 text-center " + (runway >= 18 ? 'bg-green-50 border-green-200' : runway >= 12 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200')}>
                  <p className="text-sm font-medium text-gray-500 mb-1">Runway</p>
                  <p className={"text-4xl font-bold " + (runway >= 18 ? 'text-green-600' : runway >= 12 ? 'text-yellow-600' : 'text-red-600')}>
                    {runway} <span className="text-xl">months</span>
                  </p>
                  <p className={"text-xs mt-2 font-medium " + (runway >= 18 ? 'text-green-600' : runway >= 12 ? 'text-yellow-600' : 'text-red-600')}>
                    {runway >= 18 ? '✅ Healthy — investor ready!' : runway >= 12 ? '⚠️ Raise in next 6 months' : '🚨 Raise immediately!'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Burn Rate</p>
                    <p className="text-lg font-bold text-gray-800">${monthlyExpenses.toLocaleString()}/mo</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Net Burn</p>
                    <p className="text-lg font-bold text-blue-600">${Math.max(0, monthlyExpenses - currentMRR).toLocaleString()}/mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">💸 Monthly Expenses Breakdown</h3>
            <div className="space-y-3">
              {[
                { item: 'Salaries / Contractors', amount: 5000, percent: 62 },
                { item: 'Infrastructure (Supabase, Vercel)', amount: 200, percent: 2 },
                { item: 'AI APIs (Groq)', amount: 150, percent: 2 },
                { item: 'Marketing', amount: 1500, percent: 19 },
                { item: 'Tools & Software', amount: 350, percent: 4 },
                { item: 'Miscellaneous', amount: 800, percent: 10 },
              ].map((exp, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-52">{exp.item}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-400" style={{ width: exp.percent + '%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-20 text-right">${exp.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PITCH SUMMARY ===== */}
      {activeSection === 'pitch' && (
        <div className="space-y-5">
          {/* One-liner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-2">Company</p>
            <h2 className="text-2xl font-bold mb-2">Creator OS</h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              The all-in-one operating system for content creators — schedule, repurpose, monetize, and grow from one dashboard.
            </p>
          </div>

          {/* Traction */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">🚀 Traction</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'MRR', value: '$8,400', growth: '+35% MoM' },
                { label: 'ARR', value: '$100,800', growth: 'Run Rate' },
                { label: 'Paying Users', value: '442', growth: '+52 this month' },
                { label: 'Churn', value: '2.8%', growth: '↓ from 5.2%' },
                { label: 'LTV', value: '$' + ltv, growth: 'Per user' },
                { label: 'Runway', value: runway + ' months', growth: 'At current burn' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-green-600 font-medium">{item.growth}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ask */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">💰 The Ask</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Raising', value: '$500K', desc: 'Pre-seed round', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { label: 'Valuation', value: '$3M', desc: 'Pre-money', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                { label: 'Use of Funds', value: '18 mo', desc: 'Runway extended', color: 'bg-green-50 border-green-200 text-green-700' },
              ].map((item, i) => (
                <div key={i} className={"rounded-xl border-2 p-4 text-center " + item.color}>
                  <p className="text-xs font-medium opacity-70 mb-1">{item.label}</p>
                  <p className="text-3xl font-bold">{item.value}</p>
                  <p className="text-xs mt-1 opacity-70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fund Allocation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">📊 Fund Allocation</h3>
            <div className="space-y-3">
              {[
                { item: '👨‍💻 Product & Engineering', percent: 40, amount: '$200K' },
                { item: '📣 Marketing & Growth', percent: 30, amount: '$150K' },
                { item: '🤝 Sales & Partnerships', percent: 20, amount: '$100K' },
                { item: '⚙️ Operations', percent: 10, amount: '$50K' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-52">{item.item}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div
                      className={"h-3 rounded-full " + (i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : i === 2 ? 'bg-green-500' : 'bg-orange-400')}
                      style={{ width: item.percent + '%' }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-16 text-right">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

