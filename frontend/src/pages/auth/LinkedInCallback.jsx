import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LinkedInCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      fetch('http://localhost:8000/api/social/linkedin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('linkedin_token', data.access_token)
            navigate('/settings?connected=linkedin')
          }
        })
        .catch(() => navigate('/settings?error=linkedin'))
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Connecting LinkedIn...</p>
      </div>
    </div>
  )
}