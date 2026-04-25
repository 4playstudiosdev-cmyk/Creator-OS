// src/pages/AutoClippingPage.jsx
// AI Auto Clipping for Nexora OS
// Whisper transcribe → Groq AI viral moments → FFmpeg cuts → Download/YouTube

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  Scissors, Upload, Download, Youtube, Play, Clock,
  CheckCircle, AlertCircle, Loader, RefreshCw,
  Film, Zap, Star, TrendingUp, Hash, MessageSquare
} from 'lucide-react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

const card    = { background: 'rgba(15,26,20,0.8)', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 14, padding: 22 }
const lbl     = { fontSize: 12, fontWeight: 700, color: '#9DC4B0', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }
const inp     = { padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 8, color: '#D8EEE5', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const greenBtn = (dis) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: dis ? 'rgba(0,229,160,0.15)' : 'linear-gradient(135deg,#00E5A0,#00B87A)', color: dis ? '#4A6357' : '#070D0A', border: 'none', borderRadius: 10, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', transition: 'all .15s' })

const fmt = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n||0)
const scoreColor = (s) => s >= 85 ? '#00E5A0' : s >= 70 ? '#FBBF24' : '#F87171'
const scoreGradient = (s) => s >= 85 ? 'rgba(0,229,160,0.1)' : s >= 70 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)'

