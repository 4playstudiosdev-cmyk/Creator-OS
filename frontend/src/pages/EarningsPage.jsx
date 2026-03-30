import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import emailjs from '@emailjs/browser'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'

// ─── Dark tooltip for Recharts ────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ color: '#6b7280', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#a5b4fc', fontSize: 14, fontWeight: 800 }}>
          ${(p.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ─── Icon paths ────────────────────────────────────────────────────────────────
const IC = {
  dollar:   "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  trend:    "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  clock:    "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
  file:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
  send:     "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  check:    "M20 6L9 17l-5-5",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  info:     "M12 22a10 10 0 100-20 10 10 0 000 20zM12 8h.01M11 12h1v4h1",
  deals:    "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  invoice:  "M9 14l6-6M9.5 9a.5.5 0 110-1 .5.5 0 010 1zM14.5 14a.5.5 0 110-1 .5.5 0 010 1zM4 4h16v3H4zM4 7v13h16V7",
}

const Ico = ({ d, s = 15, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

// ─── Status color map ──────────────────────────────────────────────────────────
const statusStyle = status => {
  const s = status?.toLowerCase()
  if (s === 'paid')             return { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  }
  if (s === 'live')             return { color: '#93c5fd', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  }
  if (s === 'content creation') return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }
  if (s === 'negotiating')      return { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' }
  return                               { color: '#9ca3af', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' }
}

const isPaid = s => s?.toLowerCase() === 'paid'

const CARD = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 18,
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function EarningsPage() {
  const [deals,             setDeals]             = useState([])
  const [invoices,          setInvoices]          = useState([])
  const [loading,           setLoading]           = useState(true)
  const [monthlyData,       setMonthlyData]       = useState([])
  const [generatingInvoice, setGeneratingInvoice] = useState(null)
  const [activeTab,         setActiveTab]         = useState('overview')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const uid = sessionData.session.user.id
    const [{ data: d }, { data: inv }] = await Promise.all([
      supabase.from('brand_deals').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
      supabase.from('invoices').select('*').eq('user_id', uid),
    ])
    const deals = d || [], invs = inv || []
    setDeals(deals); setInvoices(invs); buildMonthlyData(deals); setLoading(false)
  }

  const buildMonthlyData = dealsData => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(); date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
      const m = date.getMonth(), y = date.getFullYear()
      const earned = dealsData
        .filter(d => { const dd = new Date(d.created_at); return isPaid(d.status) && dd.getMonth() === m && dd.getFullYear() === y })
        .reduce((s, d) => s + (d.amount || 0), 0)
      months.push({ month: monthKey, earned })
    }
    setMonthlyData(months)
  }

  const handleGenerateInvoice = async deal => {
    setGeneratingInvoice(deal.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session.user.id
      const invoiceNumber = 'INV-' + Date.now().toString().slice(-6)
      const { error } = await supabase.from('invoices').insert({
        deal_id: deal.id, user_id: uid, invoice_number: invoiceNumber,
        issue_date: new Date().toISOString(), status: 'pending',
      })
      if (error) throw error
      await emailjs.send('service_4i1ft08', 'template_401ymto', {
        to_name: deal.brand_name, to_email: deal.contact_email || '',
        reply_to: sessionData.session.user.email, invoice_number: invoiceNumber,
        brand_name: deal.brand_name, deliverables: deal.deliverables || 'N/A',
        due_date: deal.due_date ? new Date(deal.due_date).toLocaleDateString() : 'N/A',
        amount: (deal.amount || 0).toLocaleString(),
      }, 'RYLSK93nSH3U6xnBa')
      alert('✅ Invoice sent!')
      await fetchData()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setGeneratingInvoice(null) }
  }

  // ─── Derived stats ───────────────────────────────────────────────────────
  const totalEarned     = deals.filter(d => isPaid(d.status)).reduce((s, d) => s + (d.amount || 0), 0)
  const pendingAmount   = deals.filter(d => !isPaid(d.status)).reduce((s, d) => s + (d.amount || 0), 0)
  const now             = new Date()
  const thisMonthDeals  = deals.filter(d => { const dt = new Date(d.created_at); return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear() })
  const thisMonthEarned = thisMonthDeals.filter(d => isPaid(d.status)).reduce((s, d) => s + (d.amount || 0), 0)
  const paidCount       = invoices.filter(i => i.status?.toLowerCase() === 'paid').length
  const pendingInvCount = invoices.filter(i => i.status?.toLowerCase() !== 'paid').length
  const lastMonthEarned = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2]?.earned || 0 : 0
  const curMonthEarned  = monthlyData[monthlyData.length - 1]?.earned || 0
  const growthPct       = lastMonthEarned > 0 ? (((curMonthEarned - lastMonthEarned) / lastMonthEarned) * 100).toFixed(1) : null
  const topDeals        = [...deals].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 5)
    .map(d => ({ name: d.brand_name?.slice(0, 14) || 'Unknown', amount: d.amount || 0 }))

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: `Invoices (${invoices.length})` },
    { id: 'deals',    label: `All Deals (${deals.length})` },
  ]

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360, background: '#0a0a0f' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Loading earnings…</p>
      </div>
    </div>
  )

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .eb  { cursor:pointer; border:none; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .eb:hover  { filter:brightness(1.15); }
        .eb:disabled { opacity:.4; cursor:not-allowed; filter:none; }
        .e-scroll::-webkit-scrollbar { width:3px; }
        .e-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:99px; }
      `}</style>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}>
            <Ico d={IC.dollar} s={20} c="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, color: '#f0f0f5', lineHeight: 1 }}>Earnings</h1>
            <p style={{ color: '#4b5563', fontSize: 13, marginTop: 3 }}>Track income, invoices & brand deal pipeline</p>
          </div>
        </div>
        <button className="eb" onClick={fetchData}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', borderRadius: 10, background: 'rgba(255,255,255,0.03)', fontSize: 12 }}>
          <Ico d={IC.refresh} s={13} c="#6b7280" /> Refresh
        </button>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          {
            label: 'Total Earned', icon: IC.dollar,
            value: `$${totalEarned.toLocaleString()}`,
            sub: `${deals.filter(d => isPaid(d.status)).length} paid deals`,
            accent: '#6ee7b7', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
          },
          {
            label: 'This Month', icon: IC.trend,
            value: `$${thisMonthEarned.toLocaleString()}`,
            sub: `${thisMonthDeals.length} deal${thisMonthDeals.length !== 1 ? 's' : ''} this month`,
            accent: '#a5b4fc', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',
          },
          {
            label: 'Pipeline', icon: IC.clock,
            value: `$${pendingAmount.toLocaleString()}`,
            sub: `${deals.filter(d => !isPaid(d.status)).length} active deals`,
            accent: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
          },
          {
            label: 'Invoices', icon: IC.invoice,
            value: `${paidCount} / ${invoices.length}`,
            sub: `${pendingInvCount} pending`,
            accent: '#c084fc', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)',
          },
        ].map((kpi, i) => (
          <div key={i} style={{ ...CARD, padding: 20, background: kpi.bg, border: `1px solid ${kpi.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: kpi.accent, textTransform: 'uppercase', letterSpacing: 0.6 }}>{kpi.label}</p>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${kpi.bg}`, border: `1px solid ${kpi.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d={kpi.icon} s={14} c={kpi.accent} />
              </div>
            </div>
            <p style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 28, color: '#f0f0f5', lineHeight: 1, marginBottom: 6 }}>{kpi.value}</p>
            <p style={{ fontSize: 11, color: '#4b5563' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} className="eb" onClick={() => setActiveTab(t.id)}
            style={{ padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, background: activeTab === t.id ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeTab === t.id ? '#a5b4fc' : '#6b7280', border: `1px solid ${activeTab === t.id ? 'rgba(99,102,241,0.35)' : 'transparent'}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Trend chart */}
          <div style={{ ...CARD, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Earnings Trend</h3>
                <p style={{ color: '#4b5563', fontSize: 12 }}>Last 6 months · paid deals only</p>
              </div>
              {growthPct !== null && (
                <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100, fontWeight: 700, background: Number(growthPct) >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${Number(growthPct) >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: Number(growthPct) >= 0 ? '#6ee7b7' : '#f87171' }}>
                  {Number(growthPct) >= 0 ? '↑' : '↓'} {Math.abs(Number(growthPct))}% vs last month
                </span>
              )}
            </div>
            {monthlyData.every(m => m.earned === 0) ? (
              <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 14, gap: 10 }}>
                <Ico d={IC.trend} s={28} c="#1f2937" />
                <p style={{ color: '#374151', fontSize: 13 }}>Mark deals as <strong style={{ color: '#4b5563' }}>Paid</strong> to see your trend</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area type="monotone" dataKey="earned" stroke="#6366f1" strokeWidth={2.5} fill="url(#eGrad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#a5b4fc' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Two columns: top deals chart + summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Top deals bar chart */}
            <div style={{ ...CARD, padding: 22 }}>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Top Deals by Value</h3>
              <p style={{ color: '#4b5563', fontSize: 12, marginBottom: 18 }}>Highest-value brand partnerships</p>
              {topDeals.length === 0 ? (
                <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Ico d={IC.deals} s={28} c="#1f2937" />
                  <p style={{ color: '#374151', fontSize: 13 }}>No deals yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={topDeals} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {topDeals.map((_, idx) => (
                        <Cell key={idx} fill={`rgba(99,102,241,${1 - idx * 0.15})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Income breakdown */}
            <div style={{ ...CARD, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Income Breakdown</h3>
                <p style={{ color: '#4b5563', fontSize: 12 }}>Received vs pending pipeline</p>
              </div>

              {/* Visual bar */}
              {totalEarned + pendingAmount > 0 && (
                <div>
                  <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${(totalEarned / (totalEarned + pendingAmount)) * 100}%`, background: 'linear-gradient(90deg,#10b981,#6366f1)', borderRadius: 99, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b5563' }}>
                    <span>Received {totalEarned + pendingAmount > 0 ? Math.round((totalEarned / (totalEarned + pendingAmount)) * 100) : 0}%</span>
                    <span>Pipeline {totalEarned + pendingAmount > 0 ? Math.round((pendingAmount / (totalEarned + pendingAmount)) * 100) : 0}%</span>
                  </div>
                </div>
              )}

              {[
                { label: 'Total Received',  value: `$${totalEarned.toLocaleString()}`,   color: '#6ee7b7', icon: '✅' },
                { label: 'Pipeline Value',  value: `$${pendingAmount.toLocaleString()}`,  color: '#fbbf24', icon: '⏳' },
                { label: 'This Month',      value: `$${thisMonthEarned.toLocaleString()}`, color: '#a5b4fc', icon: '📅' },
                { label: 'Avg Deal Size',   value: deals.length > 0 ? `$${Math.round(deals.reduce((s, d) => s + (d.amount || 0), 0) / deals.length).toLocaleString()}` : '$0', color: '#c084fc', icon: '📊' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{row.icon}</span>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Syne', color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          INVOICES TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'invoices' && (
        <div style={{ ...CARD, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Invoices & Payments</h3>
              <p style={{ color: '#4b5563', fontSize: 12 }}>Send invoices directly to brand contacts</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <span style={{ color: '#6ee7b7', fontWeight: 700 }}>✅ {deals.filter(d => isPaid(d.status)).length} paid</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>⏳ {deals.filter(d => !isPaid(d.status) && d.amount > 0).length} pending</span>
            </div>
          </div>

          {deals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 16 }}>
              <Ico d={IC.invoice} s={36} c="#1f2937" />
              <p style={{ color: '#374151', fontSize: 14, marginTop: 12 }}>No deals found — add them in Brand Deals</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deals.map((deal, i) => {
                const paid       = isPaid(deal.status)
                const sc         = statusStyle(deal.status)
                const hasInvoice = invoices.find(inv => inv.deal_id === deal.id)
                return (
                  <div key={deal.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, border: `1px solid ${paid ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`, background: paid ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', transition: 'background .2s' }}>

                    {/* Left: index + deal info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: paid ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: paid ? '#6ee7b7' : '#4b5563', flexShrink: 0, fontFamily: 'Syne' }}>
                        {i + 1}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{deal.brand_name}</p>
                        {deal.contact_email && <p style={{ fontSize: 11, color: '#6366f1', marginBottom: 2 }}>{deal.contact_email}</p>}
                        <p style={{ fontSize: 11, color: '#4b5563' }}>
                          {deal.due_date ? 'Due ' + new Date(deal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
                        </p>
                        {deal.deliverables && <p style={{ fontSize: 11, color: '#374151', marginTop: 2, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.deliverables}</p>}
                      </div>
                    </div>

                    {/* Right: amount + status + action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Syne', marginBottom: 5 }}>${(deal.amount || 0).toLocaleString()}</p>
                        <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, fontWeight: 700, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>{deal.status}</span>
                      </div>

                      {/* Action */}
                      {paid ? (
                        <div style={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 32, height: 32, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ico d={IC.check} s={15} c="#6ee7b7" />
                          </div>
                          <p style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 700 }}>Paid</p>
                        </div>
                      ) : hasInvoice ? (
                        <div style={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 32, height: 32, background: 'rgba(245,158,11,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ico d={IC.send} s={13} c="#fbbf24" />
                          </div>
                          <p style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>Invoice Sent</p>
                        </div>
                      ) : (
                        <button className="eb" onClick={() => handleGenerateInvoice(deal)} disabled={generatingInvoice === deal.id}
                          style={{ width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, color: '#a5b4fc' }}>
                          {generatingInvoice === deal.id
                            ? <div style={{ width: 16, height: 16, border: '2px solid rgba(165,180,252,0.3)', borderTopColor: '#a5b4fc', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                            : <Ico d={IC.send} s={16} c="#a5b4fc" />}
                          <span style={{ fontSize: 10, fontWeight: 700 }}>{generatingInvoice === deal.id ? 'Sending…' : 'Send Invoice'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer totals */}
          {deals.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#4b5563', fontSize: 13 }}>Total pipeline value</p>
              <div style={{ display: 'flex', gap: 24 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#6ee7b7', fontFamily: 'Syne' }}>
                  ✅ ${deals.filter(d => isPaid(d.status)).reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()} received
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', fontFamily: 'Syne' }}>
                  ⏳ ${deals.filter(d => !isPaid(d.status)).reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()} pending
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ALL DEALS TAB
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'deals' && (
        <div style={{ ...CARD, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>All Brand Deals</h3>
              <p style={{ color: '#4b5563', fontSize: 12 }}>{deals.length} total deals · ${(totalEarned + pendingAmount).toLocaleString()} combined value</p>
            </div>
          </div>

          {deals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', border: '2px dashed rgba(255,255,255,0.06)', borderRadius: 16 }}>
              <Ico d={IC.deals} s={36} c="#1f2937" />
              <p style={{ color: '#374151', fontSize: 14, marginTop: 12 }}>No deals yet — add them in Brand Deals</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, padding: '8px 14px', marginBottom: 6 }}>
                {['Brand', 'Amount', 'Status', 'Due Date'].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</p>
                ))}
              </div>

              {/* Table rows */}
              <div className="e-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {deals.map(deal => {
                  const sc = statusStyle(deal.status)
                  return (
                    <div key={deal.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, padding: '13px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.brand_name}</p>
                        {deal.contact_email && <p style={{ fontSize: 11, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.contact_email}</p>}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Syne' }}>${(deal.amount || 0).toLocaleString()}</p>
                      <span style={{ fontSize: 10, padding: '4px 9px', borderRadius: 100, fontWeight: 700, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, display: 'inline-block', width: 'fit-content' }}>{deal.status}</span>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>
                        {deal.due_date ? new Date(deal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PRO TIP ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Ico d={IC.info} s={16} c="#6366f1" />
        <p style={{ fontSize: 13, color: '#818cf8' }}>
          <span style={{ fontWeight: 700, color: '#a5b4fc' }}>Pro Tip:</span> Add a contact email in Brand Deals and click "Send Invoice" to email it directly to the brand. 📧
        </p>
      </div>
    </div>
  )
}

