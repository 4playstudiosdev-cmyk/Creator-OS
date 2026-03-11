import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const PLATFORMS = ['YouTube', 'Instagram Reels', 'TikTok', 'YouTube Shorts']
const DURATIONS = ['30 seconds', '60 seconds', '3 minutes', '5 minutes', '10 minutes', '15+ minutes']
const TONES = ['Educational', 'Entertaining', 'Motivational', 'Storytelling', 'Promotional']

export default function ScriptStudioPage() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('YouTube')
  const [duration, setDuration] = useState('5 minutes')
  const [tone, setTone] = useState('Educational')
  const [targetAudience, setTargetAudience] = useState('')
  const [loading, setLoading] = useState(false)
  const [script, setScript] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // YouTube Studio se topic auto-fill
  useEffect(() => {
    const savedTopic = localStorage.getItem('script_topic')
    if (savedTopic) {
      setTopic(savedTopic)
      localStorage.removeItem('script_topic')
    }
  }, [])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setScript(null)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) throw new Error('Login zaroori hai')
      const accessToken = sessionData.session.access_token

      const response = await fetch('http://localhost:8000/api/ai/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          topic: topic.trim(),
          platform,
          duration,
          tone,
          target_audience: targetAudience || 'General audience'
        })
      })

      const rawText = await response.text()
      console.log('[Script] Raw:', rawText.slice(0, 200))

      if (!rawText || rawText.trim() === '') {
        throw new Error('Empty response from backend')
      }

      const parsed = JSON.parse(rawText)

      if (parsed.detail) {
        throw new Error(parsed.detail)
      }

      setScript(parsed)

    } catch (e) {
      console.error('[Script Error]', e)
      setError('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const getFullScript = () => {
    if (!script) return ''
    return `TITLE: ${script.title}

🪝 HOOK:
${script.hook}

📢 INTRO:
${script.intro}

${script.sections?.map((s, i) => `SECTION ${i + 1}: ${s.heading}
${s.script}
[Duration: ${s.duration}]`).join('\n\n')}

🎯 CTA:
${script.cta}

👋 OUTRO:
${script.outro}

#️⃣ HASHTAGS:
${script.hashtags?.map(h => '#' + h).join(' ')}

🖼️ THUMBNAIL IDEA:
${script.thumbnail_idea}

🎬 B-ROLL SUGGESTIONS:
${script.b_roll_suggestions?.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(getFullScript())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([getFullScript()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script-${topic.slice(0, 20).replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Script Studio 🎬</h1>
        <p className="text-gray-500 mt-1">AI se apni video ka complete script banao</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">📝 Script Details</h3>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. How to grow on YouTube in 2025"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              placeholder="e.g. Beginner content creators, age 18-30"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-all " +
                    (platform === p
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-red-300')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-all " +
                    (duration === d
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300')}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-all " +
                    (tone === t
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Script...
              </>
            ) : (
              '🎬 Generate Script'
            )}
          </button>
        </div>

        {/* Right — Script Output */}
        <div className="space-y-3">
          {!script && !loading && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center min-h-64">
              <div className="text-5xl mb-3">🎭</div>
              <p className="text-gray-400 font-medium">Script yahan dikhega</p>
              <p className="text-gray-300 text-sm mt-1">Topic enter karo aur Generate click karo</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center justify-center text-center min-h-64">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">AI script likh raha hai...</p>
              <p className="text-gray-400 text-sm mt-1">Thoda wait karo ⏳</p>
            </div>
          )}

          {script && (
            <div className="space-y-3">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyAll}
                  className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
                >
                  {copied ? '✅ Copied!' : '📋 Copy All'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  ⬇️ Download .txt
                </button>
                <button
                  onClick={() => { setScript(null); setTopic(''); setError('') }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  🔄 Reset
                </button>
              </div>

              {/* Title */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 p-4">
                <p className="text-xs font-semibold text-red-500 mb-1">VIDEO TITLE</p>
                <p className="font-bold text-gray-800 text-lg">{script.title}</p>
              </div>

              {/* Hook */}
              <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                <p className="text-xs font-semibold text-yellow-600 mb-1">🪝 HOOK (First 3-5 seconds)</p>
                <p className="text-sm text-gray-700 leading-relaxed">{script.hook}</p>
              </div>

              {/* Intro */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">📢 INTRO</p>
                <p className="text-sm text-gray-700 leading-relaxed">{script.intro}</p>
              </div>

              {/* Sections */}
              {script.sections?.map((section, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-blue-600">
                      SECTION {i + 1}: {section.heading}
                    </p>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {section.duration}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{section.script}</p>
                </div>
              ))}

              {/* CTA */}
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <p className="text-xs font-semibold text-green-600 mb-1">🎯 CALL TO ACTION</p>
                <p className="text-sm text-gray-700 leading-relaxed">{script.cta}</p>
              </div>

              {/* Outro */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">👋 OUTRO</p>
                <p className="text-sm text-gray-700 leading-relaxed">{script.outro}</p>
              </div>

              {/* Hashtags */}
              <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                <p className="text-xs font-semibold text-purple-600 mb-2">#️⃣ HASHTAGS</p>
                <div className="flex flex-wrap gap-2">
                  {script.hashtags?.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Thumbnail */}
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
                <p className="text-xs font-semibold text-orange-600 mb-1">🖼️ THUMBNAIL IDEA</p>
                <p className="text-sm text-gray-700">{script.thumbnail_idea}</p>
              </div>

              {/* B-Roll */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">🎬 B-ROLL SUGGESTIONS</p>
                <ul className="space-y-1">
                  {script.b_roll_suggestions?.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 font-bold">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}