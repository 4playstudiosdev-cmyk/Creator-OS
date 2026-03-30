import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import axios from 'axios'

const PLATFORM_STYLES = {
  twitter:    { bg: 'rgba(29,155,240,0.18)',  border: 'rgba(29,155,240,0.4)',  color: '#60b8f5',  label: '𝕏' },
  linkedin:   { bg: 'rgba(0,119,181,0.18)',   border: 'rgba(0,119,181,0.4)',   color: '#5ba8d4',  label: 'in' },
  youtube:    { bg: 'rgba(255,0,0,0.15)',     border: 'rgba(255,80,80,0.4)',   color: '#f87171',  label: '▶' },
  newsletter: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)', color: '#fbbf24',  label: '✉' },
  default:    { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.4)', color: '#a5b4fc',  label: '●' },
}

const ps = (platform) => PLATFORM_STYLES[platform?.toLowerCase()] || PLATFORM_STYLES.default

export default function CalendarGrid() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [updatingId, setUpdatingId]   = useState(null)
  const [successId, setSuccessId]     = useState(null)

  const monthStart    = startOfMonth(currentDate)
  const monthEnd      = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd   = endOfWeek(monthEnd,   { weekStartsOn: 1 })
  const allDays       = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session) return
      const res = await axios.get(
        `' + import.meta.env.VITE_API_URL + '/api/posts/user/${s.session.user.id}`,
        { headers: { Authorization: `Bearer ${s.session.access_token}` } }
      )
      setPosts(res.data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const getPostsForDay = (day) =>
    posts.filter(p =>
      format(new Date(p.scheduled_for), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const [y, m, d] = destination.droppableId.split('-').map(Number)
    const newDate = new Date(y, m - 1, d, 12, 0, 0).toISOString()

    setPosts(prev => prev.map(p => p.id === draggableId ? { ...p, scheduled_for: newDate } : p))
    setUpdatingId(draggableId)

    try {
      const { data: s } = await supabase.auth.getSession()
      await axios.put(
        `' + import.meta.env.VITE_API_URL + '/api/posts/${draggableId}/reschedule`,
        { scheduled_for: newDate },
        { headers: { Authorization: `Bearer ${s.session.access_token}`, 'Content-Type': 'application/json' } }
      )
      setSuccessId(draggableId)
      setTimeout(() => setSuccessId(null), 1200)
    } catch (e) {
      fetchPosts()
    } finally { setUpdatingId(null) }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      padding: '16px 12px',
      fontFamily: "'Syne','DM Sans',sans-serif",
      width: '100%',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        .cal-nav-btn {
          width: 28px; height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #9ca3af; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; transition: all 0.15s;
        }
        .cal-nav-btn:hover { background: rgba(255,255,255,0.08); color: #f0f0f5; }

        .cal-today-btn {
          padding: 4px 12px; border-radius: 8px;
          border: 1px solid rgba(99,102,241,0.3);
          background: rgba(99,102,241,0.1);
          color: #a5b4fc; cursor: pointer;
          font-size: 11px; font-family: 'Syne',sans-serif; font-weight: 600;
          transition: all 0.15s;
        }
        .cal-today-btn:hover { background: rgba(99,102,241,0.2); }

        .cal-cell {
          min-height: 80px;
          padding: 4px 3px;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.15s;
          overflow: hidden;
        }
        .cal-cell.drag-over {
          background: rgba(99,102,241,0.08) !important;
          border-color: rgba(99,102,241,0.35) !important;
        }

        .post-chip {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px 5px;
          border-radius: 5px;
          margin-bottom: 2px;
          cursor: grab;
          overflow: hidden;
          transition: opacity 0.15s;
          max-width: 100%;
        }
        .post-chip:hover { opacity: 0.85; }
        .post-chip:active { cursor: grabbing; }

        .chip-icon {
          font-size: 8px;
          flex-shrink: 0;
          font-weight: 700;
        }
        .chip-text {
          font-size: 9px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
          font-family: 'DM Sans', sans-serif;
        }
        .more-badge {
          font-size: 9px;
          color: #4b5563;
          padding: 1px 4px;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f5', fontFamily: 'Syne' }}>
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="cal-nav-btn" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>←</button>
          <button className="cal-today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="cal-nav-btn" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>→</button>
        </div>
      </div>

      {/* ── Weekday headers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {weekDays.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700,
            color: '#4b5563', padding: '3px 0',
            fontFamily: 'DM Sans', letterSpacing: 0.5, textTransform: 'uppercase',
          }}>{d}</div>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, flexDirection: 'column', gap: 10 }}>
          <div style={{ width: 22, height: 22, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 12, color: '#4b5563', fontFamily: 'DM Sans' }}>Loading...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {allDays.map(day => {
              const dayKey      = format(day, 'yyyy-MM-dd')
              const dayPosts    = getPostsForDay(day)
              const isCurMonth  = format(day, 'MM') === format(currentDate, 'MM')
              const today       = isToday(day)
              const MAX_VISIBLE = 3
              const visible     = dayPosts.slice(0, MAX_VISIBLE)
              const extra       = dayPosts.length - MAX_VISIBLE

              // Flatten: one chip per platform per post
              const chips = visible.flatMap(post =>
                (post.platforms || []).map(platform => ({ post, platform }))
              )

              return (
                <Droppable droppableId={dayKey} key={dayKey}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`cal-cell ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                      style={{ opacity: isCurMonth ? 1 : 0.2 }}
                    >
                      {/* Day number */}
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, marginBottom: 3,
                        background: today ? '#6366f1' : 'transparent',
                        color: today ? '#fff' : '#6b7280',
                        fontFamily: 'DM Sans',
                      }}>
                        {format(day, 'd')}
                      </div>

                      {/* Post chips */}
                      {chips.map(({ post, platform }, idx) => {
                        const style = updatingId === post.id
                          ? { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24', label: '⏳' }
                          : successId === post.id
                          ? { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#6ee7b7', label: '✅' }
                          : ps(platform)

                        return (
                          <Draggable key={`${post.id}-${platform}-${idx}`} draggableId={post.id} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="post-chip"
                                title={`${platform}: ${post.content}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  background: style.bg,
                                  border: `1px solid ${style.border}`,
                                  opacity: snapshot.isDragging ? 0.85 : 1,
                                  boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
                                  transform: snapshot.isDragging
                                    ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                    : provided.draggableProps.style?.transform,
                                }}
                              >
                                <span className="chip-icon" style={{ color: style.color }}>{style.label}</span>
                                <span className="chip-text" style={{ color: style.color }}>
                                  {post.content?.slice(0, 18) || '...'}
                                </span>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}

                      {extra > 0 && (
                        <div className="more-badge">+{extra} more</div>
                      )}

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

