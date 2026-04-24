// src/pages/AutoClippingPage.jsx
// AI Auto Clipping for Nexora OS
// Upload video → AI detects best moments → Download clips → Upload to YouTube

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Scissors, Upload, Download, Youtube, Play, Clock,
  TrendingUp, CheckCircle, AlertCircle, Loader,
  RefreshCw, Film, Zap, Star
} from 'lucide-react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const card   = { background: 'rgba(15,26,20,0.6)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 14, padding: 22 }
const lbl    = { fontSize: 13, fontWeight: 600, color: '#9DC4B0', display: 'block', marginBottom: 6 }
const inp    = { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10, color: '#D8EEE5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }
const greenBtn = (dis) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: dis ? 'rgba(0,229,160,0.2)' : '#00E5A0', color: dis ? '#4A6357' : '#070D0A', border: 'none', borderRadius: 10, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' })

const fmt = (n) => {
  if (!n) return '0'
  if (n >= 60) return `${Math.floor(n/60)}m ${n%60}s`
  return `${n}s`
}

export default function AutoClippingPage() {
  const [file,          setFile]          = useState(null)
  const [clipDuration,  setClipDuration]  = useState(60)
  const [maxClips,      setMaxClips]      = useState(5)
  const [aspectRatio,   setAspectRatio]   = useState('9:16')
  const [state,         setState]         = useState('idle') // idle | uploading | processing | done | error
  const [progress,      setProgress]      = useState(0)
  const [clips,         setClips]         = useState([])
  const [msg,           setMsg]           = useState('')
  const [transcript,    setTranscript]    = useState('')
  const [uploading,     setUploading]     = useState({}) // clipId → state
  const [ytConnected,   setYtConnected]   = useState(null)
  const [userId,        setUserId]        = useState(null)
  const fileRef = useRef()

  // Get user ID once
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      // Check YouTube connection
      fetch(`${API}/api/youtube/status/${uid}`)
        .then(r => r.json())
        .then(d => setYtConnected(d.connected))
        .catch(() => setYtConnected(false))
    })
  })

  const handleDetect = async () => {
    if (!file) { setMsg('Select a video first.'); setState('error'); return }
    setState('uploading'); setMsg(''); setProgress(10)

    const form = new FormData()
    form.append('file', file)
    form.append('clip_duration', String(clipDuration))
    form.append('max_clips', String(maxClips))
    form.append('aspect_ratio', aspectRatio)

    try {
      setState('processing'); setProgress(30)
      const r = await fetch(`${API}/api/clipping/detect-clips`, { method: 'POST', body: form })
      setProgress(90)
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Detection failed.')
      setClips(d.clips || [])
      setTranscript(d.full_transcript || '')
      setState('done')
      setProgress(100)
    } catch (e) {
      setState('error')
      setMsg(e.message)
      setProgress(0)
    }
  }

  const handleUploadToYT = async (clip) => {
    if (!userId || !ytConnected) return
    setUploading(u => ({ ...u, [clip.id]: 'uploading' }))

    const form = new FormData()
    form.append('filename', clip.filename)
    form.append('title', clip.title || `Clip ${clip.index}`)
    form.append('description', `AI-generated clip from Nexora OS\n\nHook: ${clip.hook || ''}\n\n#Shorts #NexoraOS`)
    form.append('hashtags', '#Shorts #NexoraOS #Creator')
    form.append('privacy', 'private')

    try {
      const r = await fetch(`${API}/api/clipping/upload-youtube`, { method: 'POST', body: form })
      const d = await r.json()
      if (r.ok && d.success) {
        setUploading(u => ({ ...u, [clip.id]: 'done' }))
      } else {
        setUploading(u => ({ ...u, [clip.id]: 'error' }))
      }
    } catch {
      setUploading(u => ({ ...u, [clip.id]: 'error' }))
    }
  }

  const reset = () => {
    setState('idle'); setFile(null); setClips([])
    setTranscript(''); setMsg(''); setProgress(0); setUploading({})
  }

  const scoreColor = (s) => s >= 85 ? '#00E5A0' : s >= 70 ? '#FBBF24' : '#F87171'

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={22} color="#00E5A0" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>AI Auto Clipping</h1>
            <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0 }}>Upload video → AI finds best moments → Download or upload to YouTube</p>
          </div>
        </div>
        {state === 'done' && (
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, color: '#00E5A0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> New Video
          </button>
        )}
      </div>

      {state !== 'done' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
          {/* Upload panel */}
          <div style={card}>
            <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>Upload Video</h3>

            {/* File drop zone */}
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setState('idle'); setMsg('') }} />
            <div onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed rgba(0,229,160,0.2)', borderRadius: 12, padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: 20 }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.2)'}>
              {file ? (
                <>
                  <Film size={28} color="#00E5A0" style={{ display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ color: '#D8EEE5', fontSize: 14, fontWeight: 600, margin: 0 }}>{file.name}</p>
                  <p style={{ color: '#4A6357', fontSize: 12, margin: '5px 0 0' }}>{(file.size/1024/1024).toFixed(1)} MB</p>
                </>
              ) : (
                <>
                  <Upload size={28} color="#4A6357" style={{ display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ color: '#4A6357', fontSize: 14, margin: 0 }}>Click to upload video</p>
                  <p style={{ color: '#4A6357', fontSize: 12, margin: '5px 0 0' }}>MP4, MOV, AVI • Any length</p>
                </>
              )}
            </div>

            {/* Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Clip Duration</label>
                <select value={clipDuration} onChange={e => setClipDuration(Number(e.target.value))} style={{ ...inp, cursor: 'pointer' }}>
                  {[30,45,60,90,120].map(v => <option key={v} value={v}>{v}s {v<=60 ? '(Shorts)' : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Max Clips</label>
                <select value={maxClips} onChange={e => setMaxClips(Number(e.target.value))} style={{ ...inp, cursor: 'pointer' }}>
                  {[3,5,7,10].map(v => <option key={v} value={v}>{v} clips</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Aspect Ratio</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['9:16','📱 Shorts/Reels'],['16:9','🖥️ YouTube/Landscape']].map(([v,l]) => (
                  <div key={v} onClick={() => setAspectRatio(v)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
                      border: `1px solid ${aspectRatio===v ? 'rgba(0,229,160,0.4)' : 'rgba(0,229,160,0.1)'}`,
                      background: aspectRatio===v ? 'rgba(0,229,160,0.08)' : 'transparent',
                      color: aspectRatio===v ? '#00E5A0' : '#7A9E8E' }}>{l}</div>
                ))}
              </div>
            </div>

            {/* Progress */}
            {(state === 'uploading' || state === 'processing') && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#7A9E8E' }}>
                  <span>{state === 'uploading' ? '⬆️ Uploading...' : '🤖 AI analyzing video...'}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: '#00E5A0', borderRadius: 3, transition: 'width .5s' }} />
                </div>
                <p style={{ fontSize: 11, color: '#4A6357', marginTop: 6 }}>
                  {state === 'processing' ? 'Transcribing audio → Finding viral moments → Cutting clips...' : 'Uploading to server...'}
                </p>
              </div>
            )}

            {state === 'error' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{msg}</span>
              </div>
            )}

            <button style={{ ...greenBtn(state === 'uploading' || state === 'processing' || !file), width: '100%' }}
              onClick={handleDetect} disabled={state === 'uploading' || state === 'processing' || !file}>
              {state === 'uploading' || state === 'processing'
                ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Processing...</>
                : <><Zap size={15} /> Detect Best Clips with AI</>}
            </button>
          </div>

          {/* How it works */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={card}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>⚡ How It Works</h4>
              {[
                ['1', 'Upload', 'Upload any video — podcast, stream, vlog, interview'],
                ['2', 'Transcribe', 'Whisper AI transcribes the entire audio'],
                ['3', 'Analyze', 'Groq AI finds the most engaging moments'],
                ['4', 'Cut', 'FFmpeg cuts clips in your chosen aspect ratio'],
                ['5', 'Export', 'Download clips or upload directly to YouTube Shorts'],
              ].map(([n, t, d]) => (
                <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#00E5A0', flexShrink: 0 }}>{n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#D8EEE5' }}>{t}</div>
                    <div style={{ fontSize: 12, color: '#7A9E8E' }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>📋 Requirements</h4>
              {[
                ['FFmpeg', 'Installed on server ✅'],
                ['Groq API', 'For AI analysis ✅'],
                ['Max file', '~500MB recommended'],
                ['Best results', 'Talking head videos'],
              ].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(0,229,160,0.06)' }}>
                  <span style={{ color: '#7A9E8E' }}>{k}</span>
                  <span style={{ color: '#D8EEE5', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results */
        <div>
          {/* Summary bar */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={22} color="#00E5A0" />
              <div>
                <div style={{ fontWeight: 700, color: '#00E5A0', fontSize: 15 }}>{clips.length} Clips Generated!</div>
                <div style={{ fontSize: 12, color: '#7A9E8E' }}>{aspectRatio} • {clipDuration}s each</div>
              </div>
            </div>
            {!ytConnected && (
              <div style={{ fontSize: 12, color: '#FBBF24', padding: '6px 12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8 }}>
                ⚠️ Connect YouTube in Settings to upload clips directly
              </div>
            )}
            {transcript && (
              <div style={{ flex: 1, fontSize: 12, color: '#4A6357', fontStyle: 'italic', minWidth: 200 }}>
                "{transcript.slice(0,100)}..."
              </div>
            )}
          </div>

          {/* Clips grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {clips.map(clip => (
              <div key={clip.id} style={card}>
                {/* Score badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                      Clip {clip.index} — {clip.title || 'Untitled'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#7A9E8E' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{clip.start_time}s – {clip.end_time}s</span>
                      <span>{clip.duration}s</span>
                      <span>{clip.file_size_mb}MB</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, background: `rgba(${clip.engagement_score >= 85 ? '0,229,160' : clip.engagement_score >= 70 ? '251,191,36' : '248,113,113'},0.1)`, border: `1px solid rgba(${clip.engagement_score >= 85 ? '0,229,160' : clip.engagement_score >= 70 ? '251,191,36' : '248,113,113'},0.25)` }}>
                    <Star size={11} color={scoreColor(clip.engagement_score)} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(clip.engagement_score) }}>{clip.engagement_score}%</span>
                  </div>
                </div>

                {/* Hook & reason */}
                {clip.hook && (
                  <div style={{ padding: '8px 12px', background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 8, marginBottom: 10 }}>
                    <p style={{ fontSize: 12, color: '#00E5A0', margin: 0, fontStyle: 'italic' }}>"{clip.hook}"</p>
                  </div>
                )}
                {clip.reason && (
                  <p style={{ fontSize: 12, color: '#7A9E8E', margin: '0 0 12px', lineHeight: 1.5 }}>{clip.reason}</p>
                )}

                {/* Engagement bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4A6357', marginBottom: 4 }}>
                    <span>Virality Score</span><span style={{ color: scoreColor(clip.engagement_score), fontWeight: 700 }}>{clip.engagement_score}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${clip.engagement_score}%`, background: scoreColor(clip.engagement_score), borderRadius: 2 }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Download */}
                  <a href={`${API}${clip.download_url}`} download
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, color: '#00E5A0', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    <Download size={14} /> Download
                  </a>

                  {/* Upload to YouTube */}
                  {ytConnected && (
                    <button
                      onClick={() => handleUploadToYT(clip)}
                      disabled={!!uploading[clip.id]}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: uploading[clip.id] === 'done' ? 'rgba(0,229,160,0.1)' : uploading[clip.id] === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(255,0,0,0.08)', border: `1px solid ${uploading[clip.id] === 'done' ? 'rgba(0,229,160,0.3)' : uploading[clip.id] === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(255,0,0,0.2)'}`, borderRadius: 8, color: uploading[clip.id] === 'done' ? '#00E5A0' : uploading[clip.id] === 'error' ? '#F87171' : '#FF0000', fontSize: 13, fontWeight: 600, cursor: uploading[clip.id] ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {uploading[clip.id] === 'uploading' ? <><Loader size={13} style={{ animation: 'sp .7s linear infinite' }} /> Uploading...</>
                        : uploading[clip.id] === 'done' ? <><CheckCircle size={13} /> Uploaded!</>
                        : uploading[clip.id] === 'error' ? <><AlertCircle size={13} /> Failed</>
                        : <><Youtube size={13} /> Upload</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}