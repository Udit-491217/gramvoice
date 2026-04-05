import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Filter, ChevronDown, ChevronUp, Save } from 'lucide-react'

export default function AdminComplaints({ village }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [expanded, setExpanded]     = useState(null)
  const [notes, setNotes]           = useState({})
  const [saving, setSaving]         = useState(null)

  useEffect(() => { if (village?.id) fetchComplaints() }, [village, filter])

  const fetchComplaints = async () => {
    setLoading(true)
    let query = supabase
      .from('complaints')
      .select('*, profiles(name, phone)')
      .eq('village_id', village.id)
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    if (data) setComplaints(data)
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    setSaving(id)
    await supabase.from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    setSaving(null)
  }

  const saveNote = async (id) => {
    setSaving(id)
    await supabase.from('complaints')
      .update({ admin_note: notes[id], updated_at: new Date().toISOString() })
      .eq('id', id)
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, admin_note: notes[id] } : c))
    setSaving(null)
  }

  const statusConfig = {
    pending:  { label: 'Pending',   color: '#b87000', bg: '#fffbec' },
    review:   { label: 'In Review', color: '#5060d0', bg: '#eef0ff' },
    resolved: { label: 'Resolved',  color: '#1a7f3c', bg: '#e6f5eb' }
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {['all','pending','review','resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
            style={{
              background: filter === f ? '#1a7f3c' : 'white',
              color:      filter === f ? 'white' : '#6b8f72',
              border:     `1px solid ${filter === f ? '#1a7f3c' : '#ddeae0'}`
            }}>
            {f === 'all' ? '📋 All' : f === 'pending' ? '⏳ Pending' : f === 'review' ? '🔍 In Review' : '✅ Resolved'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-sm" style={{ color: '#6b8f72' }}>Loading...</div>}

      {!loading && complaints.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: '#9dc9a8' }}>
          No complaints found
        </div>
      )}

      {complaints.map(c => {
        const s      = statusConfig[c.status] || statusConfig.pending
        const isOpen = expanded === c.id
        return (
          <div key={c.id} className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>

            <button className="w-full p-4 text-left"
              onClick={() => setExpanded(isOpen ? null : c.id)}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold" style={{ color: '#9dc9a8' }}>
                  #{c.id.slice(0,8).toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                  {isOpen ? <ChevronUp size={16} color="#6b8f72" /> : <ChevronDown size={16} color="#6b8f72" />}
                </div>
              </div>
              <div className="font-bold text-sm mb-1" style={{ color: '#192b1d' }}>{c.type}</div>
              <div className="text-xs" style={{ color: '#6b8f72' }}>
                {c.profiles?.name} · {c.profiles?.phone} · {new Date(c.created_at).toLocaleDateString('en-IN')}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t" style={{ borderColor: '#f0f5f1' }}>
                <div className="pt-3 mb-3">
                  {c.location && (
                    <div className="text-xs mb-1"><span className="font-semibold">📍 Location:</span> {c.location}</div>
                  )}
                  <div className="text-xs mt-2 leading-relaxed" style={{ color: '#3d5e44' }}>
                    {c.description}
                  </div>
                </div>

                {/* Update status */}
                <div className="mb-3">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b8f72' }}>
                    Update Status
                  </div>
                  <div className="flex gap-2">
                    {['pending','review','resolved'].map(st => (
                      <button key={st} onClick={() => updateStatus(c.id, st)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: c.status === st ? '#1a7f3c' : '#f0f5f1',
                          color:      c.status === st ? 'white' : '#6b8f72'
                        }}>
                        {st === 'pending' ? 'Pending' : st === 'review' ? 'Review' : 'Resolved'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin note */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b8f72' }}>
                    Admin Note
                  </div>
                  <textarea
                    value={notes[c.id] ?? (c.admin_note || '')}
                    onChange={e => setNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="Add a note about this complaint..."
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none border-2 resize-none mb-2"
                    style={{ borderColor: '#ddeae0', color: '#192b1d' }} />
                  <button onClick={() => saveNote(c.id)} disabled={saving === c.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: '#1a7f3c' }}>
                    <Save size={13} />
                    {saving === c.id ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}