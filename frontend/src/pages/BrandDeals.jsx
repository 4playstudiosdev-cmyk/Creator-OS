import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabaseClient'
import axios from 'axios'

const COLUMNS = [
  { id: 'lead', label: 'Leads', color: 'bg-gray-100 border-gray-300', dotColor: 'bg-gray-400' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-yellow-50 border-yellow-300', dotColor: 'bg-yellow-400' },
  { id: 'active', label: 'Content Creation', color: 'bg-blue-50 border-blue-300', dotColor: 'bg-blue-400' },
  { id: 'completed', label: 'Live', color: 'bg-purple-50 border-purple-300', dotColor: 'bg-purple-400' },
  { id: 'paid', label: 'Paid', color: 'bg-green-50 border-green-300', dotColor: 'bg-green-400' },
]

const EMPTY_DEAL = {
  brand_name: '',
  contact_email: '',
  amount: '',
  deliverables: '',
  status: 'lead',
  due_date: ''
}

// ✅ Invoice Component — Print/PDF ke liye
function InvoiceView({ deal, profile, onClose }) {
  const invoiceNumber = "INV-" + Date.now().toString().slice(-6)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-screen overflow-y-auto">

        {/* Action Buttons — Print mein hide honge */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 print:hidden">
          <h2 className="font-bold text-gray-800">Invoice Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              🖨️ Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8" id="invoice-content">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Creator OS</h1>
              <p className="text-gray-500 text-sm mt-1">{profile?.full_name || 'Creator'}</p>
              <p className="text-gray-400 text-xs">{profile?.username ? "@" + profile.username : ''}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-gray-500 text-sm mt-1">#{invoiceNumber}</p>
              <p className="text-gray-400 text-xs mt-0.5">{today}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-blue-600 mb-6"></div>

          {/* Bill To */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bill To</p>
            <p className="font-bold text-gray-800 text-lg">{deal.brand_name}</p>
            {deal.contact_email && (
              <p className="text-gray-500 text-sm">{deal.contact_email}</p>
            )}
          </div>

          {/* Services Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 rounded-lg">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 rounded-l-lg">Description</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-800">Sponsorship / Brand Deal</p>
                    {deal.deliverables && (
                      <p className="text-gray-400 text-sm mt-0.5">{deal.deliverables}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-800">
                    ${parseFloat(deal.amount).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-8">
            <div className="bg-blue-600 text-white rounded-xl px-6 py-4 min-w-48">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Due</span>
                <span className="text-2xl font-bold">${parseFloat(deal.amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Due Date */}
          {deal.due_date && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-6">
              <p className="text-orange-700 text-sm font-medium">
                Payment Due: {new Date(deal.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-gray-400 text-xs">Thank you for your business! 🙏</p>
            <p className="text-gray-300 text-xs mt-1">Generated by Creator OS</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function BrandDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(EMPTY_DEAL)
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [invoiceDeal, setInvoiceDeal] = useState(null) // ✅ Invoice state

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile(data)
    } catch (e) {
      console.log("Profile nahi mili")
    }
  }

  const fetchDeals = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const response = await axios.get(
        "http://localhost:8000/api/deals/user/" + session.user.id,
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
      setDeals(response.data || [])
    } catch (error) {
      console.error("Deals fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session) fetchDeals()
  }, [session, fetchDeals])

  const getDealsForColumn = (columnId) => {
    return deals.filter(deal => deal.status === columnId)
  }

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const newStatus = destination.droppableId
    setDeals(prev => prev.map(deal =>
      deal.id === draggableId ? { ...deal, status: newStatus } : deal
    ))

    try {
      await axios.put(
        "http://localhost:8000/api/deals/" + draggableId + "/status",
        { status: newStatus },
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
    } catch (error) {
      console.error("Status update error:", error)
      fetchDeals()
    }
  }

  const handleAddDeal = async () => {
    if (!formData.brand_name.trim()) return
    setSaving(true)
    try {
      await axios.post(
        "http://localhost:8000/api/deals/create",
        {
          brand_name: formData.brand_name,
          contact_email: formData.contact_email,
          amount: parseFloat(formData.amount) || 0,
          deliverables: formData.deliverables,
          status: formData.status,
          due_date: formData.due_date || null
        },
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
      setShowModal(false)
      setFormData(EMPTY_DEAL)
      fetchDeals()
    } catch (error) {
      alert("Error: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (dealId) => {
    if (!window.confirm("Ye deal delete karein?")) return
    try {
      await axios.delete(
        "http://localhost:8000/api/deals/" + dealId,
        { headers: { Authorization: "Bearer " + session.access_token } }
      )
      setDeals(prev => prev.filter(d => d.id !== dealId))
    } catch (error) {
      alert("Delete nahi hua: " + error.message)
    }
  }

  const totalValue = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  const paidValue = deals.filter(d => d.status === 'paid').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Deals 💰</h1>
          <p className="text-gray-500 mt-1">Apni sponsorships aur brand deals manage karein</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
        >
          + New Deal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Deals</p>
          <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Pipeline Value</p>
          <p className="text-2xl font-bold text-blue-600">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Paid Out</p>
          <p className="text-2xl font-bold text-green-600">${paidValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map(column => (
              <div key={column.id} className="flex-shrink-0 w-64">
                <div className="flex items-center gap-2 mb-3">
                  <div className={"w-2.5 h-2.5 rounded-full " + column.dotColor}></div>
                  <h3 className="font-semibold text-gray-700 text-sm">{column.label}</h3>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {getDealsForColumn(column.id).length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={"min-h-32 p-2 rounded-xl border-2 transition-colors " + column.color + (snapshot.isDraggingOver ? " ring-2 ring-blue-300" : "")}
                    >
                      {getDealsForColumn(column.id).map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={"bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm cursor-grab transition-shadow " + (snapshot.isDragging ? "shadow-xl rotate-1" : "hover:shadow-md")}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-800 text-sm">{deal.brand_name}</h4>
                                <button
                                  onClick={() => handleDelete(deal.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors text-xs ml-1"
                                >
                                  ✕
                                </button>
                              </div>

                              {deal.amount > 0 && (
                                <p className="text-green-600 font-bold text-sm mb-1">
                                  ${parseFloat(deal.amount).toLocaleString()}
                                </p>
                              )}

                              {deal.deliverables && (
                                <p className="text-xs text-gray-400 truncate">{deal.deliverables}</p>
                              )}

                              {deal.contact_email && (
                                <p className="text-xs text-blue-400 truncate mt-1">{deal.contact_email}</p>
                              )}

                              {deal.due_date && (
                                <p className="text-xs text-orange-400 mt-1">
                                  Due: {new Date(deal.due_date).toLocaleDateString()}
                                </p>
                              )}

                              {/* ✅ Invoice Button — sirf Live aur Paid column mein */}
                              {(deal.status === 'completed' || deal.status === 'paid') && (
                                <button
                                  onClick={() => setInvoiceDeal(deal)}
                                  className="mt-2 w-full text-xs bg-blue-50 text-blue-600 border border-blue-200 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                  🧾 Generate Invoice
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {getDealsForColumn(column.id).length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-6 text-gray-300 text-xs">
                          Drop here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Add Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-5">New Brand Deal</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                  placeholder="e.g. Nike, Samsung"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="brand@company.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Amount ($)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deliverables</label>
                <input
                  type="text"
                  value={formData.deliverables}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                  placeholder="e.g. 1 YouTube video, 2 Tweets"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                >
                  {COLUMNS.map(col => (
                    <option key={col.id} value={col.id}>{col.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setFormData(EMPTY_DEAL) }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDeal}
                disabled={saving || !formData.brand_name.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Add Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Invoice Modal */}
      {invoiceDeal && (
        <InvoiceView
          deal={invoiceDeal}
          profile={profile}
          onClose={() => setInvoiceDeal(null)}
        />
      )}
    </div>
  )
}