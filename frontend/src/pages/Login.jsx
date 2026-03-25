import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState({ text: '', type: '' })
  const navigate = useNavigate()

  const handleAuth = async () => {
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        setMessage({ text: '✅ Check your email for the confirmation link!', type: 'success' })
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session) navigate('/dashboard')
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAuth()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Syne', 'DM Sans', sans-serif",
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 13px 16px;
          color: #f0f0f5;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .auth-input:focus {
          border-color: rgba(99,102,241,0.7);
          background: rgba(99,102,241,0.05);
        }
        .auth-input::placeholder { color: #4b5563; }

        .tab-btn {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
        }
        .tab-btn:hover:not(.active) { color: #9ca3af; }

        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #a5b4fc, #818cf8, #c4b5fd, #818cf8, #a5b4fc);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Grid noise */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>⚡</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: '#f0f0f5', letterSpacing: '-0.5px' }}>
              Creator <span className="shimmer-text">OS</span>
            </span>
          </Link>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 10, fontFamily: 'DM Sans' }}>
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Join thousands of creators growing faster.'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '32px 28px',
          backdropFilter: 'blur(12px)',
        }}>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 4, marginBottom: 28,
          }}>
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setMessage({ text: '', type: '' }) }}>
              Sign In
            </button>
            <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setMessage({ text: '', type: '' }) }}>
              Sign Up
            </button>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Full Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="creator@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Message */}
            {message.text && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontFamily: 'DM Sans',
                background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: message.type === 'success' ? '#6ee7b7' : '#fca5a5',
              }}>
                {message.text}
              </div>
            )}

            {/* Submit */}
            <button className="btn-primary" onClick={handleAuth} disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>

          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 12, color: '#4b5563', fontFamily: 'DM Sans' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Toggle */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage({ text: '', type: '' }) }}
              style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Back to home */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#4b5563', fontFamily: 'DM Sans' }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back to home</Link>
        </p>

        {/* Features pill */}
        <div style={{
          marginTop: 24, display: 'flex', justifyContent: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          {['✂️ AI Clipping', '📅 Scheduler', '💼 Brand Deals'].map(f => (
            <span key={f} style={{
              fontSize: 11, color: '#4b5563', fontFamily: 'DM Sans',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '5px 10px', borderRadius: 100,
            }}>{f}</span>
          ))}
        </div>

      </div>
    </div>
  )
}