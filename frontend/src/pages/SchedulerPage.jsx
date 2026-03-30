import { useState } from 'react'
import PostComposer from '../components/scheduler/PostComposer'
import CalendarGrid from '../components/calendar/CalendarGrid'

export default function SchedulerPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans', marginBottom: 4 }}>Manage your content</p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-1px', lineHeight: 1.1 }}>
          Content Hub 📅
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, fontFamily: 'DM Sans' }}>
          Write, schedule, and manage your content across platforms.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        <PostComposer onPostSaved={() => setRefreshKey(k => k + 1)} />
        <CalendarGrid key={refreshKey} />
      </div>
    </div>
  )
}

