import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TIERS = [
  {
    id: 'solo',
    name: 'Solo Creator',
    price: 19,
    color: 'border-gray-200',
    badge: null,
    description: 'Naye creators ke liye — shuruaat karein!',
    features: [
      { text: 'Repurpose Router — 10x per month', included: true },
      { text: 'Content Scheduler — 30 posts/mo', included: true },
      { text: '1 Media Kit page', included: true },
      { text: 'Basic Analytics', included: true },
      { text: 'Brand Deals CRM — 5 deals', included: true },
      { text: 'Invoice Generator', included: true },
      { text: 'Unified Inbox', included: false },
      { text: 'YouTube URL Repurpose', included: false },
      { text: 'ROI Tracking Links', included: false },
      { text: 'AI Growth Insights', included: false },
      { text: 'Agency Dashboard', included: false },
      { text: 'Priority Support', included: false },
    ],
    cta: 'Start Solo',
    ctaColor: 'bg-gray-800 hover:bg-gray-900',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    color: 'border-blue-500',
    badge: '🔥 Most Popular',
    description: 'Serious creators ke liye — scale karein!',
    features: [
      { text: 'Repurpose Router — Unlimited', included: true },
      { text: 'Content Scheduler — Unlimited', included: true },
      { text: '3 Media Kit pages', included: true },
      { text: 'Advanced Analytics + Best Time AI', included: true },
      { text: 'Brand Deals CRM — Unlimited', included: true },
      { text: 'Invoice Generator + Auto Reminders', included: true },
      { text: 'Unified Inbox — All Platforms', included: true },
      { text: 'YouTube URL Repurpose', included: true },
      { text: 'ROI Tracking Links — 10', included: true },
      { text: 'AI Growth Insights', included: true },
      { text: 'Agency Dashboard', included: false },
      { text: 'Priority Support', included: false },
    ],
    cta: 'Start Growth',
    ctaColor: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    color: 'border-purple-500',
    badge: '👑 Best Value',
    description: 'Pro creators aur agencies ke liye!',
    features: [
      { text: 'Repurpose Router — Unlimited', included: true },
      { text: 'Content Scheduler — Unlimited', included: true },
      { text: 'Unlimited Media Kit pages', included: true },
      { text: 'Full Analytics Suite + Custom Reports', included: true },
      { text: 'Brand Deals CRM — Unlimited', included: true },
      { text: 'Invoice Generator + Auto Reminders', included: true },
      { text: 'Unified Inbox — All Platforms', included: true },
      { text: 'YouTube URL Repurpose', included: true },
      { text: 'ROI Tracking Links — Unlimited', included: true },
      { text: 'AI Growth Insights — Daily', included: true },
      { text: 'Agency Dashboard — 5 Creators', included: true },
      { text: 'Priority Support — 24h response', included: true },
    ],
    cta: 'Start Pro',
    ctaColor: 'bg-purple-600 hover:bg-purple-700',
  },
]

