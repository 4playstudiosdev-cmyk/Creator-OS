import { useState, useRef, useEffect } from 'react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const IC = {
  scissors: "M6 9l6 6M6 15l6-6M20 4l-8.5 8.5M20 20l-8.5-8.5",
  upload:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  dl:       "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  play:     "M5 3l14 9-14 9V3z",
  clock:    "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  check:    "M20 6L9 17l-5-5",
  close:    "M18 6L6 18M6 6l12 12",
  yt:       "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58a2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  lock:     "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  file:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
}

const Ico = ({ d, s = 15, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const CLIP_DURATIONS = [
  { value: 30,  label: '30s', tag: 'TikTok / Reels'  },
  { value: 60,  label: '60s', tag: 'YouTube Shorts'  },
  { value: 90,  label: '90s', tag: 'Long-form Reel'  },
]
const MAX_CLIPS_OPTIONS = [3, 5, 7, 10]

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const scoreStyle = score => {
  if (score >= 90) return { color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)'  }
  if (score >= 75) return { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
  return               { color: '#93c5fd', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)'  }
}

const CARD = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }
const INP  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '8px 11px', color: '#f0f0f5', fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }

const PROCESS_STEPS = [
  { label: 'Upload & save video',          pct: 15 },
  { label: 'Extract audio track',          pct: 35 },
  { label: 'Whisper AI transcription',     pct: 60 },
  { label: 'Groq AI detect best moments', pct: 80 },
  { label: 'Cut clips with FFmpeg',        pct: 95 },
]

export default function AutoClippingPage() {
  const fileInputRef = useRef(null)

  const [videoFile,   setVideoFile]   = useState(null)
  const [videoUrl,    setVideoUrl]    = useState(null)
  const [clipDur,     setClipDur]     = useState(60)
  const [maxClips,    setMaxClips]    = useState(5)
  const [aspect,      setAspect]      = useState('9:16')
  const [uploadMode,  setUploadMode]  = useState('manual')
  const [ytConnected, setYtConnected] = useState(false)
  const [userId,      setUserId]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [progress,    setProgress]    = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [error,       setError]       = useState('')
  const [results,     setResults]     = useState(null)
  const [downloading, setDownloading] = useState({})
  const [previewing,  setPreviewing]  = useState(null)
  const [clipMeta,    setClipMeta]    = useState({})
  const [uploading,   setUploading]   = useState({})
  const [uploadMsg,   setUploadMsg]   = useState({})

  useEffect(() => {
    import('../lib/supabaseClient').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        const uid = session.user.id
        setUserId(uid)
        fetch(`${API}/api/youtube/status/${uid}`)
          .then(r => r.json()).then(d => setYtConnected(d.connected)).catch(() => {})
      })
    })
  }, [])

  const loadFile = file => {
    if (!file || !file.type.startsWith('video/')) return
    setVideoFile(file); setVideoUrl(URL.createObjectURL(file))
    setResults(null); setError(''); setClipMeta({}); setUploading({}); setUploadMsg({})
  }

  const handleGenerate = async () => {
    if (!videoFile) return
    setLoading(true); setError(''); setResults(null); setProgress(5); setProgressMsg('Uploading video…')
    try {
      const fd = new FormData()
      fd.append('file', videoFile)
      fd.append('clip_duration', clipDur)
      fd.append('max_clips', maxClips)
      fd.append('aspect_ratio', aspect)

      let si = 0
      const iv = setInterval(() => {
        if (si < PROCESS_STEPS.length) {
          setProgress(PROCESS_STEPS[si].pct)
          setProgressMsg(PROCESS_STEPS[si].label)
          si++
        }
      }, 3200)

      const res = await fetch(`${API}/api/clipping/detect-clips`, { method: 'POST', body: fd })
      clearInterval(iv)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`)

      setProgress(100); setProgressMsg(`${data.total_clips} clips ready!`)
      const meta = {}
      data.clips.forEach(clip => {
        const tags = (clip.reason || '').split(' ').filter(w => w.length > 4).slice(0, 5).map(w => '#' + w.replace(/[^a-zA-Z0-9]/g, '')).join(' ')
        meta[clip.id] = {
          title: clip.title || `Short Clip ${clip.index}`,
          description: `${clip.hook || ''}\n\n${clip.reason || ''}\n\n#Shorts #YouTubeShorts #Viral`,
          hashtags: `#Shorts #YouTubeShorts #Viral #Trending ${tags}`,
          privacy: 'public',
        }
      })
      setClipMeta(meta)
      setTimeout(() => {
        setLoading(false); setResults(data)
        if (uploadMode === 'auto' && ytConnected) setTimeout(() => autoUploadAll(data.clips, meta), 800)
      }, 500)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  const downloadClip = async clip => {
    setDownloading(p => ({ ...p, [clip.id]: true }))
    try {
      const res = await fetch(`${API}${clip.download_url}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(clip.title || 'clip').replace(/\s+/g, '_')}_${clip.duration}s.mp4`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Download failed: ' + e.message) }
    finally { setDownloading(p => ({ ...p, [clip.id]: false })) }
  }

  const downloadAll = async () => {
    for (const clip of results.clips) {
      await downloadClip(clip)
      await new Promise(r => setTimeout(r, 800))
    }
  }

  const uploadToYouTube = async (clip, metaOverride) => {
    if (!ytConnected) { alert('Connect YouTube first in Settings!'); return }
    const m = (metaOverride && metaOverride[clip.id]) ? metaOverride[clip.id] : (clipMeta[clip.id] || {})
    setUploading(p => ({ ...p, [clip.id]: 'uploading' }))
    setUploadMsg(p => ({ ...p, [clip.id]: '📤 Uploading to YouTube…' }))
    try {
      const fd = new FormData()
      fd.append('filename',    clip.filename || '')
      fd.append('title',       m.title || clip.title || 'Short Clip')
      fd.append('description', m.description || '')
      fd.append('hashtags',    m.hashtags || '#Shorts')
      fd.append('privacy',     m.privacy || 'public')
      fd.append('user_id',     userId || '')
      const res = await fetch(`${API}/api/clipping/upload-youtube`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Upload failed ${res.status}`)
      setUploading(p => ({ ...p, [clip.id]: 'done' }))
      setUploadMsg(p => ({ ...p, [clip.id]: data.video_url ? `✅ ${data.video_url}` : '✅ Uploaded to YouTube Shorts!' }))
    } catch (e) {
      setUploading(p => ({ ...p, [clip.id]: 'error' }))
      setUploadMsg(p => ({ ...p, [clip.id]: '❌ ' + e.message }))
    }
  }

  const autoUploadAll = async (clips, meta) => {
    for (const clip of clips) {
      await uploadToYouTube(clip, meta)
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  const updateMeta = (id, key, val) => setClipMeta(p => ({ ...p, [id]: { ...p[id], [key]: val } }))

  // ─── UPLOAD SCREEN ────────────────────────────────────────────────────────
  if (!videoUrl && !loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', padding: '36px' }}>
      <style>{`.ac-drop:hover{border-color:rgba(99,102,241,0.55)!important;background:rgba(99,102,241,0.04)!important;} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
          <Ico d={IC.scissors} s={18} c="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 22, color: '#f0f0f5', lineHeight: 1 }}>Auto Clipping</h1>
          <p style={{ color: '#4b5563', fontSize: 12, marginTop: 2 }}>AI finds the best moments · Generates short clips · Auto-upload to YouTube</p>
        </div>
        <div style={{ flex: 1 }} />
        {ytConnected
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: 12, fontWeight: 700 }}><Ico d={IC.yt} s={13} c="#6ee7b7" />YouTube Connected</div>
          : <a href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}><Ico d={IC.yt} s={13} c="#f87171" />Connect YouTube → Settings</a>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          <div className="ac-drop"
            onDrop={e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]) }}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 24, padding: '80px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'all .25s', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico d={IC.upload} s={36} c="#6366f1" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: '#f0f0f5', marginBottom: 8 }}>Drop your long video here</p>
              <p style={{ color: '#4b5563', fontSize: 14 }}>MP4, MOV, AVI — podcast, interview, vlog, tutorial</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              {['🎙️ Whisper Transcription', '🤖 Groq AI Analysis', '✂️ Auto Clip Cutting', '📱 9:16 Portrait', '☁️ YouTube Upload'].map(f => (
                <span key={f} style={{ padding: '5px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 100, color: '#818cf8', fontSize: 12 }}>{f}</span>
              ))}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={e => loadFile(e.target.files[0])} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )

  // ─── SETTINGS SCREEN ─────────────────────────────────────────────────────
  if (videoUrl && !loading && !results && !error) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', padding: '32px 36px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap'); .acb{cursor:pointer;border:none;transition:all .15s;font-family:'DM Sans',sans-serif;}.acb:hover{filter:brightness(1.15);}.acb:disabled{opacity:.4;cursor:not-allowed;}.aci::placeholder{color:#374151;}.aci:focus{border-color:rgba(99,102,241,0.5)!important;}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico d={IC.scissors} s={18} c="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 20, color: '#f0f0f5', lineHeight: 1 }}>Configure Clips</h1>
          <p style={{ color: '#4b5563', fontSize: 12, marginTop: 2 }}>Set your preferences before generating</p>
        </div>
        <div style={{ flex: 1 }} />
        <button className="acb" onClick={() => { setVideoFile(null); setVideoUrl(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', borderRadius: 10, background: 'rgba(255,255,255,0.03)', fontSize: 12 }}>
          <Ico d={IC.close} s={13} c="#6b7280" /> Change Video
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Video Preview</p>
          <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
            <video src={videoUrl} controls style={{ width: '100%', maxHeight: 320, display: 'block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
            <Ico d={IC.file} s={13} c="#4b5563" />
            <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#9ca3af' }}>{videoFile?.name}</span>
            <span style={{ color: '#374151', fontSize: 11, flexShrink: 0 }}>{(videoFile?.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Upload Mode */}
          <div style={{ ...CARD, padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>Upload Mode</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'manual', label: 'Manual Download', sub: 'Download & share yourself', icon: IC.dl },
                { id: 'auto',   label: 'Auto YouTube',    sub: ytConnected ? 'Auto-upload to Shorts' : 'Connect YouTube first', icon: ytConnected ? IC.yt : IC.lock },
              ].map(m => (
                <button key={m.id} className="acb"
                  onClick={() => { if (m.id === 'auto' && !ytConnected) { window.location.href = '/settings'; return } setUploadMode(m.id) }}
                  style={{ padding: 14, borderRadius: 12, textAlign: 'left', position: 'relative', background: uploadMode === m.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${uploadMode === m.id ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`, opacity: m.id === 'auto' && !ytConnected ? 0.55 : 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: uploadMode === m.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ico d={m.icon} s={13} c={uploadMode === m.id ? '#a5b4fc' : '#4b5563'} />
                  </div>
                  <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: uploadMode === m.id ? '#a5b4fc' : '#6b7280', marginBottom: 2 }}>{m.label}</p>
                  <p style={{ fontSize: 10, color: '#374151' }}>{m.sub}</p>
                  {uploadMode === m.id && <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={IC.check} s={9} c="#fff" /></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div style={{ ...CARD, padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>Output Format</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ val: '9:16', label: '9:16', sub: 'Shorts · Reels · TikTok' }, { val: '16:9', label: '16:9', sub: 'YouTube · Standard' }].map(f => (
                <button key={f.val} className="acb" onClick={() => setAspect(f.val)}
                  style={{ padding: '14px 10px', borderRadius: 12, textAlign: 'center', background: aspect === f.val ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${aspect === f.val ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`, color: aspect === f.val ? '#a5b4fc' : '#6b7280' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 20, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 10 }}>{f.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ ...CARD, padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>Clip Duration</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {CLIP_DURATIONS.map(d => (
                <button key={d.value} className="acb" onClick={() => setClipDur(d.value)}
                  style={{ padding: '12px 8px', borderRadius: 12, textAlign: 'center', background: clipDur === d.value ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${clipDur === d.value ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`, color: clipDur === d.value ? '#a5b4fc' : '#6b7280' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 20 }}>{d.label}</div>
                  <div style={{ fontSize: 9, marginTop: 3 }}>{d.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Max clips */}
          <div style={{ ...CARD, padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>Number of Clips</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {MAX_CLIPS_OPTIONS.map(n => (
                <button key={n} className="acb" onClick={() => setMaxClips(n)}
                  style={{ padding: '12px 0', borderRadius: 12, textAlign: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 22, background: maxClips === n ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${maxClips === n ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.07)'}`, color: maxClips === n ? '#a5b4fc' : '#6b7280' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button className="acb" onClick={handleGenerate}
            style={{ width: '100%', padding: '15px 0', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 16, fontSize: 15, fontWeight: 700, fontFamily: 'Syne,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
            <Ico d={IC.scissors} s={18} c="#fff" />
            {uploadMode === 'auto' && ytConnected ? 'Generate & Upload to YouTube' : 'Generate Clips'}
          </button>
        </div>
      </div>
    </div>
  )

  // ─── LOADING SCREEN ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap');`}</style>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, margin: '0 auto 28px', position: 'relative' }}>
          <svg style={{ width: 88, height: 88, animation: 'spin 1.4s linear infinite' }} viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="44" cy="44" r="36" fill="none" stroke="url(#acGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="70 155" />
            <defs><linearGradient id="acGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico d={IC.scissors} s={26} c="#6366f1" />
          </div>
        </div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Processing Video</h2>
        <p style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: 28, fontSize: 14 }}>{progressMsg}</p>
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6, marginBottom: 8 }}>
          <div style={{ height: 6, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 99, transition: 'width .7s ease', width: `${progress}%` }} />
        </div>
        <p style={{ color: '#374151', fontSize: 12, marginBottom: 32 }}>{progress}% complete</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
          {PROCESS_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 10, background: progress >= step.pct ? 'rgba(99,102,241,0.07)' : 'transparent', transition: 'background .4s' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: progress >= step.pct ? '#6366f1' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .4s' }}>
                {progress >= step.pct ? <Ico d={IC.check} s={10} c="#fff" /> : <div style={{ width: 6, height: 6, background: '#1f2937', borderRadius: '50%' }} />}
              </div>
              <span style={{ fontSize: 13, color: progress >= step.pct ? '#a5b4fc' : '#374151', transition: 'color .4s' }}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ─── ERROR SCREEN ─────────────────────────────────────────────────────────
  if (error && !loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ ...CARD, padding: 48, textAlign: 'center', maxWidth: 440, width: '100%' }}>
        <div style={{ width: 52, height: 52, background: 'rgba(239,68,68,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Ico d={IC.close} s={22} c="#f87171" />
        </div>
        <h3 style={{ color: '#f87171', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Clipping Failed</h3>
        <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
        <button onClick={() => setError('')} style={{ padding: '10px 28px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          Try Again
        </button>
      </div>
    </div>
  )

  // ─── RESULTS SCREEN ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans',sans-serif", color: '#f0f0f5', padding: '32px 36px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap'); .acb{cursor:pointer;border:none;transition:all .15s;font-family:'DM Sans',sans-serif;}.acb:hover{filter:brightness(1.15);}.acb:disabled{opacity:.4;cursor:not-allowed;}.aci::placeholder{color:#374151;}.aci:focus{border-color:rgba(99,102,241,0.5)!important;}.ac-scroll::-webkit-scrollbar{width:3px;}.ac-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px;}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico d={IC.scissors} s={18} c="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 20, lineHeight: 1 }}>🔥 {results.total_clips} Clips Generated</h1>
            <p style={{ color: '#4b5563', fontSize: 12, marginTop: 3 }}>
              Original: {fmt(results.video_duration)} · Each clip: {results.clip_duration}s · {aspect}
              {uploadMode === 'auto' && ytConnected && <span style={{ color: '#a5b4fc', marginLeft: 8 }}>· Auto-uploading…</span>}
            </p>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="acb" onClick={() => { setResults(null); setVideoFile(null); setVideoUrl(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', borderRadius: 10, background: 'rgba(255,255,255,0.03)', fontSize: 12 }}>
            <Ico d={IC.refresh} s={13} c="#6b7280" /> New Video
          </button>
          {!ytConnected && (
            <a href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <Ico d={IC.yt} s={13} c="#f87171" />Connect YouTube
            </a>
          )}
          <button className="acb" onClick={downloadAll}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 3px 12px rgba(99,102,241,0.35)' }}>
            <Ico d={IC.dl} s={14} c="#fff" /> Download All
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {results.clips.sort((a, b) => b.engagement_score - a.engagement_score).map((clip, i) => {
          const meta  = clipMeta[clip.id] || {}
          const upSt  = uploading[clip.id] || 'idle'
          const upMsg = uploadMsg[clip.id] || ''
          const sc    = scoreStyle(clip.engagement_score)
          return (
            <div key={clip.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#000', position: 'relative', cursor: 'pointer', aspectRatio: aspect === '9:16' ? '9/16' : '16/9', maxHeight: aspect === '9:16' ? 260 : 190 }}
                onClick={() => setPreviewing(previewing === clip.id ? null : clip.id)}>
                <video
                  src={`${API}${clip.download_url}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: previewing === clip.id ? 'block' : 'none' }}
                  controls autoPlay={previewing === clip.id} />
                {previewing !== clip.id && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                    <div style={{ width: 52, height: 52, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)' }}>
                      <Ico d={IC.play} s={18} c="#fff" />
                    </div>
                    <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 7, fontFamily: 'monospace' }}>{clip.duration}s</span>
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.65)', color: '#a5b4fc', fontSize: 10, padding: '3px 8px', borderRadius: 7, fontFamily: 'Syne,sans-serif', fontWeight: 800 }}>#{i + 1}</span>
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 8, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>{clip.engagement_score}%</span>
                  </div>
                )}
              </div>

              <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {clip.hook && (
                  <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9, padding: '7px 11px' }}>
                    <p style={{ fontSize: 11, color: '#a5b4fc', lineHeight: 1.6 }}>🎣 <span style={{ fontWeight: 700 }}>Hook:</span> {clip.hook}</p>
                  </div>
                )}

                {[
                  { label: 'Title',       key: 'title',       type: 'input',    ph: 'YouTube title…' },
                  { label: 'Description', key: 'description', type: 'textarea', ph: 'Description…', rows: 2 },
                  { label: 'Hashtags',    key: 'hashtags',    type: 'input',    ph: '#Shorts #Viral…' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>{f.label}</label>
                    {f.type === 'textarea'
                      ? <textarea value={meta[f.key] || ''} onChange={e => updateMeta(clip.id, f.key, e.target.value)} rows={f.rows} placeholder={f.ph} className="aci" style={{ ...INP, resize: 'none' }} />
                      : <input value={meta[f.key] || ''} onChange={e => updateMeta(clip.id, f.key, e.target.value)} placeholder={f.ph} className="aci" style={INP} />
                    }
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Privacy</label>
                  <select value={meta.privacy || 'public'} onChange={e => updateMeta(clip.id, 'privacy', e.target.value)} className="aci" style={{ ...INP, cursor: 'pointer' }}>
                    <option value="public"   style={{ background: '#0d0d14' }}>🌍 Public</option>
                    <option value="unlisted" style={{ background: '#0d0d14' }}>🔗 Unlisted</option>
                    <option value="private"  style={{ background: '#0d0d14' }}>🔒 Private</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>
                  <Ico d={IC.clock} s={10} c="#374151" />
                  {fmt(clip.start_time)} → {fmt(clip.end_time)}
                  <span style={{ marginLeft: 'auto' }}>{clip.file_size_mb} MB</span>
                </div>

                {upMsg && (
                  <div style={{ padding: '7px 11px', borderRadius: 9, fontSize: 11, fontWeight: 600, background: upSt === 'done' ? 'rgba(16,185,129,0.1)' : upSt === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${upSt === 'done' ? 'rgba(16,185,129,0.3)' : upSt === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`, color: upSt === 'done' ? '#6ee7b7' : upSt === 'error' ? '#f87171' : '#a5b4fc' }}>
                    {upSt === 'uploading' && <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(165,180,252,0.3)', borderTopColor: '#a5b4fc', borderRadius: '50%', animation: 'spin .8s linear infinite', marginRight: 6 }} />}
                    {upMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button className="acb" onClick={() => downloadClip(clip)} disabled={downloading[clip.id]}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', borderRadius: 10, fontSize: 12 }}>
                    {downloading[clip.id]
                      ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(156,163,175,0.3)', borderTopColor: '#9ca3af', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />…</>
                      : <><Ico d={IC.dl} s={12} c="#9ca3af" />Download</>}
                  </button>
                  <button className="acb" onClick={() => uploadToYouTube(clip, clipMeta)} disabled={!ytConnected || upSt === 'uploading' || upSt === 'done'}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, background: !ytConnected ? 'rgba(255,255,255,0.03)' : upSt === 'done' ? 'rgba(16,185,129,0.12)' : upSt === 'uploading' ? 'rgba(99,102,241,0.15)' : '#6366f1', border: !ytConnected ? '1px solid rgba(255,255,255,0.07)' : upSt === 'done' ? '1px solid rgba(16,185,129,0.3)' : 'none', color: !ytConnected ? '#374151' : upSt === 'done' ? '#6ee7b7' : '#fff' }}>
                    {upSt === 'uploading' ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Uploading…</>
                      : upSt === 'done' ? <><Ico d={IC.check} s={12} c="#6ee7b7" />Uploaded!</>
                      : !ytConnected ? <><Ico d={IC.lock} s={12} c="#374151" />Connect YT</>
                      : <><Ico d={IC.yt} s={12} c="#fff" />Upload YT</>}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {results.full_transcript && (
        <div style={{ ...CARD, padding: 20, marginTop: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Transcript Preview</p>
          <p style={{ color: '#4b5563', fontSize: 13, lineHeight: 1.7 }}>{results.full_transcript.slice(0, 300)}…</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 28 }}>
        <button className="acb" onClick={() => setResults(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', borderRadius: 14, fontSize: 13, background: 'transparent' }}>
          <Ico d={IC.refresh} s={14} c="#6b7280" /> Change Settings & Re-generate
        </button>
      </div>
    </div>
  )
}