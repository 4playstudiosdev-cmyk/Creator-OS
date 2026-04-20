// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — SWITCHED TO BrowserRouter
//
// WHY: HashRouter (#) breaks Google OAuth because Supabase returns
//      ?code=xxx BEFORE the hash: http://localhost:5173/?code=xxx#/login
//      BrowserRouter uses real paths (/login, /dashboard) so OAuth works.
//
// NETLIFY FIX: Add a _redirects file in /public with:
//      /*  /index.html  200
// This ensures Netlify serves index.html for all routes.
//
// PUBLIC ROUTES (no auth):
//   /              → LandingPage
//   /login         → Login
//   /setup-username→ UsernameSetup (after first signup)
//   /u/:username   → PublicProfile (media kit)
//   /r/:slug       → ROIRedirect   (brand tracking)
//
// PROTECTED ROUTES (need session + username):
//   /dashboard, /schedule, /repurpose, /inbox, /analytics, /ai-tools
//   /deals, /mediakit, /funding, /earnings, /script-studio
//   /youtube-studio, /video-editor, /auto-clip, /pricing, /settings
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

// Pages
import Login          from './pages/Login'
import UsernameSetup  from './pages/UsernameSetup'
import LandingPage    from './pages/LandingPage'
import PublicProfile  from './pages/PublicProfile'
import ROIRedirect    from './pages/ROIRedirect'
import OnboardingPage from './pages/OnboardingPage'

// Auth callbacks (social OAuth)
import TwitterCallback  from './pages/auth/TwitterCallback'
import GoogleCallback   from './pages/auth/GoogleCallback'
import LinkedInCallback from './pages/auth/LinkedInCallback'

// App layouts
import Layout       from './components/Layout'
import AgencyLayout from './components/AgencyLayout'

// App pages
import Dashboard        from './pages/Dashboard'
import SchedulerPage    from './pages/SchedulerPage'
import RepurposePage    from './pages/RepurposePage'
import InboxPage        from './pages/InboxPage'
import AnalyticsPage    from './pages/AnalyticsPage'
import AIToolsPage      from './pages/AIToolsPage'
import BrandDeals       from './pages/BrandDeals'
import MediaKitPage     from './pages/MediaKitPage'
import FundingPage      from './pages/FundingPage'
import EarningsPage     from './pages/EarningsPage'
import ScriptStudioPage from './pages/ScriptStudioPage'
import YouTubeStudioPage from './pages/YouTubeStudioPage'
import VideoEditorPage  from './pages/VideoEditorPage'
import AutoClippingPage from './pages/AutoClippingPage'
import PricingPage      from './pages/PricingPage'
import SettingsPage     from './pages/SettingsPage'
import AgencyPage       from './pages/AgencyPage'
import InstagramPage from './pages/InstagramPage'
import LinkedInPage from './pages/LinkedInPage'

import './index.css'

// ── Loading spinner (dark theme) ──────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#070D0A', gap:14 }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(0,229,160,0.15)', borderTopColor:'#00E5A0', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'#4A6357', fontSize:13, margin:0, fontFamily:'sans-serif' }}>Loading...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
// Checks: logged in? has username? → render children OR redirect
function ProtectedRoute() {
  const [state, setState] = useState('loading') // loading | no-session | no-username | ready

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        if (!cancelled) setState('no-session')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!cancelled) {
        setState(prof?.username ? 'ready' : 'no-username')
      }
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !cancelled) setState('no-session')
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (state === 'loading')     return <Loader />
  if (state === 'no-session')  return <Navigate to="/login"          replace />
  if (state === 'no-username') return <Navigate to="/setup-username" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Router>
      <Routes>

        {/* ── PUBLIC (no auth needed) ── */}
        <Route path="/"                       element={<LandingPage />} />
        <Route path="/login"                  element={<Login />} />
        <Route path="/setup-username"         element={<UsernameSetup />} />
        <Route path="/onboarding"             element={<OnboardingPage />} />
        <Route path="/u/:username"            element={<PublicProfile />} />
        <Route path="/r/:code" element={<ROIRedirect />} />
        <Route path="/auth/twitter/callback"  element={<TwitterCallback />} />
        <Route path="/auth/google/callback"   element={<GoogleCallback />} />
        <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
        <Route path="/instagram" element={<InstagramPage />} />

        {/* ── PROTECTED (must be logged in + have username) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/schedule"       element={<SchedulerPage />} />
            <Route path="/repurpose"      element={<RepurposePage />} />
            <Route path="/inbox"          element={<InboxPage />} />
            <Route path="/analytics"      element={<AnalyticsPage />} />
            <Route path="/ai-tools"       element={<AIToolsPage />} />
            <Route path="/deals"          element={<BrandDeals />} />
            <Route path="/mediakit"       element={<MediaKitPage />} />
            <Route path="/funding"        element={<FundingPage />} />
            <Route path="/earnings"       element={<EarningsPage />} />
            <Route path="/script-studio"  element={<ScriptStudioPage />} />
            <Route path="/youtube-studio" element={<YouTubeStudioPage />} />
            <Route path="/video-editor"   element={<VideoEditorPage />} />
            <Route path="/auto-clip"      element={<AutoClippingPage />} />
            <Route path="/pricing"        element={<PricingPage />} />
            <Route path="/settings"       element={<SettingsPage />} />
            <Route path="/linkedin" element={<LinkedInPage />} />
            
          </Route>

          <Route element={<AgencyLayout />}>
            <Route path="/agency"           element={<AgencyPage />} />
            <Route path="/agency/settings"  element={<SettingsPage />} />
            <Route path="/agency/pricing"   element={<PricingPage />} />
            <Route path="/agency/analytics" element={<AgencyPage />} />
            <Route path="/agency/schedule"  element={<AgencyPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}