const FAQS = [
  {
    q: 'Kya main plan change kar sakta hoon?',
    a: 'Haan! Kisi bhi waqt upgrade ya downgrade kar sakte hain. Change immediately effective hoga.'
  },
  {
    q: 'Free trial hai?',
    a: '7 din ka free trial hai — koi credit card nahi chahiye. Baad mein decide karein.'
  },
  {
    q: 'Kaunse payment methods accept hote hain?',
    a: 'Visa, Mastercard, aur local payment methods support karte hain.'
  },
  {
    q: 'Cancel karna mushkil hai?',
    a: 'Bilkul nahi — ek click mein cancel kar sakte hain. Koi hidden fees nahi.'
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly') // 'monthly' or 'yearly'
  const [currentPlan, setCurrentPlan] = useState('growth') // mock current plan
  const [openFaq, setOpenFaq] = useState(null)
  const navigate = useNavigate()

  const getPrice = (price) => {
    if (billing === 'yearly') return Math.floor(price * 0.8) // 20% discount
    return price
  }

  const handleSelectPlan = (tierId) => {
    if (tierId === currentPlan) return
    // Mock — Stripe baad mein lagega
    alert("Plan change: " + tierId + " — Stripe end of week mein lagega! 🚀")
    setCurrentPlan(tierId)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plans & Pricing 💳</h1>
        <p className="text-gray-500 mt-2">Apni growth ke mutabiq sahi plan chunein</p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={"text-sm font-medium " + (billing === 'monthly' ? 'text-gray-900' : 'text-gray-400')}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
            className={"relative w-12 h-6 rounded-full transition-colors " + (billing === 'yearly' ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <div className={"absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow " + (billing === 'yearly' ? 'translate-x-7' : 'translate-x-1')}></div>
          </button>
          <span className={"text-sm font-medium " + (billing === 'yearly' ? 'text-gray-900' : 'text-gray-400')}>
            Yearly
            <span className="ml-1.5 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              Save 20%
            </span>
          </span>
        </div>
      </header>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map(tier => (
          <div
            key={tier.id}
            className={"relative bg-white rounded-2xl border-2 p-6 shadow-sm transition-shadow hover:shadow-md " + tier.color + (tier.id === 'growth' ? ' shadow-blue-100' : '')}
          >
            {/* Badge */}
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={"text-xs font-bold px-3 py-1 rounded-full text-white " + (tier.id === 'growth' ? 'bg-blue-600' : 'bg-purple-600')}>
                  {tier.badge}
                </span>
              </div>
            )}

            {/* Current Plan Badge */}
            {currentPlan === tier.id && (
              <div className="absolute top-4 right-4">
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  ✅ Current
                </span>
              </div>
            )}

            {/* Plan Info */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
              <p className="text-gray-400 text-sm mt-0.5">{tier.description}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-gray-900">${getPrice(tier.price)}</span>
                <span className="text-gray-400 text-sm mb-1">/mo</span>
              </div>
              {billing === 'yearly' && (
                <p className="text-green-600 text-xs mt-1">
                  Billed ${getPrice(tier.price) * 12}/year — Save ${(tier.price - getPrice(tier.price)) * 12}!
                </p>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectPlan(tier.id)}
              disabled={currentPlan === tier.id}
              className={"w-full py-2.5 rounded-xl text-white font-semibold transition-colors mb-6 disabled:opacity-60 disabled:cursor-not-allowed " + tier.ctaColor}
            >
              {currentPlan === tier.id ? '✅ Current Plan' : tier.cta}
            </button>

            {/* Features */}
            <div className="space-y-2.5">
              {tier.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={"text-sm flex-shrink-0 mt-0.5 " + (feature.included ? 'text-green-500' : 'text-gray-300')}>
                    {feature.included ? '✓' : '✗'}
                  </span>
                  <span className={"text-sm " + (feature.included ? 'text-gray-700' : 'text-gray-300')}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Comparison Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white text-center">
        <h2 className="text-xl font-bold mb-2">Sab plans mein included 🎁</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { emoji: '🔒', text: 'Secure & Private' },
            { emoji: '📱', text: 'Mobile Friendly' },
            { emoji: '🔄', text: 'Regular Updates' },
            { emoji: '💬', text: 'Community Access' },
          ].map((item, i) => (
            <div key={i} className="bg-white bg-opacity-20 rounded-xl p-3">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <p className="text-sm font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Limits Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Detailed Usage Limits</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-semibold text-gray-500 pb-3">Feature</th>
                <th className="text-center text-sm font-semibold text-gray-500 pb-3">Solo $19</th>
                <th className="text-center text-sm font-semibold text-blue-600 pb-3">Growth $49</th>
                <th className="text-center text-sm font-semibold text-purple-600 pb-3">Pro $99</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { feature: 'AI Repurpose', solo: '10/mo', growth: 'Unlimited', pro: 'Unlimited' },
                { feature: 'Scheduled Posts', solo: '30/mo', growth: 'Unlimited', pro: 'Unlimited' },
                { feature: 'Media Kit Pages', solo: '1', growth: '3', pro: 'Unlimited' },
                { feature: 'Brand Deals', solo: '5', growth: 'Unlimited', pro: 'Unlimited' },
                { feature: 'ROI Tracking Links', solo: '—', growth: '10', pro: 'Unlimited' },
                { feature: 'Unified Inbox', solo: '—', growth: '✓', pro: '✓' },
                { feature: 'YouTube Repurpose', solo: '—', growth: '✓', pro: '✓' },
                { feature: 'AI Growth Insights', solo: '—', growth: 'Weekly', pro: 'Daily' },
                { feature: 'Agency Creators', solo: '—', growth: '—', pro: '5' },
                { feature: 'Support', solo: 'Email', growth: 'Chat', pro: 'Priority 24h' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm text-gray-700 font-medium">{row.feature}</td>
                  <td className="py-3 text-sm text-center text-gray-500">{row.solo}</td>
                  <td className="py-3 text-sm text-center text-blue-600 font-medium">{row.growth}</td>
                  <td className="py-3 text-sm text-center text-purple-600 font-medium">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Aksar Pooche Jane Wale Sawal ❓</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800 text-sm">{faq.q}</span>
                <span className="text-gray-400 ml-2">{openFaq === i ? '▲' : '▼'}</span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-gray-500 text-sm">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}