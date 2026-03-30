import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function OnboardingPage() {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleContinue = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session.user

      // username email se banao agar null ho
      const username = user.email.split('@')[0]

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          account_type: selected,
          username: username,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (error) throw error

      // Hard redirect so ProtectedRoute re-fetches profile
      if (selected === 'individual') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/agency'
      }
    } catch (e) {
      alert("Error: " + e.message)
      setSaving(false)
    }
  }

  const options = [
    {
      id: 'individual',
      emoji: '👤',
      title: 'Individual Creator',
      desc: 'Main khud content banata hoon — apna scheduler, media kit, brand deals manage karna chahta hoon',
      features: ['Content Scheduler', 'Repurpose Router', 'Brand Deals CRM', 'Media Kit', 'AI Tools', 'Analytics'],
      color: 'border-blue-500 bg-blue-50',
      badge: 'Most Popular',
      badgeColor: 'bg-blue-600'
    },
    {
      id: 'agency',
      emoji: '🏢',
      title: 'Agency / Manager',
      desc: 'Main multiple creators manage karta hoon — unka content, deals aur revenue ek jagah dekhna chahta hoon',
      features: ['Multi-Creator Dashboard', 'Combined Analytics', 'Team Management', 'Bulk Scheduling', 'Agency Reports', 'Client Invoicing'],
      color: 'border-purple-500 bg-purple-50',
      badge: 'Pro Feature',
      badgeColor: 'bg-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Creator <span className="text-blue-500">OS</span> mein Khush Aamdeed! 🎉
          </h1>
          <p className="text-gray-500 mt-3 text-lg">Pehle batayein — aap kaun hain?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {options.map(option => (
            <div
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={"relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg " + (selected === option.id ? option.color + ' shadow-lg' : 'border-gray-200 hover:border-gray-300')}
            >
              <div className="absolute -top-3 left-6">
                <span className={"text-xs font-bold px-3 py-1 rounded-full text-white " + option.badgeColor}>
                  {option.badge}
                </span>
              </div>

              {selected === option.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}

              <div className="text-5xl mb-4">{option.emoji}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">{option.desc}</p>

              <div className="space-y-2">
                {option.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-500 text-sm">✓</span>
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selected || saving}
            className={"px-10 py-3.5 rounded-xl text-white font-bold text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed " + (selected === 'agency' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700')}
          >
            {saving ? (
              <div className="flex items-center gap-2 justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Setting up...
              </div>
            ) : (
              selected
                ? 'Continue as ' + (selected === 'individual' ? 'Creator 👤' : 'Agency 🏢')
                : 'Pehle chunein...'
            )}
          </button>
          <p className="text-gray-400 text-xs mt-3">Baad mein Settings mein change kar sakte hain</p>
        </div>

      </div>
    </div>
  )
}

