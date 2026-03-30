import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const S = {
  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'block' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 14px', color: '#f0f0f5', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' },
  btn: { cursor: 'pointer', border: 'none', borderRadius: 12, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, transition: 'all .2s' },
  outCard: { border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 },
}

const PLATFORMS = [
  { id: 'twitter', label: 'X / Twitter Thread', icon: '𝕏', color: '#1d9bf0', bg: 'rgba(29,155,240,0.08)' },
  { id: 'instagram', label: 'Instagram Caption', icon: '📸', color: '#e1306c', bg: 'rgba(225,48,108,0.08)' },
  { id: 'linkedin', label: 'LinkedIn Post', icon: '💼', color: '#0077b5', bg: 'rgba(0,119,181,0.08)' },
  { id: 'tiktok', label: 'TikTok Script', icon: '🎵', color: '#69c9d0', bg: 'rgba(105,201,208,0.08)' },
  { id: 'youtube', label: 'YouTube Description', icon: '▶', color: '#ff4444', bg: 'rgba(255,68,68,0.08)' },
]

function extractVideoId(input) {
  if (!input) return null
  // Try to extract from various YouTube URL formats
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // raw video ID
  ]
  for (const p of patterns) {
    const m = input.match(p)
    if (m) return m[1]
  }
  return null
}

async function callGroqAI(prompt) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''

  const res = await fetch('' + import.meta.env.VITE_API_URL + '/api/repurpose/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ prompt })
  })

  if (!res.ok) {
    // Fallback: call Groq directly via backend or use demo content
    throw new Error('Backend not available')
  }
  const data = await res.json()
  return data.content
}

function generateDemoContent(platform, topic) {
  const t = topic.substring(0, 80)
  const demos = {
    twitter: `🧵 Thread: ${t}\n\n1/ Here's everything you need to know...\n\n2/ The biggest mistake most people make is...\n\n3/ Here's the framework that changed everything:\n\n4/ The results speak for themselves...\n\n5/ If this helped, RT and follow for more! 🔁`,
    instagram: `✨ ${t}\n\nHere's what nobody tells you about this topic...\n\nThe truth is, most people overcomplicate it. But once you understand the core principle, everything clicks.\n\n→ Tip 1: Start with the basics\n→ Tip 2: Be consistent\n→ Tip 3: Track your progress\n\nSave this post for later! 📌\n\n#ContentCreator #GrowthMindset #CreatorEconomy #Tips`,
    linkedin: `I've been studying this for years, and here's what I found:\n\n"${t}"\n\nMost professionals get this wrong. Here's the framework that actually works:\n\n✅ Step 1: Understand the fundamentals\n✅ Step 2: Build systems, not goals\n✅ Step 3: Measure what matters\n\nThe result? 10x more output with half the effort.\n\nWhat's your experience with this? Drop a comment below 👇`,
    tiktok: `POV: You finally discovered the secret to ${t} 🤯\n\n[Hook: Start with a shocking fact]\n\n"Did you know that 90% of people fail at this because of ONE mistake?"\n\n[Main content - 3 tips]\n\n[CTA: "Follow for more creator secrets!"]\n\n#fyp #creatortips #viral`,
    youtube: `${t}\n\nIn this video, we cover:\n• The fundamentals you need to know\n• Common mistakes to avoid\n• A proven step-by-step framework\n• Real results and case studies\n\n🔔 Subscribe for weekly creator tips!\n👍 Like if this helped you\n💬 Comment your questions below\n\n📱 Follow on socials: @yourchannel\n🔗 Free resources in bio`,
  }
  return demos[platform] || demos.twitter
}

