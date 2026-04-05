import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Edit2, X } from 'lucide-react'

export default function AdminRulebook({ village }) {
  const [rules, setRules]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState({ title: '', content: '', category: 'general' })
  const [saving, setSaving]     = useState(false)

  const categories = ['general','complaints','meetings','schemes','conduct','penalties']

  useEffect(() => { if (village?.id) fetchRules() }, [village])

  const fetchRules = async () => {
    const { data } = await supabase
      .from('rulebook').select('*')
      .eq('village_id', village.id)
      .order('created_at', { ascending: true })
    if (data) setRules(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.title || !form.content) return
    setSaving(true)
    if (editing) {
      await supabase.from('rulebook').update(form).eq('id', editing)
      setRules(prev => prev.map(r => r.id === editing ? { ...r, ...form } : r))
    } else {
      const { data } = await supabase.from('rulebook')
        .insert({ ...form, village_id: village.id })
        .select().single()
      if (data) setRules(prev => [...prev, data])
    }
    setForm({ title: '', content: '', category: 'general' })
    setShowForm(false)
    setEditing(null)
    setSaving(false)
  }

  const handleEdit = (rule) => {
    setForm({ title: rule.title, content: rule.content, category: rule.category || 'general' })
    setEditing(rule.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this rule?')) return
    await supabase.from('rulebook').delete().eq('id', id)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title:'', content:'', category:'general' }) }}
        className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
        <Plus size={18} /> Add New Rule
      </button>

      {loading && <div className="text-center py-8 text-sm" style={{ color: '#6b8f72' }}>Loading...</div>}

      {!loading && rules.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: '#9dc9a8' }}>
          No rules yet. Add your first rule!
        </div>
      )}

      {rules.map((r, i) => (
        <div key={r.id} className="bg-white rounded-2xl p-4 border"
          style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#1a7f3c' }}>{i + 1}</div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ background: '#e6f5eb', color: '#1a7f3c' }}>{r.category}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(r)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#e6f5eb' }}>
                <Edit2 size={13} color="#1a7f3c" />
              </button>
              <button onClick={() => handleDelete(r.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#fff0f0' }}>
                <Trash2 size={13} color="#c0392b" />
              </button>
            </div>
          </div>
          <div className="font-bold text-sm mb-1" style={{ color: '#192b1d' }}>{r.title}</div>
          <div className="text-xs leading-relaxed" style={{ color: '#3d5e44' }}>{r.content}</div>
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-extrabold text-lg" style={{ color: '#192b1d' }}>
                {editing ? 'Edit Rule' : 'New Rule'}
              </div>
              <button onClick={() => setShowForm(false)}><X size={20} color="#6b8f72" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a8c5c' }}>Category</div>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 bg-white"
                  style={{ borderColor: '#ddeae0', color: '#192b1d' }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a8c5c' }}>Rule Title</div>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Complaint Filing Rules"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2"
                  style={{ borderColor: form.title ? '#1a7f3c' : '#ddeae0', color: '#192b1d' }} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a8c5c' }}>Rule Content</div>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Describe the rule in detail..."
                  rows={4}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 resize-none"
                  style={{ borderColor: form.content ? '#1a7f3c' : '#ddeae0', color: '#192b1d' }} />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                {saving ? 'Saving...' : editing ? 'Update Rule' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}