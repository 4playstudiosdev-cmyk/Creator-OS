import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const PLATFORMS = ['YouTube', 'Instagram Reels', 'TikTok', 'YouTube Shorts']
const DURATIONS = ['30 seconds', '60 seconds', '3 minutes', '5 minutes', '10 minutes', '15+ minutes']
const TONES     = ['Educational', 'Entertaining', 'Motivational', 'Storytelling', 'Promotional']

const PLATFORM_COLORS = {
  YouTube:          { bg: 'rgba(255,0,0,0.15)',     border: 'rgba(255,80,80,0.4)',   color: '#f87171' },
  'Instagram Reels':{ bg: 'rgba(217,70,239,0.15)',  border: 'rgba(217,70,239,0.4)', color: '#e879f9' },
  TikTok:           { bg: 'rgba(255,255,255,0.1)',   border: 'rgba(255,255,255,0.3)',color: '#f0f0f5' },
  'YouTube Shorts': { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)', color: '#fca5a5' },
}
const DURATION_COLOR = { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', color: '#93c5fd' }
const TONE_COLOR     = { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', color: '#c4b5fd' }

const chip = (active, colors) => ({
  padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', border: 'none', fontFamily: "'Syne',sans-serif",
  transition: 'all 0.18s',
  ...(active
    ? { background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color }
    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#4b5563' }),
})

const sectionCard = (accent) => ({
  background: 'rgba(255,255,255,0.02)', border: `1px solid ${accent || 'rgba(255,255,255,0.07)'}`,
  borderRadius: 14, padding: '14px 16px', marginBottom: 10,
})

export default function ScriptStudioPage() {
  const [topic, setTopic]               = useState('')
  const [platform, setPlatform]         = useState('YouTube')
  const [duration, setDuration]         = useState('5 minutes')
  const [tone, setTone]                 = useState('Educational')
  const [targetAudience, setTargetAudience] = useState('')
  const [loading, setLoading]           = useState(false)
  const [script, setScript]             = useState(null)
  const [copied, setCopied]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('script_topic')
    if (saved) { setTopic(saved); localStorage.removeItem('script_topic') }
  }, [])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true); setScript(null); setError('')
    try {
      const { data: sd } = await supabase.auth.getSession()
      if (!sd.session) throw new Error('Login zaroori hai')
      const res = await fetch('' + import.meta.env.VITE_API_URL + '/api/ai/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sd.session.access_token}` },
        body: JSON.stringify({ topic: topic.trim(), platform, duration, tone, target_audience: targetAudience || 'General audience' }),
      })
      const raw = await res.text()
      const parsed = JSON.parse(raw)
      if (parsed.detail) throw new Error(parsed.detail)
      setScript(parsed)
    } catch (e) { setError('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  const getFullScript = () => {
    if (!script) return ''
    return `TITLE: ${script.title}\n\n🪝 HOOK:\n${script.hook}\n\n📢 INTRO:\n${script.intro}\n\n${script.sections?.map((s,i)=>`SECTION ${i+1}: ${s.heading}\n${s.script}\n[Duration: ${s.duration}]`).join('\n\n')}\n\n🎯 CTA:\n${script.cta}\n\n👋 OUTRO:\n${script.outro}\n\n#️⃣ HASHTAGS:\n${script.hashtags?.map(h=>'#'+h).join(' ')}\n\n🖼️ THUMBNAIL IDEA:\n${script.thumbnail_idea}\n\n🎬 B-ROLL:\n${script.b_roll_suggestions?.map((s,i)=>`${i+1}. ${s}`).join('\n')}`
  }

  const handleCopyAll = () => { navigator.clipboard.writeText(getFullScript()); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([getFullScript()],{type:'text/plain'}))
    a.download = `script-${topic.slice(0,20).replace(/\s+/g,'-')}.txt`
    a.click()
  }

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0;transform:translateY(14px) } to { opacity:1;transform:translateY(0) } }
        .script-input {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 11px 14px; color: #f0f0f5; font-family: 'DM Sans',sans-serif;
          font-size: 13px; outline: none; transition: border-color 0.2s;
          box-sizing: border-box; color-scheme: dark;
        }
        .script-input:focus { border-color: rgba(99,102,241,0.5); }
        .script-input::placeholder { color: #374151; }
        .fade-card { animation: fadeUp 0.35s ease both; }
        .action-btn { cursor: pointer; border: none; transition: all 0.18s; font-family: 'Syne',sans-serif; font-weight: 700; }
        .action-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>AI Tools</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne', letterSpacing: '-0.5px', marginBottom: 4 }}>Script Studio 🎬</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>AI se apni video ka complete script banao</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Input Panel ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 22 }}>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, marginBottom: 18, color: '#f0f0f5' }}>📝 Script Details</p>

          {/* Topic */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Video Topic *</label>
            <input className="script-input" type="text" value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleGenerate()} placeholder="e.g. How to grow on YouTube in 2025" />
          </div>

          {/* Target Audience */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Target Audience</label>
            <input className="script-input" type="text" value={targetAudience} onChange={e=>setTargetAudience(e.target.value)} placeholder="e.g. Beginner creators, age 18-30" />
          </div>

          {/* Platform */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Platform</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PLATFORMS.map(p => (
                <button key={p} onClick={()=>setPlatform(p)} style={chip(platform===p, PLATFORM_COLORS[p]||PLATFORM_COLORS.YouTube)}>{p}</button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Video Duration</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DURATIONS.map(d => (
                <button key={d} onClick={()=>setDuration(d)} style={chip(duration===d, DURATION_COLOR)}>{d}</button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Tone</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TONES.map(t => (
                <button key={t} onClick={()=>setTone(t)} style={chip(tone===t, TONE_COLOR)}>{t}</button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fca5a5', marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* Generate Btn */}
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #ec4899)',
              color: '#fff', fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
              cursor: topic.trim() && !loading ? 'pointer' : 'not-allowed',
              opacity: topic.trim() && !loading ? 1 : 0.45,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/> Generating Script...</>
              : '🎬 Generate Script'}
          </button>
        </div>

        {/* ── Right: Output ── */}
        <div>
          {/* Empty state */}
          {!script && !loading && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'2px dashed rgba(255,255,255,0.06)', borderRadius:20, padding:'60px 24px', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎭</div>
              <p style={{ fontFamily:'Syne', fontWeight:700, fontSize:16, marginBottom:6 }}>Script yahan dikhega</p>
              <p style={{ fontSize:13, color:'#4b5563' }}>Topic enter karo aur Generate click karo</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'60px 24px', textAlign:'center' }}>
              <div style={{ width:48,height:48,border:'4px solid rgba(239,68,68,0.2)',borderTopColor:'#ef4444',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px' }} />
              <p style={{ fontFamily:'Syne', fontWeight:700, fontSize:15 }}>AI script likh raha hai...</p>
              <p style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Thoda wait karo ⏳</p>
            </div>
          )}

          {/* Script Output */}
          {script && (
            <div className="fade-card">
              {/* Action Buttons */}
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <button className="action-btn" onClick={handleCopyAll} style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#f0f0f5', fontSize:13 }}>
                  {copied ? '✅ Copied!' : '📋 Copy All'}
                </button>
                <button className="action-btn" onClick={handleDownload} style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.35)', color:'#93c5fd', fontSize:13 }}>
                  ⬇️ Download .txt
                </button>
                <button className="action-btn" onClick={()=>{setScript(null);setTopic('');setError('')}} style={{ padding:'10px 16px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#6b7280', fontSize:13 }}>
                  🔄 Reset
                </button>
              </div>

              {/* Title */}
              <div style={{ ...sectionCard('rgba(239,68,68,0.25)'), background:'rgba(239,68,68,0.07)', marginBottom:10 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>VIDEO TITLE</p>
                <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:17, color:'#f0f0f5', lineHeight:1.4 }}>{script.title}</p>
              </div>

              {/* Hook */}
              <div style={{ ...sectionCard('rgba(245,158,11,0.3)'), background:'rgba(245,158,11,0.07)' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#fbbf24', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>🪝 Hook (First 3-5 seconds)</p>
                <p style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7 }}>{script.hook}</p>
              </div>

              {/* Intro */}
              <div style={sectionCard()}>
                <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>📢 Intro</p>
                <p style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7 }}>{script.intro}</p>
              </div>

              {/* Sections */}
              {script.sections?.map((s, i) => (
                <div key={i} style={{ ...sectionCard('rgba(59,130,246,0.25)'), background:'rgba(59,130,246,0.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#93c5fd', textTransform:'uppercase', letterSpacing:1 }}>Section {i+1}: {s.heading}</p>
                    <span style={{ fontSize:10, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#93c5fd', padding:'2px 8px', borderRadius:100 }}>{s.duration}</span>
                  </div>
                  <p style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7 }}>{s.script}</p>
                </div>
              ))}

              {/* CTA */}
              <div style={{ ...sectionCard('rgba(16,185,129,0.3)'), background:'rgba(16,185,129,0.06)' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#6ee7b7', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>🎯 Call to Action</p>
                <p style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7 }}>{script.cta}</p>
              </div>

              {/* Outro */}
              <div style={sectionCard()}>
                <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>👋 Outro</p>
                <p style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7 }}>{script.outro}</p>
              </div>

              {/* Hashtags */}
              <div style={{ ...sectionCard('rgba(139,92,246,0.3)'), background:'rgba(139,92,246,0.06)' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#c4b5fd', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>#️⃣ Hashtags</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {script.hashtags?.map((tag,i) => (
                    <span key={i} style={{ padding:'4px 10px', background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)', color:'#c4b5fd', borderRadius:100, fontSize:11, fontWeight:600 }}>#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Thumbnail */}
              <div style={{ ...sectionCard('rgba(249,115,22,0.3)'), background:'rgba(249,115,22,0.06)' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#fdba74', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>🖼️ Thumbnail Idea</p>
                <p style={{ fontSize:13, color:'#d1d5db', lineHeight:1.7 }}>{script.thumbnail_idea}</p>
              </div>

              {/* B-Roll */}
              <div style={sectionCard()}>
                <p style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>🎬 B-Roll Suggestions</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {script.b_roll_suggestions?.map((s,i) => (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'#4b5563', minWidth:18 }}>{i+1}.</span>
                      <span style={{ fontSize:13, color:'#9ca3af', lineHeight:1.6 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
