import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

export default function CalendarGrid() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState(null)      // ✅ Drag visual feedback
  const [updatingId, setUpdatingId] = useState(null)      // ✅ Backend update feedback
  const [successId, setSuccessId] = useState(null)        // ✅ Success feedback

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return
      const userId = sessionData.session.user.id
      const response = await axios.get(
        `http://localhost:8000/api/posts/user/${userId}`,
        { headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` } }
      )
      setPosts(response.data.data || [])
    } catch (error) {
      console.error("Posts fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const getPostsForDay = (day) => {
    return posts.filter(post => {
      // ✅ Timezone safe comparison
      const postDate = format(new Date(post.scheduled_for), 'yyyy-MM-dd')
      const dayDate = format(day, 'yyyy-MM-dd')
      return postDate === dayDate
    })
  }

  // ✅ Drag shuru hone par
  const handleDragStart = (start) => {
    setDraggingId(start.draggableId)
  }

  // ✅ Drag khatam hone par
  const handleDragEnd = async (result) => {
    setDraggingId(null)
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    // ✅ Timezone safe — local date ko UTC mein convert karo
    const [year, month, day] = destination.droppableId.split('-').map(Number)
    const newDate = new Date(year, month - 1, day, 12, 0, 0) // Noon time set karo timezone issues se bachne ke liye
    const newScheduledFor = newDate.toISOString()

    // ✅ Optimistic UI update — screen foran update ho
    setPosts(prev => prev.map(post =>
      post.id === draggableId
        ? { ...post, scheduled_for: newScheduledFor }
        : post
    ))

    // ✅ Backend update with loading state
    setUpdatingId(draggableId)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      await axios.put(
        `http://localhost:8000/api/posts/${draggableId}/reschedule`,
        { scheduled_for: newScheduledFor },
        {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // ✅ Success feedback — green flash
      setSuccessId(draggableId)
      setTimeout(() => setSuccessId(null), 1500)

    } catch (error) {
      console.error("Reschedule error:", error)
      alert("Post reschedule nahi ho saki! Dobara try karein.")
      fetchPosts() // Error pe original data wapas lo
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >←</button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >Today</button>
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >→</button>
        </div>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading posts...
          </div>
        </div>
      ) : (
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-1">
            {allDays.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayPosts = getPostsForDay(day)
              const isCurrentMonth = format(day, 'MM') === format(currentDate, 'MM')
              const todayStyle = isToday(day)

              return (
                <Droppable droppableId={dayKey} key={dayKey}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[90px] p-1 rounded-lg border transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-50 border-blue-400 scale-[1.02] shadow-sm'
                          : 'border-transparent hover:border-gray-200'
                      } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                    >
                      {/* Day number */}
                      <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        todayStyle ? 'bg-blue-600 text-white' : 'text-gray-500'
                      }`}>
                        {format(day, 'd')}
                      </div>

                      {/* Posts */}
                      {dayPosts.map((post, index) => (
                        <Draggable key={post.id} draggableId={post.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-1 rounded transition-all duration-200 ${
                                snapshot.isDragging
                                  ? 'shadow-xl rotate-2 scale-105 opacity-90'
                                  : ''
                              }`}
                            >
                              {post.platforms.map(platform => (
                                <div
                                  key={`${post.id}-${platform}`}
                                  title={post.content}
                                  className={`text-xs p-1.5 mb-0.5 rounded border truncate cursor-grab transition-all ${
                                    // ✅ Updating state — yellow flash
                                    updatingId === post.id
                                      ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                      // ✅ Success state — green flash
                                      : successId === post.id
                                      ? 'bg-green-100 text-green-700 border-green-300'
                                      // ✅ Normal state
                                      : platform === 'linkedin'
                                      ? 'bg-sky-100 text-sky-700 border-sky-200'
                                      : 'bg-blue-100 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  <span className="font-semibold capitalize block">
                                    {updatingId === post.id ? '⏳ Saving...' 
                                     : successId === post.id ? '✅ Saved!' 
                                     : platform}
                                  </span>
                                  <span className="truncate opacity-80 block">{post.content}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}