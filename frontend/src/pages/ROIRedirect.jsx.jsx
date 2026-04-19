// src/pages/ROIRedirect.jsx
// ROI Tracking redirect page for Nexora OS Brand Deals

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ROIRedirect() {
  const { code }            = useParams()
  const [status, setStatus] = useState('Tracking your click...')

  useEffect(() => {
    const track = async () => {
      try {
        // Find deal with this tracking code
        const { data: deal } = await supabase
          .from('brand_deals')
          .select('id, redirect_url, user_id')
          .eq('tracking_code', code)
          .maybeSingle()

        if (!deal) {
          setStatus('Link not found.')
          setTimeout(() => { window.location.href = 'https://nexoraos.online' }, 2000)
          return
        }

        // Log the click
        await supabase.from('roi_clicks').insert({
          deal_id:       deal.id,
          user_id:       deal.user_id,
          tracking_code: code,
          referrer:      document.referrer || 'direct',
          clicked_at:    new Date().toISOString(),
        })

        // Redirect
        setStatus('Redirecting...')
        window.location.href = deal.redirect_url || 'https://nexoraos.online'

      } catch {
        setStatus('Redirecting...')
        setTimeout(() => { window.location.href = 'https://nexoraos.online' }, 1000)
      }
    }

    if (code) track()
    else window.location.href = 'https://nexoraos.online'
  }, [code])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#070D0A',
      fontFamily: 'system-ui, sans-serif', gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(0,229,160,0.15)',
        borderTopColor: '#00E5A0',
        animation: 'sp .8s linear infinite',
      }} />
      <p style={{ color: '#9DC4B0', fontSize: 14, margin: 0 }}>{status}</p>
      <style>{`@keyframes sp { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}