import React, { useState, useEffect } from 'react'
// src/pages/LinkedInPage.jsx
// Complete LinkedIn Studio for Nexora OS
// Features: Connect, Post, My Posts, Comments/Inbox, Analytics


import { supabase } from '../lib/supabaseClient'
import {
  CheckCircle, AlertCircle, Loader, RefreshCw,
  Send, Eye, ThumbsUp, MessageCircle, Globe,
  Lock, ArrowUpRight, Users, BarChart2, FileText
} from 'lucide-react'

const API = 'https://creator-os-production-0bf8.up.railway.app'

// ── Styles ────────────────────────────────────────────────────────────────────
const card   = { background: 'rgba(10,102,194,0.04)', border: '1px solid rgba(10,102,194,0.15)', borderRadius: 14, padding: 22 }
const lbl    = { fontSize: 13, fontWeight: 600, color: '#93C5FD', display: 'block', marginBottom: 6 }
const inp    = { width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(10,102,194,0.2)', borderRadius: 10, color: '#E2E8F0', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color .18s' }
const ta     = { ...inp, resize: 'vertical', minHeight: 100 }
const tabBtn = (a) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13, border: 'none', fontFamily: 'inherit', transition: 'all .15s', background: a ? '#0A66C2' : 'rgba(10,102,194,0.1)', color: a ? '#fff' : '#93C5FD' })
const blueBtn = (dis) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 16px', background: dis ? 'rgba(10,102,194,0.3)' : '#0A66C2', color: '#fff', border: 'none', borderRadius: 10, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', marginTop: 14 })

const LiIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LinkedInPage() {
  const [tab,      setTab]      = useState('post')
  const [userId,   setUserId]   = useState(null)
  const [liStatus, setLiStatus] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const uid = session.user.id
      setUserId(uid)

      const params = new URLSearchParams(window.location.search)
      if (params.get('linkedin_connected') === 'true') {
        window.history.replaceState({}, '', '/linkedin')
      }

      checkStatus(uid)
    })
  }, [])

  const checkStatus = async (uid) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/linkedin/status/${uid}`)
      setLiStatus(await r.json())
    } catch {
      setLiStatus({ connected: false })
    }
    setLoading(false)
  }

  const handleConnect    = () => { if (!userId) return; window.location.href = `${API}/api/linkedin/auth?user_id=${userId}` }
  const handleDisconnect = async () => {
    if (!userId) return
    await fetch(`${API}/api/linkedin/disconnect/${userId}`, { method: 'DELETE' })
    setLiStatus({ connected: false })
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
      <div style={{ width: 38, height: 38, border: '3px solid rgba(10,102,194,0.15)', borderTopColor: '#0A66C2', borderRadius: '50%', animation: 'sp .8s linear infinite' }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#475569', fontSize: 13 }}>Loading LinkedIn...</p>
    </div>
  )

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!liStatus?.connected) return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <div style={{ ...card, maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <LiIcon />
        </div>
        <h2 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
          Connect LinkedIn
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px', lineHeight: 1.6 }}>
          Connect your LinkedIn profile to post updates, manage comments, and grow your professional network — all from Nexora OS.
        </p>
        <button onClick={handleConnect} style={{ ...blueBtn(false), width: 'auto', padding: '12px 32px', margin: '0 auto' }}>
          <LiIcon /> Connect LinkedIn
        </button>
      </div>
    </div>
  )

  const tabs = [
    { key: 'post',      label: 'New Post',  icon: <FileText size={14} />    },
    { key: 'posts',     label: 'My Posts',  icon: <Eye size={14} />          },
    { key: 'inbox',     label: 'Comments',  icon: <MessageCircle size={14}/> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} />   },
  ]

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", color: '#E2E8F0' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {liStatus.picture
            ? <img src={liStatus.picture} alt="" style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid #0A66C2' }} />
            : <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LiIcon /></div>}
          <div>
            <h1 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{liStatus.name || 'LinkedIn'}</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{liStatus.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => checkStatus(userId)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(10,102,194,0.1)', border: '1px solid rgba(10,102,194,0.2)', borderRadius: 8, color: '#0A66C2', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={handleDisconnect}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Disconnect
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} style={tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'post'      && <PostTab      userId={userId} liStatus={liStatus} />}
      {tab === 'posts'     && <PostsTab     userId={userId} />}
      {tab === 'inbox'     && <InboxTab     userId={userId} />}
      {tab === 'analytics' && <AnalyticsTab userId={userId} liStatus={liStatus} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// POST TAB
// ─────────────────────────────────────────────────────────────────────────────
function PostTab({ userId, liStatus }) {
  const [text,       setText]       = useState('')
  const [imageFile,  setImageFile]  = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [visibility, setVisibility] = useState('PUBLIC')
  const [state,      setState]      = useState('idle')
  const [msg,        setMsg]        = useState('')
  const [result,     setResult]     = useState(null)
  const fileRef = React.useRef()

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImageToSupabase = async (file) => {
    // Upload to Supabase storage and get public URL
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    const ext      = file.name.split('.').pop()
    const filename = `linkedin/${userId}/${Date.now()}.${ext}`
    const { error } = await sb.storage.from('posts').upload(filename, file, { upsert: true })
    if (error) throw new Error('Image upload failed: ' + error.message)
    const { data } = sb.storage.from('posts').getPublicUrl(filename)
    return data.publicUrl
  }

  const handlePost = async () => {
    if (!text.trim()) { setMsg('Write something to post.'); setState('error'); return }
    setState('loading'); setMsg('')

    try {
      let imageUrl = undefined
      if (imageFile) {
        imageUrl = await uploadImageToSupabase(imageFile)
      }

      const r = await fetch(`${API}/api/linkedin/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, text, image_url: imageUrl, visibility }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Post failed.')
      setState('success'); setResult(d)
    } catch (e) { setState('error'); setMsg(e.message) }
  }

  const reset = () => {
    setState('idle'); setMsg(''); setResult(null)
    setText(''); setImageFile(null); setImagePreview(null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
      <div style={card}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>New LinkedIn Post</h3>

        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <CheckCircle size={44} color="#00E5A0" style={{ display: 'block', margin: '0 auto 14px' }} />
            <p style={{ color: '#00E5A0', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>Posted to LinkedIn! 🎉</p>
            {result?.url && (
              <a href={result.url} target="_blank" rel="noopener"
                style={{ fontSize: 13, color: '#60A5FA', textDecoration: 'none', display: 'block', marginBottom: 16 }}>
                View on LinkedIn →
              </a>
            )}
            <button onClick={reset} style={{ padding: '9px 20px', background: 'none', border: '1px solid rgba(10,102,194,0.3)', borderRadius: 8, color: '#93C5FD', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Post Again
            </button>
          </div>
        ) : (
          <>
            {/* Profile preview */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {liStatus?.picture
                ? <img src={liStatus.picture} alt="" style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid #0A66C2' }} />
                : <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>LI</div>}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{liStatus?.name || 'You'}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>Posting to LinkedIn</div>
              </div>
            </div>

            {/* Text */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>
                Post Content
                <span style={{ float: 'right', fontWeight: 400, color: text.length > 2800 ? '#F87171' : '#475569' }}>{text.length}/3000</span>
              </label>
              <textarea style={{ ...ta, minHeight: 140 }} value={text}
                onChange={e => setText(e.target.value.slice(0, 3000))}
                placeholder="Share your thoughts, insights, or updates...&#10;&#10;Add value, tell a story, or share what you learned.&#10;&#10;#hashtags at the end"
                onFocus={e => e.target.style.borderColor='rgba(10,102,194,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(10,102,194,0.2)'} />
            </div>

            {/* Image upload */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Image (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(10,102,194,0.2)' }} />
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()}
                  style={{ border: '2px dashed rgba(10,102,194,0.25)', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(10,102,194,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(10,102,194,0.25)'}>
                  <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>📷 Click to add image</p>
                  <p style={{ color: '#475569', fontSize: 11, margin: '4px 0 0' }}>JPG, PNG supported</p>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Visibility</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['PUBLIC', '🌐 Everyone'], ['CONNECTIONS', '👥 Connections only']].map(([v, l]) => (
                  <div key={v} onClick={() => setVisibility(v)}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
                      border: `1px solid ${visibility===v ? 'rgba(10,102,194,0.5)' : 'rgba(10,102,194,0.15)'}`,
                      background: visibility===v ? 'rgba(10,102,194,0.15)' : 'transparent',
                      color: visibility===v ? '#60A5FA' : '#64748B' }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {state === 'error' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', marginBottom: 12 }}>
                <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#F87171', lineHeight: 1.5 }}>{msg}</span>
              </div>
            )}

            {state === 'loading' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 4, background: 'rgba(10,102,194,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '60%', background: '#0A66C2', borderRadius: 2, animation: 'slide 1.5s ease infinite' }} />
                </div>
                <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
                <p style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>{imageFile ? 'Uploading image...' : 'Posting...'}</p>
              </div>
            )}

            <button style={blueBtn(state === 'loading')} onClick={handlePost} disabled={state === 'loading'}>
              {state === 'loading'
                ? <><Loader size={15} style={{ animation: 'sp .7s linear infinite' }} /> Posting...</>
                : <><Send size={15} /> Post to LinkedIn</>}
            </button>
          </>
        )}
      </div>

      <div style={card}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>✍️ LinkedIn Post Tips</h4>
        {[
          'Start with a hook — first line is crucial',
          'Use line breaks for readability',
          'Add 3-5 relevant hashtags at the end',
          'Post Tuesday-Thursday for best reach',
          'Engage with comments in first hour',
          'Personal stories get 3x more engagement',
          'Images get 2x more engagement',
          'Max 3000 characters per post',
        ].map(t => (
          <p key={t} style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', paddingLeft: 12, borderLeft: '2px solid rgba(10,102,194,0.3)', lineHeight: 1.5 }}>{t}</p>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MY POSTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function PostsTab({ userId }) {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [note,    setNote]    = useState(null)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`${API}/api/linkedin/posts/${userId}`)
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts || [])
        setNote(d.note)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [userId])

  if (loading) return <div style={{ color: '#475569', textAlign: 'center', padding: 48 }}>Loading posts...</div>

  return (
    <div style={card}>
      <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
        My Posts ({posts.length})
      </h3>

      {note && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#FBBF24', margin: 0, flex: 1 }}>ℹ️ {note}</p>
          <a href="https://www.linkedin.com/in/me/recent-activity/all/" target="_blank" rel="noopener"
            style={{ fontSize: 11, color: '#60A5FA', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowUpRight size={11} /> View on LinkedIn
          </a>
        </div>
      )}

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
          <FileText size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: .3 }} />
          <p style={{ fontSize: 14, margin: '0 0 8px', color: '#64748B' }}>No posts fetched yet</p>
          <p style={{ fontSize: 12, margin: '0 0 16px', color: '#475569' }}>LinkedIn API has limited post reading access</p>
          <a href="https://www.linkedin.com/in/me/recent-activity/all/" target="_blank" rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0A66C2', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            <ArrowUpRight size={13} /> View My Posts on LinkedIn
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map(p => (
            <div key={p.id} style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(10,102,194,0.1)', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(10,102,194,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(10,102,194,0.1)'}>
              <p style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 1.7, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{p.text}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#475569' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(0,229,160,0.08)', color: '#00E5A0', fontWeight: 700 }}>✓ {p.lifecycle || 'Published'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.04)', color: '#64748B' }}>🌐 {p.visibility?.toLowerCase() || 'public'}</span>
                  {p.created_at > 0 && <span>{new Date(p.created_at).toLocaleDateString()}</span>}
                </div>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener"
                    style={{ fontSize: 11, color: '#60A5FA', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowUpRight size={11} /> View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INBOX / COMMENTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function InboxTab({ userId }) {
  const [postId,   setPostId]   = useState('')
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null)
  const [reply,    setReply]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState({})
  const [msg,      setMsg]      = useState(null)

  const fetchComments = async () => {
    if (!postId.trim()) return
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/linkedin/comments/${userId}?post_id=${encodeURIComponent(postId)}`)
      const d = await r.json()
      setComments(d.comments || [])
    } catch { setComments([]) }
    setLoading(false)
  }

  const sendReply = async (commentId) => {
    if (!reply.trim() || !postId) return
    setSending(true)
    try {
      const r = await fetch(`${API}/api/linkedin/reply-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id: postId, comment_id: commentId, text: reply }),
      })
      const d = await r.json()
      if (r.ok) { setSent({ ...sent, [commentId]: true }); setReply(''); setMsg({ type: 'success', text: 'Reply posted!' }) }
      else setMsg({ type: 'error', text: d.detail || 'Reply failed.' })
    } catch (e) { setMsg({ type: 'error', text: e.message }) }
    setSending(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, alignItems: 'start' }}>
      <div style={card}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Comments Inbox</h3>

        {/* Post ID input */}
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Post URN / ID</label>
          <input style={inp} value={postId} onChange={e => setPostId(e.target.value)}
            placeholder="urn:li:ugcPost:1234567890"
            onFocus={e => e.target.style.borderColor='rgba(10,102,194,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(10,102,194,0.2)'} />
          <p style={{ fontSize: 11, color: '#475569', marginTop: 5 }}>
            Find this in your post URL or LinkedIn API response
          </p>
        </div>

        <button onClick={fetchComments} disabled={loading || !postId.trim()}
          style={{ ...blueBtn(!postId.trim()), marginTop: 0, marginBottom: 16 }}>
          {loading ? 'Loading...' : 'Fetch Comments'}
        </button>

        {/* Comment list */}
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {comments.length === 0 && !loading && postId && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#475569', fontSize: 13 }}>No comments found</div>
          )}
          {comments.map(c => (
            <div key={c.id} onClick={() => { setSelected(c); setReply('') }}
              style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: selected?.id === c.id ? 'rgba(10,102,194,0.12)' : 'transparent',
                border: selected?.id === c.id ? '1px solid rgba(10,102,194,0.3)' : '1px solid transparent',
                transition: 'all .15s' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#93C5FD', marginBottom: 3 }}>{c.actor?.split(':').pop() || 'Member'}</div>
              <div style={{ fontSize: 12, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</div>
              {sent[c.id] && <div style={{ fontSize: 10, color: '#00E5A0', marginTop: 3 }}>✓ Replied</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Reply panel */}
      <div style={card}>
        {!selected ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#475569' }}>
            <MessageCircle size={34} style={{ display: 'block', margin: '0 auto 14px', opacity: .3 }} />
            Fetch comments then select one to reply
          </div>
        ) : (
          <>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(10,102,194,0.15)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#E2E8F0', lineHeight: 1.65, marginBottom: 16 }}>
              {selected.text}
            </div>

            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 13,
                background: msg.type === 'success' ? 'rgba(0,229,160,0.08)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${msg.type === 'success' ? 'rgba(0,229,160,0.3)' : 'rgba(248,113,113,0.3)'}`,
                color: msg.type === 'success' ? '#00E5A0' : '#F87171' }}>
                {msg.text}
              </div>
            )}

            {sent[selected.id] ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00E5A0', fontSize: 13 }}>
                <CheckCircle size={15} /> Reply posted!
              </div>
            ) : (
              <>
                <label style={lbl}>Your Reply</label>
                <textarea style={{ ...ta, minHeight: 80, marginBottom: 10 }}
                  value={reply} onChange={e => setReply(e.target.value)}
                  placeholder="Write your reply..."
                  onFocus={e => e.target.style.borderColor='rgba(10,102,194,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(10,102,194,0.2)'} />
                <button style={blueBtn(sending)} onClick={() => sendReply(selected.id)} disabled={sending}>
                  {sending ? 'Posting...' : <><Send size={14} /> Reply</>}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS TAB
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsTab({ userId, liStatus }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/linkedin/analytics/${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

  if (loading) return <div style={{ color: '#475569', textAlign: 'center', padding: 48 }}>Loading analytics...</div>

  const profile = data?.profile || liStatus || {}

  return (
    <div>
      {/* Profile card */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {profile.picture && <img src={profile.picture} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #0A66C2' }} />}
        <div>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 18, marginBottom: 4 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>{profile.email}</div>
          <a href={`https://linkedin.com/in/${profile.person_id}`} target="_blank" rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '5px 12px', background: '#0A66C2', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
            <ArrowUpRight size={12} /> View Profile
          </a>
        </div>
      </div>

      {/* Note about analytics */}
      <div style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>
          📊 LinkedIn Analytics
        </h3>
        <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <p style={{ fontSize: 13, color: '#FBBF24', lineHeight: 1.7, margin: 0 }}>
            <strong>ℹ️ LinkedIn Partner Access Required:</strong> Detailed post analytics (impressions, clicks, engagement rate, follower growth) require LinkedIn Marketing Developer Platform access, which needs business verification. For now, you can track your posts performance directly on LinkedIn.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Platform',  value: 'LinkedIn',      color: '#0A66C2' },
            { label: 'Status',    value: '✅ Connected',  color: '#00E5A0' },
            { label: 'Post Limit','value': '150/day',    color: '#FBBF24' },
            { label: 'API Level', value: 'Basic',         color: '#A78BFA' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(10,102,194,0.1)', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={card}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>🚀 LinkedIn Growth Tips</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Best time to post', 'Tue-Thu, 8-10 AM'],
            ['Optimal length', '1300-2000 characters'],
            ['Hashtags', '3-5 relevant tags'],
            ['Engagement', 'Reply within 1 hour'],
            ['Content mix', '80% value, 20% promo'],
            ['Frequency', '3-5 posts per week'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 12 }}>
              <span style={{ color: '#64748B' }}>{k}</span>
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}