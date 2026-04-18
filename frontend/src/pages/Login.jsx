// Login.jsx
// Google button = ONE button for both new AND returning users.
// Supabase handles it: if new user → creates account, if existing → logs in.
// After auth → check username → route to /setup-username OR /dashboard.
//
// Race condition fix: after SIGNED_IN we wait 800ms before checking profile,
// giving Supabase trigger time to insert the profile row.

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [mode,     setMode]     = useState('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [msg,      setMsg]      = useState({ text: '', type: '' })
  const navigate = useNavigate()
  const routed   = useRef(false)

  // ── Route user after any successful auth ──────────────────────────────────
  // Wait a beat so the DB trigger has time to insert the profile row,
  // then check if username exists → setup-username or dashboard
  const goNext = async (userId) => {
    if (routed.current) return
    routed.current = true

    // Small delay — lets Supabase trigger finish inserting the profile row
    await new Promise(r => setTimeout(r, 800))

    const { data: prof } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()

    // If no row at all OR username is null/empty → new user, needs setup
    if (!prof || !prof.username) {
      navigate('/setup-username', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  // ── Save profile (email, name, avatar) ────────────────────────────────────
  const saveProfile = async (session) => {
    const u    = session.user
    const meta = u.user_metadata || {}
    await supabase.from('profiles').upsert({
      id:         u.id,
      email:      u.email,
      full_name:  meta.full_name || meta.name || name || '',
      avatar_url: meta.avatar_url || meta.picture || '',
      provider:   u.app_metadata?.provider || 'email',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  // ── On mount ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // Already logged in → route them away
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goNext(session.user.id)
    })

    // Fires when Google OAuth redirects back to /login
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && !routed.current) {
          await saveProfile(session)
          await goNext(session.user.id)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ── Email / Password ───────────────────────────────────────────────────────
  const handleAuth = async () => {
    if (!email || !password) {
      setMsg({ text: 'Please enter your email and password.', type: 'error' })
      return
    }
    setLoading(true)
    setMsg({ text: '', type: '' })
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        if (data.session) {
          await saveProfile(data.session)
          await goNext(data.session.user.id)
        } else {
          // Email confirmation ON
          setMsg({ text: '✉️ Check your inbox and click the confirmation link.', type: 'success' })
          setLoading(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await saveProfile(data.session)
        await goNext(data.session.user.id)
      }
    } catch (e) {
      setMsg({ text: e.message, type: 'error' })
      setLoading(false)
    }
  }

  // ── Google — ONE button for both signup and login ─────────────────────────
  // Supabase automatically handles:
  //   • New Google user  → creates account + returns session
  //   • Existing user    → logs in + returns session
  // After redirect back to /login, onAuthStateChange fires → goNext() routes
  const handleGoogle = async () => {
    setGLoading(true)
    setMsg({ text: '', type: '' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    })
    if (error) {
      setMsg({ text: error.message, type: 'error' })
      setGLoading(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <div className="lp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;}
        .lp{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070D0A;padding:24px;position:relative;overflow:hidden;font-family:'Instrument Sans',system-ui,sans-serif;}
        .lp-g1{position:fixed;top:-20%;right:-10%;width:60vw;height:60vh;border-radius:50%;background:radial-gradient(ellipse,rgba(0,180,120,0.07) 0%,transparent 70%);pointer-events:none;}
        .lp-g2{position:fixed;bottom:-15%;left:-10%;width:50vw;height:50vh;border-radius:50%;background:radial-gradient(ellipse,rgba(0,229,160,0.05) 0%,transparent 60%);pointer-events:none;}
        .lp-grid{position:fixed;inset:0;pointer-events:none;opacity:0.025;background-image:linear-gradient(#00E5A0 1px,transparent 1px),linear-gradient(90deg,#00E5A0 1px,transparent 1px);background-size:80px 80px;}
        .lp-card{position:relative;z-index:1;width:100%;max-width:420px;background:rgba(15,26,20,0.94);backdrop-filter:blur(24px);border:1px solid rgba(0,229,160,0.14);border-radius:20px;padding:40px 36px;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
        .lp-logo{display:flex;align-items:center;gap:12px;margin-bottom:28px;}
        .lp-logo img{width:40px;height:40px;border-radius:10px;object-fit:contain;box-shadow:0 4px 14px rgba(0,229,160,0.3);}
        .lp-logo-fb{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#00E5A0,#00B87A);display:none;align-items:center;justify-content:center;font-size:20px;}
        .lp-logo-name{font-family:'Cabinet Grotesk',sans-serif;font-size:21px;font-weight:900;color:#fff;letter-spacing:-0.02em;}
        .lp-logo-name span{color:#00E5A0;}

        /* ── Google button — full width, prominent ── */
        .lp-google{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 16px;background:#fff;border:none;border-radius:12px;cursor:pointer;font-size:15px;font-weight:600;color:#1a1a1a;font-family:'Instrument Sans',sans-serif;transition:background 0.15s,box-shadow 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
        .lp-google:hover:not(:disabled){background:#f0f0f0;box-shadow:0 4px 16px rgba(0,0,0,0.2);}
        .lp-google:disabled{opacity:0.55;cursor:not-allowed;}
        .lp-google-badge{font-size:11px;color:#666;font-weight:400;margin-left:4px;}

        .lp-h1{font-family:'Cabinet Grotesk',sans-serif;font-size:24px;font-weight:800;color:#fff;margin:0 0 6px;letter-spacing:-0.02em;}
        .lp-sub{font-size:14px;color:#7A9E8E;line-height:1.6;margin:0 0 22px;}
        .lp-div{display:flex;align-items:center;gap:10px;margin:20px 0 16px;}
        .lp-div-line{flex:1;height:1px;background:rgba(0,229,160,0.1);}
        .lp-div-txt{font-size:12px;color:#4A6357;white-space:nowrap;}
        .lp-field{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;}
        .lp-lbl{font-size:13px;font-weight:600;color:#9DC4B0;}
        .lp-inp{width:100%;padding:11px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,160,0.12);border-radius:10px;color:#D8EEE5;font-size:14px;outline:none;transition:border-color 0.18s,background 0.18s;font-family:'Instrument Sans',sans-serif;}
        .lp-inp:focus{border-color:rgba(0,229,160,0.45);background:rgba(0,229,160,0.05);}
        .lp-inp::placeholder{color:#4A6357;}
        .lp-alert{padding:11px 14px;border-radius:10px;border:1px solid;font-size:13px;line-height:1.6;margin-bottom:12px;}
        .lp-alert.s{background:rgba(0,229,160,0.08);border-color:rgba(0,229,160,0.3);color:#00E5A0;}
        .lp-alert.e{background:rgba(248,113,113,0.08);border-color:rgba(248,113,113,0.3);color:#F87171;}
        .lp-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;background:#00E5A0;color:#070D0A;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;font-family:'Instrument Sans',sans-serif;transition:opacity 0.15s;}
        .lp-btn:hover:not(:disabled){opacity:0.88;}
        .lp-btn:disabled{opacity:0.55;cursor:not-allowed;}
        .lp-sp{width:15px;height:15px;border-radius:50%;border:2.5px solid rgba(7,13,10,0.2);border-top-color:#070D0A;display:inline-block;animation:lsp 0.7s linear infinite;}
        .lp-sp-w{width:15px;height:15px;border-radius:50%;border:2.5px solid rgba(26,26,26,0.2);border-top-color:#1a1a1a;display:inline-block;animation:lsp 0.7s linear infinite;}
        @keyframes lsp{to{transform:rotate(360deg)}}
        .lp-toggle{text-align:center;font-size:13px;color:#4A6357;margin-top:16px;}
        .lp-toggle button{background:none;border:none;cursor:pointer;color:#00E5A0;font-weight:600;font-size:13px;font-family:'Instrument Sans',sans-serif;}
        .lp-back{text-align:center;margin-top:8px;}
        .lp-back a{font-size:12px;color:#4A6357;text-decoration:none;}
        .lp-back a:hover{color:#9DC4B0;}
      `}</style>

      <div className="lp-g1" /><div className="lp-g2" /><div className="lp-grid" />

      <div className="lp-card">
        {/* Logo */}
        <div className="lp-logo">
          <img src="/logo.png" alt="Nexora OS"
            onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex' }} />
          <div className="lp-logo-fb">⚡</div>
          <div className="lp-logo-name">Nexora <span>OS</span></div>
        </div>

        <h2 className="lp-h1">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p className="lp-sub">
          {isSignup ? 'Your creator business command center awaits.' : 'Sign in to your creator command center.'}
        </p>

        {/* ── Google button — SINGLE button for signup AND login ── */}
        <button className="lp-google" onClick={handleGoogle} disabled={gLoading || loading}>
          {gLoading
            ? <span className="lp-sp-w" />
            : <svg width="20" height="20" viewBox="0 0 48 48" style={{flexShrink:0}}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
          }
          <span>
            {gLoading ? 'Connecting...' : 'Continue with Google'}
            {!gLoading && <span className="lp-google-badge">— sign up or sign in</span>}
          </span>
        </button>

        {/* Divider */}
        <div className="lp-div">
          <div className="lp-div-line" />
          <span className="lp-div-txt">or use email & password</span>
          <div className="lp-div-line" />
        </div>

        {/* Email form */}
        {isSignup && (
          <div className="lp-field">
            <label className="lp-lbl">Full Name</label>
            <input className="lp-inp" type="text" value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
        )}
        <div className="lp-field">
          <label className="lp-lbl">Email</label>
          <input className="lp-inp" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            placeholder="creator@example.com" />
        </div>
        <div className="lp-field">
          <label className="lp-lbl">Password</label>
          <input className="lp-inp" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            placeholder="••••••••" />
        </div>

        {msg.text && (
          <div className={`lp-alert ${msg.type === 'success' ? 's' : 'e'}`}>{msg.text}</div>
        )}

        <button className="lp-btn" onClick={handleAuth} disabled={loading || gLoading}>
          {loading && <span className="lp-sp" />}
          {loading ? (isSignup ? 'Creating...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
        </button>

        <p className="lp-toggle">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => {
            setMode(isSignup ? 'signin' : 'signup')
            setMsg({ text:'', type:'' })
            routed.current = false
          }}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
        <div className="lp-back"><Link to="/">← Back to home</Link></div>
      </div>
    </div>
  )
}