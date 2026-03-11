import { useState } from 'react'
import PostComposer from '../components/scheduler/PostComposer'
import CalendarGrid from '../components/calendar/CalendarGrid'

export default function SchedulerPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Hub</h1>
        <p className="text-gray-500 mt-1">Write, schedule, and manage your content across platforms.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PostComposer onPostSaved={() => setRefreshKey(k => k + 1)} />
        </div>
        <div className="lg:col-span-2">
          <CalendarGrid key={refreshKey} />
        </div>
      </div>
    </div>
  )
}