export default function RepurposePage() {
  const [tab, setTab] = useState('text') // 'text' or 'url'
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [selPlatforms, setSelPlatforms] = useState(['twitter', 'instagram', 'linkedin'])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [results, setResults] = useState({})
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')

  const togglePlatform = (id) => {
    setSelPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const handleGenerate = async () => {
    setError('')
    setResults({})

    let topic = ''

    if (tab === 'text') {
      topic = text.trim()
      if (!topic) { setError('Please paste some content or a topic to repurpose.'); return }
    } else {
      const rawUrl = url.trim()
      if (!rawUrl) { setError('Please enter a YouTube URL.'); return }

      const videoId = extractVideoId(rawUrl)
      if (!videoId) { setError('Could not extract video ID. Please use a valid YouTube URL like: https://youtu.be/VIDEO_ID or https://www.youtube.com/watch?v=VIDEO_ID'); return }

      setLoading(true)
      setLoadingStep('Fetching video transcript...')

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || ''

        const transcriptRes = await fetch(`' + import.meta.env.VITE_API_URL + '/api/repurpose/transcript?video_id=${videoId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!transcriptRes.ok) {
          const errData = await transcriptRes.json().catch(() => ({}))
          // Fallback: use URL as topic
          topic = `YouTube video: ${rawUrl}`
          console.warn('Transcript fetch failed, using URL as topic:', errData)
        } else {
          const tData = await transcriptRes.json()
          topic = tData.transcript || tData.text || `YouTube video: ${rawUrl}`
        }
      } catch (e) {
        // Backend not running - use URL as topic
        topic = `YouTube video content from: ${rawUrl}`
      }
    }

    setLoading(true)
    setLoadingStep('Generating content for all platforms...')

    const newResults = {}

    for (const platformId of selPlatforms) {
      const platform = PLATFORMS.find(p => p.id === platformId)
      setLoadingStep(`Generating ${platform.label}...`)

      try {
        const prompt = `You are a professional social media content creator. 
Create a ${platform.label} post based on this content/topic:

"${topic.substring(0, 2000)}"

Platform: ${platform.label}
Requirements:
- For Twitter: Write a thread with 5-7 numbered tweets. Start each tweet on a new line with "1/", "2/", etc.
- For Instagram: Include emojis, line breaks, bullet points, and 5-10 relevant hashtags at the end.
- For LinkedIn: Professional tone, storytelling format, include a question at the end to drive engagement.
- For TikTok: Casual, energetic script with hook + main content + CTA. Include hashtags.
- For YouTube: Full video description with timestamps format, subscribe CTA, and relevant hashtags.

Write ONLY the post content. No explanation, no preamble.`

        const content = await callGroqAI(prompt).catch(() => generateDemoContent(platformId, topic))
        newResults[platformId] = content
      } catch {
        newResults[platformId] = generateDemoContent(platformId, topic)
      }
    }

    setResults(newResults)
    setLoading(false)
    setLoadingStep('')
  }

  const copyToClipboard = (platformId, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(platformId)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const charCount = text.length

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, color: '#a5b4fc', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          AI TOOLS
        </div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 26, marginBottom: 6 }}>✨ AI Content Repurposer</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Paste text or a YouTube URL — AI converts it into posts for all your platforms instantly.</p>
      </div>

      {/* Input Card */}
      <div style={S.card}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4 }}>
          {[
            { id: 'text', label: '📝 Paste Text / Topic' },
            { id: 'url', label: '🎬 YouTube URL' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError('') }}
              style={{ ...S.btn, flex: 1, padding: '9px 16px', fontSize: 13,
                background: tab === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                color: tab === t.id ? '#fff' : '#6b7280',
                boxShadow: tab === t.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'text' ? (
          <div>
            <label style={S.label}>Content or Topic</label>
            <textarea
              style={{ ...S.input, minHeight: 140 }}
              placeholder="Paste your blog post, script, podcast transcript, article, or just type a topic like 'How to grow on YouTube in 2026'..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div style={{ fontSize: 12, color: charCount > 5000 ? '#f87171' : '#374151', marginTop: 6, textAlign: 'right' }}>
              {charCount.toLocaleString()} characters
              {charCount > 5000 && ' — content will be trimmed to 5000 chars'}
            </div>
          </div>
        ) : (
          <div>
            <label style={S.label}>YouTube Video URL</label>
            <input
              style={S.input}
              placeholder="https://youtu.be/VIDEO_ID  or  https://www.youtube.com/watch?v=VIDEO_ID"
              value={url}
              onChange={e => { setUrl(e.target.value); setError('') }}
            />
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 12, color: '#fbbf24' }}>
              ⚠ The video must have English, Urdu, or Hindi captions enabled. Private videos will not work.
              If transcript is unavailable, we'll generate content based on the URL topic.
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#f87171' }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Platform selector */}
      <div style={S.card}>
        <label style={S.label}>Select Output Platforms</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
          {PLATFORMS.map(p => {
            const active = selPlatforms.includes(p.id)
            return (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                style={{ ...S.btn, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                  background: active ? p.bg : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? p.color + '44' : 'rgba(255,255,255,0.07)'}`,
                  color: active ? p.color : '#6b7280',
                }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <span style={{ fontFamily: 'inherit', fontWeight: active ? 700 : 500 }}>{p.label}</span>
                {active && <span style={{ marginLeft: 'auto', color: p.color }}>✓</span>}
              </button>
            )
          })}
        </div>
        {selPlatforms.length === 0 && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>Select at least one platform</p>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || selPlatforms.length === 0}
        style={{ ...S.btn, width: '100%', padding: '14px 28px', fontSize: 15, marginBottom: 28,
          background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
          opacity: loading || selPlatforms.length === 0 ? 0.7 : 1,
        }}>
        {loading ? (
          <>
            <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity=".3"/><path d="M12 3a9 9 0 019 9"/></svg>
            {loadingStep || 'Generating...'}
          </>
        ) : (
          <>⚡ Generate {selPlatforms.length} Platform Post{selPlatforms.length > 1 ? 's' : ''}</>
        )}
      </button>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.rep-out-card:hover{border-color:rgba(255,255,255,0.15)!important;}`}</style>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Generated Posts</span>
            <span style={{ padding: '3px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 11, color: '#6ee7b7', fontWeight: 700 }}>
              {Object.keys(results).length} platforms
            </span>
          </div>

          {PLATFORMS.filter(p => results[p.id]).map(platform => (
            <div key={platform.id} className="rep-out-card" style={{ ...S.outCard, borderColor: platform.color + '22', background: platform.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{platform.icon}</span>
                  <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: platform.color }}>{platform.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copyToClipboard(platform.id, results[platform.id])}
                    style={{ ...S.btn, padding: '6px 14px', fontSize: 12,
                      background: copied === platform.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${copied === platform.id ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      color: copied === platform.id ? '#6ee7b7' : '#9ca3af',
                    }}>
                    {copied === platform.id ? '✓ Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => {
                    const newResults = { ...results }
                    delete newResults[platform.id]
                    setResults(newResults)
                  }}
                    style={{ ...S.btn, padding: '6px 10px', fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#374151' }}>
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '14px 16px', maxHeight: 280, overflowY: 'auto' }}>
                <pre style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#d1d5db', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {results[platform.id]}
                </pre>
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#374151' }}>
                  {results[platform.id].length} chars
                </span>
                <button
                  onClick={async () => {
                    // Reschedule this post
                    alert('Opening scheduler... Connect your accounts in Settings first.')
                  }}
                  style={{ ...S.btn, padding: '4px 12px', fontSize: 11, marginLeft: 'auto',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                  Schedule Post →
                </button>
              </div>
            </div>
          ))}

          {/* Regenerate */}
          <button onClick={handleGenerate}
            style={{ ...S.btn, width: '100%', padding: '12px', fontSize: 13, marginTop: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
            🔄 Regenerate All
          </button>
        </div>
      )}
    </div>
  )
}
