import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabaseClient'
import axios from 'axios'

const COLUMNS = [
  { id:'lead',        label:'Leads',            dot:'#6b7280', colBg:'rgba(107,114,128,0.08)',  colBorder:'rgba(107,114,128,0.2)'  },
  { id:'negotiating', label:'Negotiating',       dot:'#f59e0b', colBg:'rgba(245,158,11,0.08)',  colBorder:'rgba(245,158,11,0.25)'  },
  { id:'active',      label:'Content Creation',  dot:'#6366f1', colBg:'rgba(99,102,241,0.08)',  colBorder:'rgba(99,102,241,0.25)'  },
  { id:'completed',   label:'Live',              dot:'#8b5cf6', colBg:'rgba(139,92,246,0.08)',  colBorder:'rgba(139,92,246,0.25)'  },
  { id:'paid',        label:'Paid',              dot:'#10b981', colBg:'rgba(16,185,129,0.08)',  colBorder:'rgba(16,185,129,0.25)'  },
]

const EMPTY_DEAL = { brand_name:'', contact_email:'', amount:'', deliverables:'', status:'lead', due_date:'' }

// ══ Invoice — stays white for print ══════════════════════════════════════════
function InvoiceView({ deal, profile, onClose }) {
  const invoiceNumber = 'INV-' + Date.now().toString().slice(-6)
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 80px rgba(0,0,0,0.5)' }}>
        <div className="print:hidden" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f0f0f0' }}>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:15, color:'#111' }}>Invoice Preview</h2>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => window.print()} style={{ padding:'8px 16px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Syne' }}>🖨️ Print / Save PDF</button>
            <button onClick={onClose} style={{ padding:'8px 14px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>Close</button>
          </div>
        </div>
        <div style={{ padding:36 }} id="invoice-content">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#6366f1', fontFamily:'Syne' }}>Creator OS</h1>
              <p style={{ fontSize:13, color:'#6b7280', marginTop:4 }}>{profile?.full_name || 'Creator'}</p>
              {profile?.username && <p style={{ fontSize:11, color:'#9ca3af' }}>@{profile.username}</p>}
            </div>
            <div style={{ textAlign:'right' }}>
              <h2 style={{ fontSize:28, fontWeight:900, color:'#111', fontFamily:'Syne' }}>INVOICE</h2>
              <p style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>#{invoiceNumber}</p>
              <p style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{today}</p>
            </div>
          </div>
          <div style={{ borderTop:'2px solid #6366f1', marginBottom:24 }}/>
          <div style={{ marginBottom:22 }}>
            <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Bill To</p>
            <p style={{ fontSize:17, fontWeight:800, color:'#111' }}>{deal.brand_name}</p>
            {deal.contact_email && <p style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>{deal.contact_email}</p>}
          </div>
          <table style={{ width:'100%', marginBottom:28, borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f9fafb' }}>
                <th style={{ textAlign:'left', fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, padding:'10px 14px' }}>Description</th>
                <th style={{ textAlign:'right', fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, padding:'10px 14px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom:'1px solid #f0f0f0' }}>
                <td style={{ padding:'14px' }}>
                  <p style={{ fontWeight:600, color:'#111', fontSize:14 }}>Sponsorship / Brand Deal</p>
                  {deal.deliverables && <p style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>{deal.deliverables}</p>}
                </td>
                <td style={{ padding:'14px', textAlign:'right', fontWeight:700, fontSize:14, color:'#111' }}>${parseFloat(deal.amount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:24 }}>
            <div style={{ background:'#6366f1', color:'#fff', borderRadius:14, padding:'14px 24px', minWidth:200, display:'flex', justifyContent:'space-between', alignItems:'center', gap:24 }}>
              <span style={{ fontWeight:600, fontSize:14 }}>Total Due</span>
              <span style={{ fontWeight:900, fontSize:22, fontFamily:'Syne' }}>${parseFloat(deal.amount).toLocaleString()}</span>
            </div>
          </div>
          {deal.due_date && (
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'10px 14px', marginBottom:20 }}>
              <p style={{ fontSize:13, color:'#c2410c', fontWeight:600 }}>
                Payment Due: {new Date(deal.due_date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
              </p>
            </div>
          )}
          <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:16, textAlign:'center' }}>
            <p style={{ fontSize:11, color:'#9ca3af' }}>Thank you for your business! 🙏</p>
            <p style={{ fontSize:10, color:'#d1d5db', marginTop:3 }}>Generated by Creator OS</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══ Main Component ════════════════════════════════════════════════════════════
export default function BrandDeals() {
  const [deals,       setDeals]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [formData,    setFormData]    = useState(EMPTY_DEAL)
  const [saving,      setSaving]      = useState(false)
  const [session,     setSession]     = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [invoiceDeal, setInvoiceDeal] = useState(null)

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)) }, [])
  useEffect(() => { if (session) fetchProfile() }, [session])

  const fetchProfile = async () => {
    try {
      const { data } = await supabase.from('profiles').select('full_name, username').eq('id', session.user.id).single()
      if (data) setProfile(data)
    } catch {}
  }

  const fetchDeals = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:8000/api/deals/user/${session.user.id}`, { headers: { Authorization:'Bearer '+session.access_token } })
      setDeals(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { if (session) fetchDeals() }, [session, fetchDeals])

  const getCol = (id) => deals.filter(d => d.status === id)

  const handleDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return
    const newStatus = destination.droppableId
    setDeals(prev => prev.map(d => d.id === draggableId ? { ...d, status: newStatus } : d))
    try {
      await axios.put(`http://localhost:8000/api/deals/${draggableId}/status`, { status: newStatus }, { headers: { Authorization:'Bearer '+session.access_token } })
    } catch { fetchDeals() }
  }

  const handleAddDeal = async () => {
    if (!formData.brand_name.trim()) return
    setSaving(true)
    try {
      await axios.post('http://localhost:8000/api/deals/create', {
        brand_name: formData.brand_name, contact_email: formData.contact_email,
        amount: parseFloat(formData.amount)||0, deliverables: formData.deliverables,
        status: formData.status, due_date: formData.due_date||null,
      }, { headers: { Authorization:'Bearer '+session.access_token } })
      setShowModal(false); setFormData(EMPTY_DEAL); fetchDeals()
    } catch (e) { alert('Error: '+e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Ye deal delete karein?')) return
    try {
      await axios.delete(`http://localhost:8000/api/deals/${id}`, { headers: { Authorization:'Bearer '+session.access_token } })
      setDeals(prev => prev.filter(d => d.id !== id))
    } catch (e) { alert('Delete nahi hua: '+e.message) }
  }

  const totalValue = deals.reduce((s,d) => s+(parseFloat(d.amount)||0), 0)
  const paidValue  = deals.filter(d=>d.status==='paid').reduce((s,d) => s+(parseFloat(d.amount)||0), 0)

  const card = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16 }
  const inp  = {
    width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:10, padding:'9px 12px', color:'#f0f0f5', fontFamily:"'DM Sans',sans-serif",
    fontSize:13, outline:'none', boxSizing:'border-box', colorScheme:'dark',
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:'#f0f0f5' }}>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        .bd-btn { cursor:pointer; border:none; font-family:'Syne',sans-serif; font-weight:700; transition:all .18s; }
        .bd-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
        .bd-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; filter:none; }
        .bd-inp:focus { border-color:rgba(99,102,241,0.5) !important; }
        .bd-inp::placeholder { color:#374151; }
        .deal-card { transition:all .18s; cursor:grab; }
        .deal-card:hover { background:rgba(255,255,255,0.06) !important; }
        .kanban-scroll::-webkit-scrollbar { height:4px; }
        .kanban-scroll::-webkit-scrollbar-track { background:transparent; }
        .kanban-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:100px; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <p style={{ fontSize:12, color:'#6b7280', letterSpacing:1, textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>Pipeline</p>
          <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, letterSpacing:'-0.5px', marginBottom:4 }}>Brand Deals 💰</h1>
          <p style={{ fontSize:13, color:'#6b7280' }}>Apni sponsorships aur brand deals manage karein</p>
        </div>
        <button className="bd-btn" onClick={() => setShowModal(true)} style={{
          padding:'11px 22px', borderRadius:14, fontSize:14,
          background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
          boxShadow:'0 4px 20px rgba(99,102,241,0.35)',
        }}>+ New Deal</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Deals',    value:deals.length,              color:'#f0f0f5', suffix:'' },
          { label:'Pipeline Value', value:'$'+totalValue.toLocaleString(), color:'#a5b4fc', suffix:'' },
          { label:'Paid Out',       value:'$'+paidValue.toLocaleString(),  color:'#6ee7b7', suffix:'' },
        ].map((s,i) => (
          <div key={i} style={{ ...card, padding:'16px 20px', textAlign:'center' }}>
            <p style={{ fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, fontWeight:700, marginBottom:8 }}>{s.label}</p>
            <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:24, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}>
          <div style={{ width:32, height:32, border:'2px solid rgba(99,102,241,0.3)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-scroll" style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8, alignItems:'flex-start' }}>
            {COLUMNS.map(col => (
              <div key={col.id} style={{ flexShrink:0, width:230 }}>
                {/* Column Header */}
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:col.dot, flexShrink:0 }}/>
                  <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:12, color:'#9ca3af', flex:1 }}>{col.label}</h3>
                  <span style={{ fontSize:10, fontWeight:700, color:'#4b5563', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', padding:'1px 8px', borderRadius:100 }}>
                    {getCol(col.id).length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snap) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{
                      minHeight:120, padding:8, borderRadius:16,
                      background: snap.isDraggingOver ? col.colBg : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${snap.isDraggingOver ? col.colBorder : 'rgba(255,255,255,0.06)'}`,
                      transition:'all .2s',
                    }}>
                      {getCol(col.id).map((deal, idx) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={idx}>
                          {(prov, dragSnap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                              className="deal-card"
                              style={{
                                ...prov.draggableProps.style,
                                background: dragSnap.isDragging ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${dragSnap.isDragging ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius:12, padding:'12px', marginBottom:8,
                                transform: dragSnap.isDragging ? (prov.draggableProps.style?.transform + ' rotate(2deg)') : prov.draggableProps.style?.transform,
                                boxShadow: dragSnap.isDragging ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
                              }}>
                              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                                <h4 style={{ fontFamily:'Syne', fontWeight:700, fontSize:12, color:'#f0f0f5', flex:1 }}>{deal.brand_name}</h4>
                                <button onClick={() => handleDelete(deal.id)} style={{ background:'none', border:'none', color:'#374151', cursor:'pointer', fontSize:11, marginLeft:4, padding:0, transition:'color .15s' }}
                                  onMouseEnter={e=>e.target.style.color='#f87171'} onMouseLeave={e=>e.target.style.color='#374151'}>✕</button>
                              </div>

                              {deal.amount > 0 && (
                                <p style={{ fontFamily:'Syne', fontWeight:800, fontSize:13, color:'#6ee7b7', marginBottom:5 }}>
                                  ${parseFloat(deal.amount).toLocaleString()}
                                </p>
                              )}
                              {deal.deliverables && (
                                <p style={{ fontSize:10, color:'#4b5563', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{deal.deliverables}</p>
                              )}
                              {deal.contact_email && (
                                <p style={{ fontSize:10, color:'#6366f1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{deal.contact_email}</p>
                              )}
                              {deal.due_date && (
                                <p style={{ fontSize:10, color:'#fbbf24', marginBottom:3 }}>
                                  Due: {new Date(deal.due_date).toLocaleDateString()}
                                </p>
                              )}

                              {(deal.status === 'completed' || deal.status === 'paid') && (
                                <button onClick={() => setInvoiceDeal(deal)} style={{
                                  marginTop:8, width:'100%', fontSize:10, fontWeight:700,
                                  background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)',
                                  color:'#a5b4fc', borderRadius:8, padding:'6px 0', cursor:'pointer',
                                  fontFamily:'Syne', transition:'all .15s',
                                }}
                                  onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.22)'}
                                  onMouseLeave={e=>e.currentTarget.style.background='rgba(99,102,241,0.12)'}>
                                  🧾 Generate Invoice
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {getCol(col.id).length === 0 && !snap.isDraggingOver && (
                        <div style={{ textAlign:'center', padding:'20px 0', fontSize:10, color:'#1f2937' }}>Drop here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* ══ Add Deal Modal ══ */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#0d0d14', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, padding:28, width:'100%', maxWidth:440, boxShadow:'0 25px 80px rgba(0,0,0,0.6)' }}>
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:22 }}>New Brand Deal</h2>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { label:'Brand Name *', key:'brand_name', type:'text',   ph:'e.g. Nike, Samsung'          },
                { label:'Contact Email', key:'contact_email', type:'email', ph:'brand@company.com'        },
                { label:'Deal Amount ($)', key:'amount', type:'number', ph:'0.00'                        },
                { label:'Deliverables', key:'deliverables', type:'text', ph:'e.g. 1 YouTube video, 2 Tweets' },
                { label:'Due Date', key:'due_date', type:'date', ph:''                                   },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>{f.label}</label>
                  <input className="bd-inp" type={f.type} value={formData[f.key]} placeholder={f.ph}
                    onChange={e => setFormData(p=>({...p,[f.key]:e.target.value}))}
                    style={inp} />
                </div>
              ))}

              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>Initial Status</label>
                <select value={formData.status} onChange={e => setFormData(p=>({...p,status:e.target.value}))}
                  style={{ ...inp, cursor:'pointer' }}>
                  {COLUMNS.map(c => <option key={c.id} value={c.id} style={{ background:'#0d0d14' }}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button className="bd-btn" onClick={() => { setShowModal(false); setFormData(EMPTY_DEAL) }} style={{
                flex:1, padding:'11px 0', borderRadius:12,
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#9ca3af', fontSize:13,
              }}>Cancel</button>
              <button className="bd-btn" onClick={handleAddDeal} disabled={saving || !formData.brand_name.trim()} style={{
                flex:1, padding:'11px 0', borderRadius:12,
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:13,
              }}>{saving ? 'Saving...' : 'Add Deal'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceDeal && <InvoiceView deal={invoiceDeal} profile={profile} onClose={() => setInvoiceDeal(null)} />}
    </div>
  )
}