export default function AutoClippingPage() {
  const [file,        setFile]        = useState(null)
  const [clipDur,     setClipDur]     = useState(60)
  const [maxClips,    setMaxClips]    = useState(5)
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [state,       setState]       = useState('idle')
  const [progress,    setProgress]    = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [clips,       setClips]       = useState([])
  const [transcript,  setTranscript]  = useState('')
  const [msg,         setMsg]         = useState('')
  const [uploading,   setUploading]   = useState({})
  const [ytConnected, setYtConnected] = useState(null)
  const [userId,      setUserId]      = useState(null)
  const fileRef = useRef()

  // Get user + YouTube status
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      fetch(`${API}/api/youtube/status/${uid}`).then(r => r.json()).then(d => setYtConnected(d.connected)).catch(() => setYtConnected(false))
    })
  })

  const handleDetect = async () => {
    if (!file) { setMsg('Select a video first.'); return }
    setState('processing'); setMsg(''); setProgress(5); setProgressMsg('Uploading video...')

    const form = new FormData()
    form.append('file', file)
    form.append('clip_duration', String(clipDur))
    form.append('max_clips',     String(maxClips))
    form.append('aspect_ratio',  aspectRatio)

    // Simulate progress
    const prog = setInterval(() => {
      setProgress(p => {
        if (p < 30) { setProgressMsg('⬆️ Uploading...'); return p + 5 }
        if (p < 60) { setProgressMsg('🎙️ Transcribing with Whisper...'); return p + 2 }
        if (p < 80) { setProgressMsg('🤖 Groq AI finding viral moments...'); return p + 1 }
        setProgressMsg('✂️ FFmpeg cutting clips...'); return Math.min(p + 0.5, 92)
      })
    }, 800)

    try {
      const r = await fetch(`${API}/api/clipping/detect-clips`, { method: 'POST', body: form })
      clearInterval(prog)
      setProgress(100); setProgressMsg('✅ Done!')
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Processing failed.')
      setClips(d.clips || [])
      setTranscript(d.full_transcript || '')
      setState('done')
    } catch (e) {
      clearInterval(prog)
      setState('error'); setMsg(e.message); setProgress(0)
    }
  }

  const uploadToYT = async (clip) => {
    if (!userId || !ytConnected) return
    setUploading(u => ({ ...u, [clip.id]: 'uploading' }))
    try {
      const form = new FormData()
      form.append('filename', clip.filename || clip.output_path?.split('/').pop() || '')
      form.append('title',    `${clip.title || 'Clip'} #Shorts`)
      form.append('description', `AI-generated clip from Nexora OS\n\nHook: ${clip.hook || ''}\n\n#Shorts #NexoraOS #Creator`)
      form.append('hashtags', '#Shorts #NexoraOS')
      form.append('privacy',  'private')
      form.append('user_id',  userId)
      const r = await fetch(`${API}/api/clipping/upload-youtube`, { method: 'POST', body: form })
      const d = await r.json()
      setUploading(u => ({ ...u, [clip.id]: r.ok && d.success ? 'done' : 'error' }))
    } catch {
      setUploading(u => ({ ...u, [clip.id]: 'error' }))
    }
  }

  const reset = () => { setState('idle'); setFile(null); setClips([]); setTranscript(''); setMsg(''); setProgress(0); setUploading({}) }

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#D8EEE5' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}} @keyframes progBar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,rgba(0,229,160,0.15),rgba(0,229,160,0.05))', border: '1px solid rgba(0,229,160,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={22} color="#00E5A0" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>AI Auto Clipping</h1>
            <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0 }}>Whisper + Groq AI + FFmpeg → Viral clips in minutes</p>
          </div>
        </div>
        {state === 'done' && (
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, color: '#00E5A0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> New Video
          </button>
        )}
      </div>

      {state !== 'done' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
          {/* Upload + Settings */}
          <div style={card}>
            <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 18 }}>Upload Video</div>

            {/* File zone */}
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setState('idle'); setMsg('') }} />
            <div onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${file ? 'rgba(0,229,160,0.4)' : 'rgba(0,229,160,0.15)'}`, borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: 20, transition: 'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,229,160,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor=file ? 'rgba(0,229,160,0.4)' : 'rgba(0,229,160,0.15)'}>
              {file ? (
                <>
                  <Film size={26} color="#00E5A0" style={{ display: 'block', margin: '0 auto 8px' }} />
                  <p style={{ color: '#D8EEE5', fontSize: 14, fontWeight: 600, margin: 0 }}>{file.name}</p>
                  <p style={{ color: '#7A9E8E', fontSize: 12, margin: '4px 0 0' }}>{(file.size/1024/1024).toFixed(1)} MB</p>
                  <p style={{ color: '#4A6357', fontSize: 11, margin: '4px 0 0' }}>Click to change</p>
                </>
              ) : (
                <>
                  <Upload size={28} color="#4A6357" style={{ display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ color: '#9DC4B0', fontSize: 14, fontWeight: 600, margin: 0 }}>Click to upload video</p>
                  <p style={{ color: '#4A6357', fontSize: 12, margin: '5px 0 0' }}>MP4, MOV, AVI • Any length</p>
                </>
              )}
            </div>

            {/* Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Clip Duration</label>
                <select value={clipDur} onChange={e => setClipDur(Number(e.target.value))} style={{ ...inp, cursor: 'pointer', appearance: 'none' }}>
                  {[15,30,45,60,90,120].map(v => <option key={v} value={v}>{v}s {v<=60 ? '📱 Shorts' : '🎬 Long'}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Max Clips</label>
                <select value={maxClips} onChange={e => setMaxClips(Number(e.target.value))} style={{ ...inp, cursor: 'pointer', appearance: 'none' }}>
                  {[3,5,7,10].map(v => <option key={v} value={v}>{v} clips</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Aspect Ratio</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['9:16','📱 Shorts / Reels / TikTok'],['16:9','🖥️ YouTube / Landscape']].map(([v,l]) => (
                  <div key={v} onClick={() => setAspectRatio(v)}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
                      border: `1px solid ${aspectRatio===v ? 'rgba(0,229,160,0.4)' : 'rgba(0,229,160,0.08)'}`,
                      background: aspectRatio===v ? 'rgba(0,229,160,0.08)' : 'transparent',
                      color: aspectRatio===v ? '#00E5A0' : '#7A9E8E', transition: 'all .15s' }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            {(state === 'processing') && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#9DC4B0' }}>
                  <span>{progressMsg}</span><span style={{ fontFamily: 'monospace' }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,229,160,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#00E5A0,#00B87A)', borderRadius: 3, transition: 'width .8s ease' }} />
                </div>
              </div>
            )}

            {/* Error */}
            {(state === 'error' || msg) && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', marginBottom: 12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171' }}>{msg}</span>
              </div>
            )}

            <button style={{ ...greenBtn(state === 'processing' || !file), width: '100%' }}
              onClick={handleDetect} disabled={state === 'processing' || !file}>
              {state === 'processing'
                ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Processing...</>
                : <><Zap size={15} /> Detect Viral Clips with AI</>}
            </button>
          </div>

          {/* How it works */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={card}>
              <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>⚡ AI Pipeline</div>
              {[
                ['1', '#00E5A0', '⬆️ Upload', 'Video goes to Railway server'],
                ['2', '#60A5FA', '🎙️ Whisper', 'Transcribes full audio with timestamps'],
                ['3', '#A78BFA', '🤖 Groq AI', 'Finds most viral/engaging moments'],
                ['4', '#FBBF24', '✂️ FFmpeg', 'Cuts clips in your chosen ratio'],
                ['5', '#F9A8D4', '⬇️ Export', 'Download or upload to YouTube'],
              ].map(([n, c, t, d]) => (
                <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${c}15`, border: `1px solid ${c}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: c, flexShrink: 0 }}>{n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#D8EEE5' }}>{t}</div>
                    <div style={{ fontSize: 12, color: '#7A9E8E' }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>🎯 Best Results</div>
              {['Podcast / interview videos','Talking head content','Tutorial / educational videos','Long-form vlogs','Livestream recordings'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#9DC4B0' }}>{t}</span>
                </div>
              ))}
            </div>

            {ytConnected && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: '#F87171', fontWeight: 700 }}>▶ YouTube Connected</div>
                <div style={{ fontSize: 12, color: '#7A9E8E', marginTop: 3 }}>Clips can be uploaded directly to YouTube Shorts</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Results */
        <div>
          {/* Summary */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={24} color="#00E5A0" />
              <div>
                <div style={{ fontWeight: 800, color: '#00E5A0', fontSize: 16, fontFamily: "'Cabinet Grotesk',sans-serif" }}>{clips.length} Viral Clips Generated!</div>
                <div style={{ fontSize: 12, color: '#7A9E8E' }}>{aspectRatio} • {clipDur}s each</div>
              </div>
            </div>
            {transcript && (
              <div style={{ flex: 1, minWidth: 200, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(0,229,160,0.08)' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <MessageSquare size={12} color="#9DC4B0" />
                  <span style={{ fontSize: 11, color: '#9DC4B0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Transcript</span>
                </div>
                <p style={{ fontSize: 12, color: '#7A9E8E', margin: 0, lineHeight: 1.5 }}>"{transcript.slice(0,120)}{transcript.length > 120 ? '...' : ''}"</p>
              </div>
            )}
            {!ytConnected && (
              <div style={{ fontSize: 12, color: '#FBBF24', padding: '8px 12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8 }}>
                Connect YouTube in Settings to upload clips
              </div>
            )}
          </div>

          {/* Clips grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
            {clips.map((clip, idx) => {
              const score = clip.engagement_score || 70
              const upState = uploading[clip.id]
              return (
                <div key={clip.id || idx} style={{ ...card, padding: 16 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Clip {clip.index || idx+1} — {clip.title || 'Untitled'}
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#7A9E8E' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{clip.start_time}s – {clip.end_time}s</span>
                        <span>{clip.duration}s</span>
                        {clip.file_size_mb && <span>{clip.file_size_mb}MB</span>}
                      </div>
                    </div>
                    {/* Score badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100,
                      background: scoreGradient(score),
                      border: `1px solid ${scoreColor(score)}30`, flexShrink: 0, marginLeft: 8 }}>
                      <Star size={11} color={scoreColor(score)} fill={scoreColor(score)} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(score) }}>{score}%</span>
                    </div>
                  </div>

                  {/* Hook */}
                  {clip.hook && (
                    <div style={{ padding: '8px 12px', background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 8, marginBottom: 8 }}>
                      <p style={{ fontSize: 12, color: '#00E5A0', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>"{clip.hook}"</p>
                    </div>
                  )}

                  {/* Reason */}
                  {clip.reason && (
                    <p style={{ fontSize: 12, color: '#7A9E8E', margin: '0 0 10px', lineHeight: 1.5 }}>{clip.reason}</p>
                  )}

                  {/* Score bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4A6357', marginBottom: 4 }}>
                      <span>Virality Score</span>
                      <span style={{ color: scoreColor(score), fontWeight: 700 }}>{score}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score), borderRadius: 2, transition: 'width .5s' }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`${API}${clip.download_url}`} download
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, color: '#00E5A0', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                      <Download size={14} /> Download
                    </a>
                    {ytConnected && (
                      <button onClick={() => uploadToYT(clip)} disabled={!!upState}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px',
                          background: upState === 'done' ? 'rgba(0,229,160,0.08)' : upState === 'error' ? 'rgba(248,113,113,0.08)' : 'rgba(255,0,0,0.08)',
                          border: `1px solid ${upState === 'done' ? 'rgba(0,229,160,0.25)' : upState === 'error' ? 'rgba(248,113,113,0.25)' : 'rgba(255,0,0,0.2)'}`,
                          borderRadius: 8, color: upState === 'done' ? '#00E5A0' : upState === 'error' ? '#F87171' : '#FF0000',
                          fontSize: 13, fontWeight: 700, cursor: upState ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        {upState === 'uploading' ? <><Loader size={13} style={{ animation: 'sp .7s linear infinite' }} /> Uploading...</>
                          : upState === 'done' ? <><CheckCircle size={13} /> Uploaded!</>
                          : upState === 'error' ? <><AlertCircle size={13} /> Failed</>
                          : <><Youtube size={13} /> YouTube</>}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}