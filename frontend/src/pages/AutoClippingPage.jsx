import { useState, useRef, useEffect } from 'react'

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Ic = {
  scissors: "M6 9l6 6M6 15l6-6M20 4l-8.5 8.5M20 20l-8.5-8.5",
  upload:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  dl:       "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  play:     "M5 3l14 9-14 9V3z",
  fire:     "M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9zM9 17c0 1.66 1.34 3 3 3s3-1.34 3-3",
  clock:    "M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  check:    "M20 6L9 17l-5-5",
  close:    "M18 6L6 18M6 6l12 12",
  info:     "M12 22a10 10 0 100-20 10 10 0 000 20zM12 8h.01M11 12h1v4h1",
  yt:       "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58a2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  lock:     "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  auto:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  manual:   "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
}

const SVG = ({ d, size = 16, cls = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
    <path d={d} />
  </svg>
)

const CLIP_DURATIONS = [
  { value: 30,  label: '30s',  tag: 'TikTok / Reels' },
  { value: 60,  label: '60s',  tag: 'YouTube Shorts' },
  { value: 90,  label: '90s',  tag: 'Long Reel' },
]
const MAX_CLIPS_OPTIONS = [3, 5, 7, 10]
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const scoreColor = (score) => {
  if (score >= 90) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
  if (score >= 75) return 'text-amber-400 bg-amber-400/10 border-amber-400/30'
  return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AutoClippingPage() {
  const fileInputRef = useRef(null)

  // video
  const [videoFile,    setVideoFile]    = useState(null)
  const [videoUrl,     setVideoUrl]     = useState(null)

  // settings
  const [clipDuration, setClipDuration] = useState(60)
  const [maxClips,     setMaxClips]     = useState(5)
  const [aspectRatio,  setAspectRatio]  = useState('9:16')

  // upload mode
  const [uploadMode,   setUploadMode]   = useState('manual') // 'manual' | 'auto'
  const [ytConnected,  setYtConnected]  = useState(false)

  // processing
  const [loading,      setLoading]      = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [progressMsg,  setProgressMsg]  = useState('')
  const [error,        setError]        = useState('')

  // results
  const [results,      setResults]      = useState(null)
  const [downloading,  setDownloading]  = useState({})
  const [previewing,   setPreviewing]   = useState(null)

  // per-clip YouTube metadata (editable)
  const [clipMeta,     setClipMeta]     = useState({}) // { [clip.id]: { title, description, hashtags, privacy } }

  // per-clip upload state
  const [uploading,    setUploading]    = useState({}) // { [clip.id]: 'idle'|'uploading'|'done'|'error' }
  const [uploadMsg,    setUploadMsg]    = useState({}) // { [clip.id]: message }

  // Check YouTube connection from backend
  useEffect(() => {
    fetch('http://localhost:8000/api/clipping/youtube-status')
      .then(r => r.json())
      .then(d => setYtConnected(d.connected))
      .catch(() => setYtConnected(false))
  }, [])

  // ── LOAD VIDEO ──────────────────────────────────────────────────────────
  const loadFile = (file) => {
    if (!file || !file.type.startsWith('video/')) return
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setResults(null)
    setError('')
    setClipMeta({})
    setUploading({})
    setUploadMsg({})
  }

  // ── GENERATE CLIPS ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!videoFile) return
    setLoading(true); setError(''); setResults(null)
    setProgress(5); setProgressMsg('Uploading video...')

    try {
      const fd = new FormData()
      fd.append('file', videoFile)
      fd.append('clip_duration', clipDuration)
      fd.append('max_clips', maxClips)
      fd.append('aspect_ratio', aspectRatio)

      const stages = [
        { pct: 15, msg: 'Extracting audio...' },
        { pct: 35, msg: 'Transcribing with Whisper AI...' },
        { pct: 60, msg: 'Groq AI analyzing best moments...' },
        { pct: 80, msg: 'Cutting clips with ffmpeg...' },
        { pct: 95, msg: 'Finalizing clips...' },
      ]
      let stageIdx = 0
      const iv = setInterval(() => {
        if (stageIdx < stages.length) {
          setProgress(stages[stageIdx].pct)
          setProgressMsg(stages[stageIdx].msg)
          stageIdx++
        }
      }, 3500)

      const res = await fetch('http://localhost:8000/api/clipping/detect-clips', { method: 'POST', body: fd })
      clearInterval(iv)

      let data
      try { data = JSON.parse(await res.text()) } catch { throw new Error('Server response parse nahi hua') }
      if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`)

      setProgress(100)
      setProgressMsg(`${data.total_clips} clips ready!`)

      // Pre-fill YouTube metadata from AI suggestions
      const meta = {}
      data.clips.forEach(clip => {
        const tags = (clip.reason || '').split(' ')
          .filter(w => w.length > 4)
          .slice(0, 5)
          .map(w => '#' + w.replace(/[^a-zA-Z0-9]/g, ''))
          .join(' ')

        meta[clip.id] = {
          title:       clip.title || `Short Clip ${clip.index}`,
          description: `${clip.hook || ''}\n\n${clip.reason || ''}\n\n#Shorts #YouTubeShorts #Viral`,
          hashtags:    `#Shorts #YouTubeShorts #Viral #Trending ${tags}`,
          privacy:     'public',
        }
      })
      setClipMeta(meta)

      setTimeout(() => {
        setLoading(false)
        setResults(data)
        // Auto upload if mode is auto and YT connected
        if (uploadMode === 'auto' && ytConnected) {
          setTimeout(() => autoUploadAll(data.clips, meta), 800)
        }
      }, 600)

    } catch (e) {
      console.error('[Clipping]', e)
      setError(e.message)
      setLoading(false)
    }
  }

  // ── DOWNLOAD CLIP ──────────────────────────────────────────────────────
  const downloadClip = async (clip) => {
    setDownloading(prev => ({ ...prev, [clip.id]: true }))
    try {
      const res  = await fetch(`http://localhost:8000${clip.download_url}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${clip.title.replace(/\s+/g, '_')}_${clip.duration}s.mp4`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Download failed: ' + e.message)
    } finally {
      setDownloading(prev => ({ ...prev, [clip.id]: false }))
    }
  }

  const downloadAll = async () => {
    for (const clip of results.clips) {
      await downloadClip(clip)
      await new Promise(r => setTimeout(r, 800))
    }
  }

  // ── YOUTUBE UPLOAD via BACKEND (ClipPulse style — no token needed) ──────
  const uploadToYouTube = async (clip, meta) => {
    if (!ytConnected) { alert('YouTube connect karo pehle — "Connect YouTube" button dabao!'); return }

    const m = (typeof meta === 'object' && meta[clip.id]) ? meta[clip.id] : (clipMeta[clip.id] || {})

    setUploading(prev => ({ ...prev, [clip.id]: 'uploading' }))
    setUploadMsg(prev => ({ ...prev, [clip.id]: '📤 Uploading to YouTube...' }))

    try {
      const fd = new FormData()
      fd.append('filename',    clip.filename)
      fd.append('title',       m.title       || clip.title || 'Short Clip')
      fd.append('description', m.description || clip.reason || '')
      fd.append('hashtags',    m.hashtags    || '#Shorts #YouTubeShorts')
      fd.append('privacy',     m.privacy     || 'public')
      // NO access_token — backend uses stored googleapiclient service (ClipPulse pattern)

      const res = await fetch('http://localhost:8000/api/clipping/upload-youtube', {
        method: 'POST',
        body: fd,
      })

      let data
      try { data = JSON.parse(await res.text()) } catch { throw new Error('Response parse error') }
      if (!res.ok) throw new Error(data.detail || `Upload failed ${res.status}`)

      setUploading(prev => ({ ...prev, [clip.id]: 'done' }))
      setUploadMsg(prev => ({
        ...prev,
        [clip.id]: data.video_url ? `✅ ${data.video_url}` : '✅ Uploaded to YouTube Shorts!'
      }))

    } catch (e) {
      console.error('[YT Upload]', e)
      setUploading(prev => ({ ...prev, [clip.id]: 'error' }))
      setUploadMsg(prev => ({ ...prev, [clip.id]: '❌ ' + e.message }))
    }
  }

  // YouTube connect is done from Settings page — single connect point

  // ── AUTO UPLOAD ALL ─────────────────────────────────────────────────────
  const autoUploadAll = async (clips, meta) => {
    for (const clip of clips) {
      await uploadToYouTube(clip, meta)
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // ── META UPDATE HELPER ──────────────────────────────────────────────────
  const updateMeta = (clipId, key, value) => {
    setClipMeta(prev => ({ ...prev, [clipId]: { ...prev[clipId], [key]: value } }))
  }

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* HEADER */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <SVG d={Ic.scissors} size={15} cls="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm">Auto Clipping</span>
            <span className="text-gray-500 text-xs ml-2">AI-powered short clips</span>
          </div>
          <div className="flex-1" />
          {/* YT status — connect from Settings */}
          {ytConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-red-500/10 border-red-500/30 text-red-400">
              <SVG d={Ic.yt} size={12} />YouTube Connected
            </div>
          ) : (
            <a href="/settings#social"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-gray-800 border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all animate-pulse">
              <SVG d={Ic.yt} size={12} />Connect YouTube →Settings
            </a>
          )}
          {results && (
            <button onClick={() => { setResults(null); setVideoFile(null); setVideoUrl(null) }}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-all">
              <SVG d={Ic.refresh} size={13} />
              New Video
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── UPLOAD ZONE ── */}
        {!videoUrl && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold mb-6">
                <SVG d={Ic.zap} size={12} />AI-POWERED
              </div>
              <h1 className="text-4xl font-black mb-3 leading-tight">
                Long Video →{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Viral Clips</span>
              </h1>
              <p className="text-gray-400 text-lg">Upload karo, AI best moments dhundega, ready-to-post shorts milenge</p>
            </div>
            <div onDrop={e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-3xl p-14 flex flex-col items-center gap-5 transition-all duration-300 hover:bg-orange-500/5">
              <div className="w-20 h-20 bg-gray-800 group-hover:bg-orange-500/20 rounded-2xl flex items-center justify-center transition-all">
                <SVG d={Ic.upload} size={32} cls="text-gray-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-1">Drop your long video here</p>
                <p className="text-gray-500 text-sm">MP4, MOV, AVI — podcast, interview, vlog, tutorial</p>
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={e => loadFile(e.target.files[0])} className="hidden" />
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {videoUrl && !results && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Preview */}
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <SVG d={Ic.play} size={16} cls="text-orange-400" />Video Preview
              </h2>
              <div className="bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                <video src={videoUrl} controls className="w-full" style={{ maxHeight: 300 }} />
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-xl border border-gray-800">
                <SVG d={Ic.info} size={14} cls="text-gray-500 flex-shrink-0" />
                <span className="text-white text-xs font-medium truncate">{videoFile?.name}</span>
                <span className="text-gray-500 text-xs ml-auto flex-shrink-0">{(videoFile?.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => { setVideoFile(null); setVideoUrl(null) }} className="text-gray-600 hover:text-red-400 transition-colors ml-2">
                  <SVG d={Ic.close} size={14} />
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <SVG d={Ic.scissors} size={16} cls="text-orange-400" />Clip Settings
              </h2>

              {/* ── UPLOAD MODE SELECTOR ── */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <label className="text-gray-300 text-sm font-bold mb-3 block">Upload Mode</label>
                <div className="grid grid-cols-2 gap-3">

                  {/* MANUAL */}
                  <button onClick={() => setUploadMode('manual')}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      uploadMode === 'manual'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                      uploadMode === 'manual' ? 'bg-orange-500/20' : 'bg-gray-700'
                    }`}>
                      <SVG d={Ic.manual} size={16} cls={uploadMode === 'manual' ? 'text-orange-400' : 'text-gray-500'} />
                    </div>
                    <p className={`text-sm font-bold ${uploadMode === 'manual' ? 'text-orange-400' : 'text-gray-400'}`}>
                      Manual Upload
                    </p>
                    <p className="text-gray-600 text-[10px] mt-0.5">Download karo, khud upload karo</p>
                    {uploadMode === 'manual' && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <SVG d={Ic.check} size={9} cls="text-white" />
                      </div>
                    )}
                  </button>

                  {/* AUTO YOUTUBE */}
                  <button
                    onClick={() => {
                      if (!ytConnected) {
                        window.location.href = '/settings'
                        return
                      }
                      setUploadMode('auto')
                    }}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      !ytConnected
                        ? 'border-gray-800 bg-gray-900 opacity-60 cursor-not-allowed'
                        : uploadMode === 'auto'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                      uploadMode === 'auto' ? 'bg-red-500/20' : 'bg-gray-700'
                    }`}>
                      {!ytConnected
                        ? <SVG d={Ic.lock} size={16} cls="text-gray-600" />
                        : <SVG d={Ic.yt} size={16} cls={uploadMode === 'auto' ? 'text-red-400' : 'text-gray-500'} />
                      }
                    </div>
                    <p className={`text-sm font-bold ${
                      !ytConnected ? 'text-gray-600' : uploadMode === 'auto' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      Auto YouTube
                    </p>
                    <p className="text-gray-600 text-[10px] mt-0.5">
                      {ytConnected ? 'Generate hone ke baad auto upload' : '🔒 YouTube connect karo'}
                    </p>
                    {uploadMode === 'auto' && ytConnected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <SVG d={Ic.check} size={9} cls="text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Auto mode info */}
                {uploadMode === 'auto' && ytConnected && (
                  <div className="mt-3 p-2.5 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <p className="text-red-300 text-[10px] leading-relaxed">
                      ⚡ <span className="font-bold">Auto Mode ON:</span> Clips generate hone ke baad seedha YouTube Shorts par upload ho jayenge. AI title, description aur hashtags khud set karega.
                    </p>
                  </div>
                )}
              </div>

              {/* Format */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <label className="text-gray-300 text-sm font-bold mb-3 block">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: '9:16', icon: <div className="w-5 h-9 rounded border-2 border-current mx-auto" />, label: '9:16', sub: 'Shorts · Reels · TikTok' },
                    { val: '16:9', icon: <div className="w-9 h-5 rounded border-2 border-current mx-auto" />, label: '16:9', sub: 'YouTube · Standard' },
                  ].map(f => (
                    <button key={f.val} onClick={() => setAspectRatio(f.val)}
                      className={`py-4 px-3 rounded-xl border text-center transition-all ${
                        aspectRatio === f.val
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}>
                      <div className="mb-2">{f.icon}</div>
                      <div className="font-black text-sm">{f.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <label className="text-gray-300 text-sm font-bold mb-3 block">Clip Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {CLIP_DURATIONS.map(d => (
                    <button key={d.value} onClick={() => setClipDuration(d.value)}
                      className={`py-3 px-2 rounded-xl border text-center transition-all ${
                        clipDuration === d.value
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}>
                      <div className="text-lg font-black">{d.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{d.tag}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Clips */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <label className="text-gray-300 text-sm font-bold mb-3 block">Max Clips</label>
                <div className="grid grid-cols-4 gap-2">
                  {MAX_CLIPS_OPTIONS.map(n => (
                    <button key={n} onClick={() => setMaxClips(n)}
                      className={`py-3 rounded-xl border font-bold text-lg transition-all ${
                        maxClips === n
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button onClick={handleGenerate}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-95">
                <SVG d={uploadMode === 'auto' && ytConnected ? Ic.yt : Ic.scissors} size={20} />
                {uploadMode === 'auto' && ytConnected ? 'Generate & Upload to YouTube' : 'Generate Clips'}
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <svg className="w-24 h-24 animate-spin" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#1f2937" strokeWidth="8"/>
                <circle cx="48" cy="48" r="40" fill="none" stroke="url(#grad)" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray="80 170"/>
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316"/>
                    <stop offset="100%" stopColor="#ef4444"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <SVG d={Ic.scissors} size={28} cls="text-orange-400" />
              </div>
            </div>
            <h2 className="text-white font-black text-2xl mb-2">Processing Video</h2>
            <p className="text-orange-400 font-medium mb-8">{progressMsg}</p>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-gray-500 text-sm">{progress}% complete</p>
            <div className="mt-10 space-y-2 text-left">
              {[
                { label: 'Upload & save video',        done: progress >= 15 },
                { label: 'Extract audio track',        done: progress >= 35 },
                { label: 'Whisper AI transcription',   done: progress >= 60 },
                { label: 'Groq AI best moment detect', done: progress >= 80 },
                { label: 'Cut clips with ffmpeg',      done: progress >= 95 },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${step.done ? 'bg-green-500/5' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-700'}`}>
                    {step.done ? <SVG d={Ic.check} size={11} cls="text-white" /> : <div className="w-2 h-2 bg-gray-500 rounded-full" />}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-green-400' : 'text-gray-500'}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !loading && (
          <div className="max-w-lg mx-auto">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <SVG d={Ic.close} size={20} cls="text-red-400" />
              </div>
              <h3 className="text-red-400 font-bold text-lg mb-2">Clipping Failed</h3>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button onClick={() => setError('')} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors">Try Again</button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {results && (
          <div className="space-y-6">

            {/* Header bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-white font-black text-2xl flex items-center gap-2">
                  <SVG d={Ic.fire} size={22} cls="text-orange-400" />
                  {results.total_clips} Clips Generated
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  Original: {fmt(results.video_duration)} · Each clip: {results.clip_duration}s · {aspectRatio} portrait
                  {uploadMode === 'auto' && ytConnected && <span className="text-red-400 ml-2 font-medium">· Auto-uploading to YouTube...</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {!ytConnected && (
                  <a href="/settings" className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all">
                    <SVG d={Ic.yt} size={13} />Connect YouTube in Settings
                  </a>
                )}
                <button onClick={downloadAll}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20">
                  <SVG d={Ic.dl} size={15} />Download All
                </button>
              </div>
            </div>

            {/* Clip cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.clips
                .sort((a, b) => b.engagement_score - a.engagement_score)
                .map((clip, i) => {
                  const meta  = clipMeta[clip.id] || {}
                  const upSt  = uploading[clip.id] || 'idle'
                  const upMsg = uploadMsg[clip.id] || ''

                  return (
                    <div key={clip.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl overflow-hidden transition-all group flex flex-col">

                      {/* Portrait preview */}
                      <div className="bg-black relative cursor-pointer overflow-hidden"
                        style={{ aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9', maxHeight: aspectRatio === '9:16' ? 320 : 180 }}
                        onClick={() => setPreviewing(previewing === clip.id ? null : clip.id)}>
                        <video
                          src={`http://localhost:8000${clip.download_url}`}
                          className="w-full h-full object-cover"
                          style={{ display: previewing === clip.id ? 'block' : 'none' }}
                          controls autoPlay={previewing === clip.id}
                        />
                        {previewing !== clip.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                              <SVG d={Ic.play} size={20} cls="text-white" />
                            </div>
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-mono">{clip.duration}s</div>
                            <div className="absolute top-3 left-3 text-orange-400 text-xs font-black bg-black/70 px-2 py-1 rounded-lg">#{i + 1}</div>
                            <div className={`absolute top-3 right-3 text-xs font-black px-2 py-1 rounded-lg border ${scoreColor(clip.engagement_score)}`}>{clip.engagement_score}%</div>
                          </div>
                        )}
                      </div>

                      {/* Clip info + editable metadata */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col">

                        {/* Hook */}
                        {clip.hook && (
                          <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-2.5">
                            <p className="text-orange-300 text-xs leading-relaxed">
                              🎣 <span className="text-orange-400 font-bold">Hook:</span> {clip.hook}
                            </p>
                          </div>
                        )}

                        {/* Editable Title */}
                        <div>
                          <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                            <SVG d={Ic.edit} size={10} />Title
                          </label>
                          <input
                            value={meta.title || ''}
                            onChange={e => updateMeta(clip.id, 'title', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-colors"
                            placeholder="YouTube title..."
                          />
                        </div>

                        {/* Editable Description */}
                        <div>
                          <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                            <SVG d={Ic.manual} size={10} />Description
                          </label>
                          <textarea
                            value={meta.description || ''}
                            onChange={e => updateMeta(clip.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-colors resize-none"
                            placeholder="Description..."
                          />
                        </div>

                        {/* Editable Hashtags */}
                        <div>
                          <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                            <SVG d={Ic.tag} size={10} />Hashtags
                          </label>
                          <input
                            value={meta.hashtags || ''}
                            onChange={e => updateMeta(clip.id, 'hashtags', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-colors"
                            placeholder="#Shorts #Viral..."
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(meta.hashtags || '').split(/\s+/).filter(t => t.startsWith('#')).map((tag, ti) => (
                              <span key={ti} className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </div>

                        {/* Privacy */}
                        <div>
                          <label className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1 block">Privacy</label>
                          <select
                            value={meta.privacy || 'public'}
                            onChange={e => updateMeta(clip.id, 'privacy', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-colors">
                            <option value="public">🌍 Public</option>
                            <option value="unlisted">🔗 Unlisted</option>
                            <option value="private">🔒 Private</option>
                          </select>
                        </div>

                        {/* Timestamps */}
                        <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono pt-1">
                          <SVG d={Ic.clock} size={10} />
                          <span>{fmt(clip.start_time)} → {fmt(clip.end_time)}</span>
                          <span className="ml-auto">{clip.file_size_mb} MB</span>
                        </div>

                        {/* Upload status */}
                        {upMsg && (
                          <div className={`p-2 rounded-lg text-xs font-medium ${
                            upSt === 'done'     ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : upSt === 'error'  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {upSt === 'uploading' && <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1" />}
                            {upMsg}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-auto pt-1">
                          <button onClick={() => downloadClip(clip)} disabled={downloading[clip.id]}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-700">
                            {downloading[clip.id]
                              ? <><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />...</>
                              : <><SVG d={Ic.dl} size={13} />Download</>}
                          </button>
                          <button
                            onClick={() => uploadToYouTube(clip, clipMeta)}
                            disabled={!ytConnected || upSt === 'uploading' || upSt === 'done'}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                              !ytConnected
                                ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
                                : upSt === 'done'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : upSt === 'uploading'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-red-500 hover:bg-red-600 text-white border-0'
                            }`}>
                            {upSt === 'uploading'
                              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading...</>
                              : upSt === 'done'
                                ? <><SVG d={Ic.check} size={13} />Uploaded!</>
                                : !ytConnected
                                  ? <><SVG d={Ic.lock} size={13} />Connect YT</>
                                  : <><SVG d={Ic.yt} size={13} />Upload YT</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Transcript */}
            {results.full_transcript && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Transcript Preview</h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{results.full_transcript}...</p>
              </div>
            )}

            {/* Re-generate */}
            <div className="flex justify-center pt-4">
              <button onClick={() => setResults(null)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 rounded-2xl text-sm font-medium transition-all">
                <SVG d={Ic.refresh} size={15} />Change Settings & Re-generate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}