import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import emailjs from '@emailjs/browser'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function EarningsPage() {
  const [deals, setDeals] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState([])
  const [generatingInvoice, setGeneratingInvoice] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return

    const userId = sessionData.session.user.id

    const [{ data: dealsData }, { data: invoicesData }] = await Promise.all([
      supabase.from('brand_deals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('invoices').select('*').eq('user_id', userId)
    ])

    const d = dealsData || []
    const inv = invoicesData || []

    setDeals(d)
    setInvoices(inv)
    buildMonthlyData(d)
    setLoading(false)
  }

  const buildMonthlyData = (dealsData) => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
      const monthNum = date.getMonth()
      const yearNum = date.getFullYear()

      const earned = dealsData
        .filter(d => {
          const dealDate = new Date(d.created_at)
          return isPaid(d.status) &&
            dealDate.getMonth() === monthNum &&
            dealDate.getFullYear() === yearNum
        })
        .reduce((s, d) => s + (d.amount || 0), 0)

      months.push({ month: monthKey, earned })
    }
    setMonthlyData(months)
  }

  const handleGenerateInvoice = async (deal) => {
    setGeneratingInvoice(deal.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session.user.id
      const invoiceNumber = 'INV-' + Date.now().toString().slice(-6)

      // Supabase mein save karo
      const { error } = await supabase
        .from('invoices')
        .insert({
          deal_id: deal.id,
          user_id: userId,
          invoice_number: invoiceNumber,
          issue_date: new Date().toISOString(),
          status: 'pending',
        })

      if (error) throw error

      // Email bhejo EmailJS se
      await emailjs.send(
        'service_4i1ft08',
        'template_401ymto',
        {
          to_name: deal.brand_name,
          to_email: deal.contact_email || '',
          reply_to: sessionData.session.user.email,
          invoice_number: invoiceNumber,
          brand_name: deal.brand_name,
          deliverables: deal.deliverables || 'N/A',
          due_date: deal.due_date
            ? new Date(deal.due_date).toLocaleDateString()
            : 'N/A',
          amount: (deal.amount || 0).toLocaleString(),
        },
        'RYLSK93nSH3U6xnBa'
      )

      alert("✅ Invoice generate ho gayi aur email bhi chali gayi!")
      await fetchData()
    } catch (e) {
      console.error(e)
      alert("Error: " + e.message)
    } finally {
      setGeneratingInvoice(null)
    }
  }

  const isPaid = (status) => status?.toLowerCase() === 'paid'

  const totalEarned = deals
    .filter(d => isPaid(d.status))
    .reduce((s, d) => s + (d.amount || 0), 0)

  const pendingAmount = deals
    .filter(d => !isPaid(d.status))
    .reduce((s, d) => s + (d.amount || 0), 0)

  const thisMonthDeals = deals.filter(d => {
    const date = new Date(d.created_at)
    const now = new Date()
    return date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
  })

  const thisMonthEarned = thisMonthDeals
    .filter(d => isPaid(d.status))
    .reduce((s, d) => s + (d.amount || 0), 0)

  const paidInvoices = invoices.filter(i => i.status?.toLowerCase() === 'paid').length
  const pendingInvoices = invoices.filter(i => i.status?.toLowerCase() !== 'paid').length

  const lastMonthEarned = monthlyData.length >= 2
    ? monthlyData[monthlyData.length - 2]?.earned || 0
    : 0
  const currentMonthEarned = monthlyData[monthlyData.length - 1]?.earned || 0
  const growthPercent = lastMonthEarned > 0
    ? (((currentMonthEarned - lastMonthEarned) / lastMonthEarned) * 100).toFixed(1)
    : null

  const dealsByAmount = [...deals]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 5)

  const dealChartData = dealsByAmount.map(d => ({
    name: d.brand_name?.slice(0, 12) || 'Unknown',
    amount: d.amount || 0
  }))

  const STATUS_COLORS = {
    'paid': 'bg-green-100 text-green-700',
    'live': 'bg-blue-100 text-blue-700',
    'content creation': 'bg-yellow-100 text-yellow-700',
    'negotiating': 'bg-orange-100 text-orange-700',
    'lead': 'bg-gray-100 text-gray-600',
    'active': 'bg-blue-100 text-blue-700',
  }

  const getStatusColor = (status) =>
    STATUS_COLORS[status?.toLowerCase()] || 'bg-gray-100 text-gray-600'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Earnings 💰</h1>
        <p className="text-gray-500 mt-1">Apni saari income ek jagah dekho</p>
      </header>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-green-700">${totalEarned.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">
            {deals.filter(d => isPaid(d.status)).length} paid deals
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 mb-1">This Month</p>
          <p className="text-2xl font-bold text-blue-700">${thisMonthEarned.toLocaleString()}</p>
          <p className="text-xs text-blue-500 mt-1">{thisMonthDeals.length} deals this month</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 mb-1">Pipeline Value</p>
          <p className="text-2xl font-bold text-orange-700">${pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-orange-500 mt-1">
            {deals.filter(d => !isPaid(d.status)).length} active deals
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-purple-600 mb-1">Invoices</p>
          <p className="text-2xl font-bold text-purple-700">{paidInvoices} / {invoices.length}</p>
          <p className="text-xs text-purple-500 mt-1">{pendingInvoices} pending</p>
        </div>
      </div>

      {/* Earning Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">📈 Earning Trend (Last 6 Months)</h3>
          {growthPercent !== null && (
            <span className={"text-xs px-2 py-1 rounded-full font-medium " + (Number(growthPercent) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
              {Number(growthPercent) >= 0 ? '+' : ''}{growthPercent}% vs last month
            </span>
          )}
        </div>

        {monthlyData.every(m => m.earned === 0) ? (
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-gray-400 text-sm">Paid deals add karo — trend yahan dikhega</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => '$' + v.toLocaleString()} />
              <Area type="monotone" dataKey="earned" stroke="#10b981" strokeWidth={2.5} fill="url(#earningsGradient)" dot={{ fill: '#10b981', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Deals + All Deals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">🏆 Top Deals by Value</h3>
          {dealChartData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💼</div>
              <p className="text-gray-400 text-sm">Koi deal nahi abhi</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dealChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => '$' + v.toLocaleString()} />
                <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">📋 All Deals</h3>
          {deals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-gray-400 text-sm">Brand Deals mein koi deal add nahi ki</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {deals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{deal.brand_name}</p>
                    {deal.contact_email && (
                      <p className="text-xs text-gray-400 truncate">{deal.contact_email}</p>
                    )}
                    {deal.due_date && (
                      <p className="text-xs text-gray-400">
                        Due: {new Date(deal.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + getStatusColor(deal.status)}>
                      {deal.status}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      ${(deal.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoices & Pending Payments */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">🧾 Invoices & Pending Payments</h3>
          <div className="flex gap-3 text-sm">
            <span className="text-green-600 font-medium">
              {deals.filter(d => isPaid(d.status)).length} paid
            </span>
            <span className="text-orange-500 font-medium">
              {deals.filter(d => !isPaid(d.status) && d.amount > 0).length} pending
            </span>
          </div>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="text-3xl mb-2">🧾</div>
            <p className="text-gray-400 text-sm">Koi deal nahi — Brand Deals se add karein</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal, i) => (
              <div
                key={deal.id}
                className={"flex items-center justify-between p-4 rounded-xl border " + (isPaid(deal.status) ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200')}
              >
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 " + (isPaid(deal.status) ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700')}>
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{deal.brand_name}</p>
                    {deal.contact_email && (
                      <p className="text-xs text-blue-500">{deal.contact_email}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {deal.due_date
                        ? 'Due: ' + new Date(deal.due_date).toLocaleDateString()
                        : 'No due date'}
                    </p>
                    {deal.deliverables && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {deal.deliverables}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ${(deal.amount || 0).toLocaleString()}
                    </p>
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + getStatusColor(deal.status)}>
                      {deal.status}
                    </span>
                  </div>

                  {/* Paid */}
                  {isPaid(deal.status) && (
                    <div className="flex flex-col items-center">
                      <span className="text-lg">✅</span>
                      <span className="text-xs text-green-500 font-medium">Paid</span>
                    </div>
                  )}

                  {/* Pending — Invoice already exists */}
                  {!isPaid(deal.status) && invoices.find(inv => inv.deal_id === deal.id) && (
                    <div className="flex flex-col items-center">
                      <span className="text-lg">🧾</span>
                      <span className="text-xs text-orange-500 font-medium">Invoice Sent</span>
                    </div>
                  )}

                  {/* Pending — No invoice yet */}
                  {!isPaid(deal.status) && !invoices.find(inv => inv.deal_id === deal.id) && (
                    <button
                      onClick={() => handleGenerateInvoice(deal)}
                      disabled={generatingInvoice === deal.id}
                      className="flex flex-col items-center gap-0.5 px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {generatingInvoice === deal.id ? (
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="text-lg">📄</span>
                      )}
                      <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
                        {generatingInvoice === deal.id ? 'Sending...' : 'Send Invoice'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Bar */}
        {deals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">Total Pipeline</p>
            <div className="flex gap-4">
              <span className="text-sm font-bold text-green-600">
                ✅ Received: ${deals.filter(d => isPaid(d.status)).reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}
              </span>
              <span className="text-sm font-bold text-orange-500">
                ⏳ Pending: ${deals.filter(d => !isPaid(d.status)).reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Tip */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <p className="text-sm font-semibold text-blue-700 mb-1">💡 Pro Tip</p>
        <p className="text-sm text-blue-600">
          Brand Deals mein contact email zaroor dalo — invoice directly unke email par jayegi! 📧
        </p>
      </div>
    </div>
  )
}