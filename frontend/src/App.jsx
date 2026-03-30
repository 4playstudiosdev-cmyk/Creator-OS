import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import Layout from './components/Layout'
import AgencyLayout from './components/AgencyLayout'
import Dashboard from './pages/Dashboard'
import SchedulerPage from './pages/SchedulerPage'
import MediaKitPage from './pages/MediaKitPage'
import PublicProfile from './pages/PublicProfile'
import ROIRedirect from "./pages/Roiredirect";
import RepurposePage from './pages/RepurposePage'
import BrandDeals from './pages/BrandDeals'
import SettingsPage from './pages/SettingsPage'
import InboxPage from './pages/InboxPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PricingPage from './pages/PricingPage'
import AIToolsPage from './pages/AIToolsPage'
import AgencyPage from './pages/AgencyPage'
import OnboardingPage from './pages/OnboardingPage'
import FundingPage from './pages/FundingPage'
import EarningsPage from './pages/EarningsPage'
import TwitterCallback from './pages/auth/TwitterCallback'
import GoogleCallback from './pages/auth/GoogleCallback'
import LinkedInCallback from './pages/auth/LinkedInCallback'
import ScriptStudioPage from './pages/ScriptStudioPage'
import YouTubeStudioPage from './pages/YouTubeStudioPage'
import VideoEditorPage from './pages/VideoEditorPage'
import AutoClippingPage from './pages/AutoClippingPage'
import './index.css'

// ── IMPORTANT: HashRouter uses /#/path format
// ── So /u/username → /#/u/username in browser
// ── And /r/slug    → /#/r/slug in browser
// ── Both routes are PUBLIC — no auth needed

function ProtectedRoute() {
  const [session,     setSession]     = useState(undefined)
  const [accountType, setAccountType] = useState(undefined)
  const [checking,    setChecking]    = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null)
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', data.session.user.id)
          .single()
        setAccountType(profile?.account_type ?? null)
      } else {
        setAccountType(null)
      }
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSession(null)
        setAccountType(null)
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.15)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#374151', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!session)     return <Navigate to="/login"      replace />
  if (!accountType) return <Navigate to="/onboarding" replace />
  return <Outlet context={{ accountType }} />
}

function IndividualRoute({ children }) {
  const [accountType, setAccountType] = useState(null)
  const [checking,    setChecking]    = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', data.session.user.id)
          .single()
        setAccountType(profile?.account_type ?? null)
      }
      setChecking(false)
    })
  }, [])

  if (checking) return null
  if (accountType === 'agency') return <Navigate to="/agency" replace />
  return children
}

function AgencyRoute({ children }) {
  const [accountType, setAccountType] = useState(null)
  const [checking,    setChecking]    = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', data.session.user.id)
          .single()
        setAccountType(profile?.account_type ?? null)
      }
      setChecking(false)
    })
  }, [])

  if (checking) return null
  if (accountType === 'individual') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Router>
      <Routes>

        {/* ══ PUBLIC ROUTES (no auth) ══ */}
        <Route path="/"                       element={<LandingPage />} />
        <Route path="/login"                  element={<Login />} />
        <Route path="/onboarding"             element={<OnboardingPage />} />

        {/* PUBLIC: Media Kit — /#/u/username */}
        <Route path="/u/:username"            element={<PublicProfile />} />

        {/* PUBLIC: ROI Redirect/Tracking — /#/r/slug */}
        <Route path="/r/:slug"                element={<ROIRedirect />} />

        {/* OAuth Callbacks */}
        <Route path="/auth/twitter/callback"  element={<TwitterCallback />} />
        <Route path="/auth/google/callback"   element={<GoogleCallback />} />
        <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />

        {/* ══ PROTECTED ROUTES ══ */}
        <Route element={<ProtectedRoute />}>

          {/* Individual Creator */}
          <Route element={<Layout />}>
            <Route path="/dashboard"      element={<IndividualRoute><Dashboard /></IndividualRoute>} />
            <Route path="/schedule"       element={<IndividualRoute><SchedulerPage /></IndividualRoute>} />
            <Route path="/repurpose"      element={<IndividualRoute><RepurposePage /></IndividualRoute>} />
            <Route path="/inbox"          element={<IndividualRoute><InboxPage /></IndividualRoute>} />
            <Route path="/analytics"      element={<IndividualRoute><AnalyticsPage /></IndividualRoute>} />
            <Route path="/ai-tools"       element={<IndividualRoute><AIToolsPage /></IndividualRoute>} />
            <Route path="/deals"          element={<IndividualRoute><BrandDeals /></IndividualRoute>} />
            <Route path="/mediakit"       element={<IndividualRoute><MediaKitPage /></IndividualRoute>} />
            <Route path="/funding"        element={<IndividualRoute><FundingPage /></IndividualRoute>} />
            <Route path="/earnings"       element={<IndividualRoute><EarningsPage /></IndividualRoute>} />
            <Route path="/script-studio"  element={<IndividualRoute><ScriptStudioPage /></IndividualRoute>} />
            <Route path="/youtube-studio" element={<IndividualRoute><YouTubeStudioPage /></IndividualRoute>} />
            <Route path="/video-editor"   element={<IndividualRoute><VideoEditorPage /></IndividualRoute>} />
            <Route path="/auto-clip"      element={<IndividualRoute><AutoClippingPage /></IndividualRoute>} />
            <Route path="/pricing"        element={<PricingPage />} />
            <Route path="/settings"       element={<SettingsPage />} />
          </Route>

          {/* Agency */}
          <Route element={<AgencyLayout />}>
            <Route path="/agency"           element={<AgencyRoute><AgencyPage /></AgencyRoute>} />
            <Route path="/agency/settings"  element={<AgencyRoute><SettingsPage /></AgencyRoute>} />
            <Route path="/agency/pricing"   element={<AgencyRoute><PricingPage /></AgencyRoute>} />
            <Route path="/agency/analytics" element={<AgencyRoute><AgencyPage /></AgencyRoute>} />
            <Route path="/agency/schedule"  element={<AgencyRoute><AgencyPage /></AgencyRoute>} />
          </Route>

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}

