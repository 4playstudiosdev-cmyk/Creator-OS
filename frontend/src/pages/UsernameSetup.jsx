// UsernameSetup.jsx
// Shown ONCE after first signup when user has no username yet.
// Step 1: username (real-time availability check)
// Step 2: niche + platform
// Saves to profiles table using only columns that exist, then → /dashboard

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function UsernameSetup() {
  const [step,        setStep]        = useState(1)
  const [userId,      setUserId]      = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username,    setUsername]    = useState('')
  const [avail,       setAvail]       = useState('idle') // idle|checking|ok|taken
  const [niche,       setNiche]       = useState('')
  const [platform,    setPlatform]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [err,         setErr]         = useState('')
  const timer = useRef(null)
  const navigate = useNavigate()

  const NICHES = [
    'Gaming','Tech & Coding','Education','Lifestyle',
    'Fitness','Food & Cooking','Travel','Finance',
    'Fashion','Music','Comedy','News','Other',
  ]
  const PLATFORMS = [
    {id:'youtube',   name:'YouTube',   icon:'▶'},
    {id:'instagram', name:'Instagram', icon:'📷'},
    {id:'tiktok',    name:'TikTok',    icon:'🎵'},
    {id:'twitter',   name:'Twitter/X', icon:'✕'},
    {id:'linkedin',  name:'LinkedIn',  icon:'💼'},
    {id:'twitch',    name:'Twitch',    icon:'🎮'},
  ]

  // ── Get current user on mount ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) { navigate('/login', { replace: true }); return }

      setUserId(user.id)

      // Pre-fill name from Google metadata if available
      const meta = user.user_metadata || {}
      setDisplayName(meta.full_name || meta.name || '')

      // Suggest username from email prefix
      const suggested = (user.email || '')
        .split('@')[0].toLowerCase()
        .replace(/[^a-z0-9_]/g, '_').slice(0, 25)
      setUsername(suggested)

      // If they already completed setup (e.g. hit back button), skip to dashboard
      supabase.from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.username) navigate('/dashboard', { replace: true })
        })
    })
  }, [])

  // ── Debounced username availability check ──────────────────────────────────
  useEffect(() => {
    if (!username || username.length < 3 || !userId) {
      setAvail('idle'); return
    }
    setAvail('checking')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', userId)
        .maybeSingle()
      setAvail(data ? 'taken' : 'ok')
    }, 600)
    return () => clearTimeout(timer.current)
  }, [username, userId])

  const onUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 25)
    setUsername(clean)
    setErr('')
  }

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────
  const goStep2 = () => {
    if (username.length < 3)   { setErr('At least 3 characters required.'); return }
    if (avail === 'checking')  { setErr('Please wait for availability check.'); return }
    if (avail === 'taken')     { setErr('Username taken. Try another.'); return }
    if (avail !== 'ok')        { setErr('Please wait for availability check.'); return }
    setErr(''); setStep(2)
  }

  // ── Save → dashboard ───────────────────────────────────────────────────────
  // IMPORTANT: Only update columns we KNOW exist in the table.
  // Do NOT include email here — it's handled by Login.jsx's saveProfile().
  const finish = async () => {
    if (!niche)    { setErr('Please pick a niche.');    return }
    if (!platform) { setErr('Please pick a platform.'); return }
    setErr(''); setSaving(true)

    // Use UPDATE instead of upsert to avoid touching columns that may not exist
    const { error } = await supabase
      .from('profiles')
      .update({
        username:         username.toLowerCase().trim(),
        full_name:        displayName.trim(),
        niche,
        primary_platform: platform,
        account_type:     'individual',
        updated_at:       new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      // If update fails (row doesn't exist yet), try insert
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id:               userId,
          username:         username.toLowerCase().trim(),
          full_name:        displayName.trim(),
          niche,
          primary_platform: platform,
          account_type:     'individual',
          updated_at:       new Date().toISOString(),
        })

      if (insertErr) {
        setErr(insertErr.message)
        setSaving(false)
        return
      }
    }

    navigate('/dashboard', { replace: true })
  }

  // ── Availability display ───────────────────────────────────────────────────
  const availColor = { idle:'#4A6357', checking:'#7A9E8E', ok:'#00E5A0', taken:'#F87171' }
  const availMsg   = {
    idle: '', checking: '⏳ Checking...',
    ok:   `✓ @${username} is available`,
    taken:`✗ @${username} is taken`,
  }

  return (
    <div className="su-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;}
        .su-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070D0A;padding:24px;font-family:'Instrument Sans',system-ui,sans-serif;position:relative;overflow:hidden;}
        .su-glow{position:fixed;top:-20%;right:-10%;width:60vw;height:60vh;border-radius:50%;background:radial-gradient(ellipse,rgba(0,180,120,0.07) 0%,transparent 70%);pointer-events:none;}
        .su-grid{position:fixed;inset:0;pointer-events:none;opacity:0.025;background-image:linear-gradient(#00E5A0 1px,transparent 1px),linear-gradient(90deg,#00E5A0 1px,transparent 1px);background-size:80px 80px;}
        .su-card{position:relative;z-index:1;width:100%;max-width:480px;background:rgba(15,26,20,0.94);backdrop-filter:blur(24px);border:1px solid rgba(0,229,160,0.14);border-radius:20px;padding:42px 38px;box-shadow:0 24px 80px rgba(0,0,0,0.6);}
        .su-logo{display:flex;align-items:center;gap:10px;margin-bottom:26px;}
        .su-logo img{width:36px;height:36px;border-radius:9px;object-fit:contain;box-shadow:0 3px 12px rgba(0,229,160,0.25);}
        .su-logo-fb{width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#00E5A0,#00B87A);display:none;align-items:center;justify-content:center;font-size:17px;}
        .su-logo-txt{font-family:'Cabinet Grotesk',sans-serif;font-size:18px;font-weight:900;color:#fff;letter-spacing:-0.02em;}
        .su-logo-txt span{color:#00E5A0;}
        .su-prog{display:flex;gap:6px;margin-bottom:24px;}
        .su-bar{flex:1;height:3px;border-radius:2px;transition:background 0.3s;}
        .su-bar.on{background:#00E5A0;} .su-bar.off{background:rgba(0,229,160,0.12);}
        .su-chip{font-size:11px;font-weight:700;color:#00E5A0;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;}
        .su-h1{font-family:'Cabinet Grotesk',sans-serif;font-size:25px;font-weight:800;color:#fff;margin:0 0 8px;letter-spacing:-0.02em;}
        .su-sub{font-size:13.5px;color:#7A9E8E;margin:0 0 24px;line-height:1.6;}
        .su-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
        .su-lbl{font-size:13px;font-weight:600;color:#9DC4B0;}
        .su-wrap{position:relative;}
        .su-at{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;color:#4A6357;pointer-events:none;user-select:none;}
        .su-inp{width:100%;padding:11px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(0,229,160,0.12);border-radius:10px;color:#D8EEE5;font-size:14px;outline:none;transition:border-color 0.18s,background 0.18s;font-family:'Instrument Sans',sans-serif;}
        .su-inp:focus{border-color:rgba(0,229,160,0.45);background:rgba(0,229,160,0.05);}
        .su-inp::placeholder{color:#4A6357;}
        .su-inp.pfx{padding-left:26px;}
        .su-inp.ok{border-color:rgba(0,229,160,0.4);}
        .su-inp.bad{border-color:rgba(248,113,113,0.4);}
        .su-hint{font-size:12px;font-weight:500;margin-top:4px;}
        .su-sec{font-size:13px;font-weight:600;color:#9DC4B0;margin-bottom:10px;display:block;}
        .su-niches{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:20px;}
        .su-nb{padding:9px 4px;background:rgba(255,255,255,0.03);border:1px solid rgba(0,229,160,0.1);border-radius:8px;color:#7A9E8E;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;text-align:center;font-family:'Instrument Sans',sans-serif;}
        .su-nb:hover{background:rgba(0,229,160,0.05);border-color:rgba(0,229,160,0.2);color:#9DC4B0;}
        .su-nb.on{background:rgba(0,229,160,0.1);border-color:#00E5A0;color:#00E5A0;font-weight:600;}
        .su-plats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:22px;}
        .su-pb{padding:14px 6px;background:rgba(255,255,255,0.03);border:1px solid rgba(0,229,160,0.1);border-radius:10px;color:#7A9E8E;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;display:flex;flex-direction:column;align-items:center;gap:5px;font-family:'Instrument Sans',sans-serif;}
        .su-pb:hover{background:rgba(0,229,160,0.05);border-color:rgba(0,229,160,0.2);}
        .su-pb.on{background:rgba(0,229,160,0.1);border-color:#00E5A0;color:#00E5A0;font-weight:600;}
        .su-pb-ic{font-size:20px;}
        .su-err{padding:10px 14px;border-radius:10px;border:1px solid rgba(248,113,113,0.3);background:rgba(248,113,113,0.06);color:#F87171;font-size:13px;margin-bottom:12px;}
        .su-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 16px;background:#00E5A0;color:#070D0A;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;font-family:'Instrument Sans',sans-serif;transition:opacity 0.15s;}
        .su-btn:hover:not(:disabled){opacity:0.88;}
        .su-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .su-back{width:100%;padding:11px;background:transparent;color:#7A9E8E;border:1px solid rgba(0,229,160,0.1);border-radius:10px;cursor:pointer;font-size:14px;font-family:'Instrument Sans',sans-serif;margin-top:10px;transition:all 0.15s;}
        .su-back:hover{border-color:rgba(0,229,160,0.25);color:#9DC4B0;}
        .su-sp{width:15px;height:15px;border-radius:50%;border:2.5px solid rgba(7,13,10,0.2);border-top-color:#070D0A;display:inline-block;animation:susp 0.7s linear infinite;}
        @keyframes susp{to{transform:rotate(360deg)}}
      `}</style>

      <div className="su-glow" /><div className="su-grid" />

      <div className="su-card">
        {/* Logo */}
        <div className="su-logo">
          <img src="/logo.png" alt="Nexora OS"
            onError={(e) => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex' }} />
          <div className="su-logo-fb">⚡</div>
          <div className="su-logo-txt">Nexora <span>OS</span></div>
        </div>

        {/* Progress */}
        <div className="su-prog">
          <div className={`su-bar ${step >= 1 ? 'on' : 'off'}`} />
          <div className={`su-bar ${step >= 2 ? 'on' : 'off'}`} />
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && <>
          <div className="su-chip">Step 1 of 2</div>
          <h2 className="su-h1">Choose your username</h2>
          <p className="su-sub">
            Your public media kit → <strong style={{color:'#00E5A0'}}>nexoraos.online/u/username</strong>
          </p>

          <div className="su-field">
            <label className="su-lbl">Display Name</label>
            <input className="su-inp" type="text" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How brands will see you" />
          </div>

          <div className="su-field">
            <label className="su-lbl">Username</label>
            <div className="su-wrap">
              <span className="su-at">@</span>
              <input
                className={`su-inp pfx ${avail === 'ok' ? 'ok' : avail === 'taken' ? 'bad' : ''}`}
                type="text" value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="yourhandle" maxLength={25}
              />
            </div>
            {username.length > 0 && username.length < 3 && (
              <div className="su-hint" style={{color:'#4A6357'}}>Minimum 3 characters</div>
            )}
            {username.length >= 3 && avail !== 'idle' && (
              <div className="su-hint" style={{color: availColor[avail]}}>{availMsg[avail]}</div>
            )}
          </div>

          {err && <div className="su-err">{err}</div>}

          <button className="su-btn" onClick={goStep2}
            disabled={avail !== 'ok' || username.length < 3}>
            Continue →
          </button>
        </>}

        {/* ── STEP 2 ── */}
        {step === 2 && <>
          <div className="su-chip">Step 2 of 2</div>
          <h2 className="su-h1">About your content</h2>
          <p className="su-sub">Helps us personalise AI suggestions for your channel.</p>

          <span className="su-sec">Your content niche</span>
          <div className="su-niches">
            {NICHES.map(n => (
              <button key={n} className={`su-nb ${niche === n ? 'on' : ''}`}
                onClick={() => { setNiche(n); setErr('') }}>{n}</button>
            ))}
          </div>

          <span className="su-sec">Primary platform</span>
          <div className="su-plats">
            {PLATFORMS.map(p => (
              <button key={p.id} className={`su-pb ${platform === p.id ? 'on' : ''}`}
                onClick={() => { setPlatform(p.id); setErr('') }}>
                <span className="su-pb-ic">{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          {err && <div className="su-err">{err}</div>}

          <button className="su-btn" onClick={finish}
            disabled={saving || !niche || !platform}>
            {saving && <span className="su-sp" />}
            {saving ? 'Setting up...' : 'Go to Dashboard →'}
          </button>

          <button className="su-back" onClick={() => { setStep(1); setErr('') }}>
            ← Back
          </button>
        </>}
      </div>
    </div>
  )
}