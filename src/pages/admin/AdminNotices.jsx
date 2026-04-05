import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'

export default function AdminNotices({ village }) {
  const [notices, setNotices]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState({ title: '', body: '', category: 'general' })
  const [saving, setSaving]     = useState(false)

  const categories = ['general','important','utilities','scheme','roads','health']

  useEffect(() => { if (village?.id) fetchNotices() }, [village])

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('notices').select('*')
      .eq('village_id', village.id)
      .order('created_at', { ascending: false })
    if (data) setNotices(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.title || !form.body) return
    setSaving(true)
    if (editing) {
      await supabase.from('notices').update(form).eq('id', editing)
      setNotices(prev => prev.map(n => n.id === editing ? { ...n, ...form } : n))
    } else {
      const { data } = await supabase.from('notices')
        .insert({ ...form, village_id: village.id })
        .select().single()
      if (data) setNotices(prev => [data, ...prev])
    }
    setForm({ title: '', body: '', category: 'general' })
    setShowForm(false)
    setEditing(null)
    setSaving(false)
  }

  const handleEdit = (notice) => {
    setForm({ title: notice.title, body: notice.body, category: notice.category || 'general' })
    setEditing(notice.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return
    await supabase.from('notices').delete().eq('id', id)
    setNotices(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title:'', body:'', category:'general' }) }}
        className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
        <Plus size={18} /> Add New Notice
      </button>

      {loading && <div className="text-center py-8 text-sm" style={{ color: '#6b8f72' }}>Loading...</div>}

      {notices.map(n => (
        <div key={n.id} className="bg-white rounded-2xl p-4 border"
          style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
              style={{ background: '#e6f5eb', color: '#1a7f3c' }}>
              {n.category}
            </span>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(n)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#e6f5eb' }}>
                <Edit2 size={13} color="#1a7f3c" />
              </button>
              <button onClick={() => handleDelete(n.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#fff0f0' }}>
                <Trash2 size={13} color="#c0392b" />
              </button>
            </div>
          </div>
          <div className="font-bold text-sm mb-1" style={{ color: '#192b1d' }}>{n.title}</div>
          <div className="text-xs leading-relaxed" style={{ color: '#3d5e44' }}>{n.body}</div>
          <div className="text-xs mt-2" style={{ color: '#9dc9a8' }}>
            {new Date(n.created_at).toLocaleDateString('en-IN')}
          </div>
        </div>
      ))}

      {!loading && notices.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: '#9dc9a8' }}>
          No notices yet. Add your first notice!
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-extrabold text-lg" style={{ color: '#192b1d' }}>
                {editing ? 'Edit Notice' : 'New Notice'}
              </div>
              <button onClick={() => setShowForm(false)}><X size={20} color="#6b8f72" /></button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a8c5c' }}>
                  Category
                </div>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 bg-white"
                  style={{ borderColor: '#ddeae0', color: '#192b1d' }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a8c5c' }}>
                  Title
                </div>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Notice title..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2"
                  style={{ borderColor: form.title ? '#1a7f3c' : '#ddeae0', color: '#192b1d' }} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a8c5c' }}>
                  Content
                </div>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="Notice content..."
                  rows={4}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 resize-none"
                  style={{ borderColor: form.body ? '#1a7f3c' : '#ddeae0', color: '#192b1d' }} />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                {saving ? 'Saving...' : editing ? 'Update Notice' : 'Publish Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}