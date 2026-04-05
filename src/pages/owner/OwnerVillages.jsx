import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, MapPin, Users, X, Eye, EyeOff } from 'lucide-react'

export default function OwnerVillages() {
  const [villages, setVillages]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({
    name: '', district: '', state: 'Assam', code: '', admin_email: ''
  })

  useEffect(() => { fetchVillages() }, [])

  const fetchVillages = async () => {
    const { data } = await supabase
      .from('villages').select('*')
      .order('created_at', { ascending: false })
    if (data) setVillages(data)
    setLoading(false)
  }

  const getMemberCount = async (villageId) => {
    const { count } = await supabase
      .from('profiles').select('*', { count: 'exact', head: true })
      .eq('village_id', villageId)
    return count || 0
  }

  const handleSave = async () => {
    if (!form.name || !form.code) return
    setSaving(true)
    const { data } = await supabase.from('villages')
      .insert({ ...form, is_active: true })
      .select().single()
    if (data) setVillages(prev => [data, ...prev])
    setForm({ name: '', district: '', state: 'Assam', code: '', admin_email: '' })
    setShowForm(false)
    setSaving(false)
  }

  const toggleActive = async (id, current) => {
    await supabase.from('villages').update({ is_active: !current }).eq('id', id)
    setVillages(prev => prev.map(v => v.id === id ? { ...v, is_active: !current } : v))
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      <button onClick={() => setShowForm(true)}
        className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
        <Plus size={18} /> Register New Village
      </button>

      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b8f72' }}>
        {villages.length} villages registered
      </div>

      {loading && <div className="text-center py-8 text-sm" style={{ color: '#6b8f72' }}>Loading...</div>}

      {villages.map(v => (
        <div key={v.id} className="bg-white rounded-2xl p-4 border"
          style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)',
            opacity: v.is_active ? 1 : 0.6 }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-extrabold text-base" style={{ color: '#192b1d' }}>{v.name}</div>
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#6b8f72' }}>
                <MapPin size={11} /> {v.district}, {v.state}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  background: v.is_active ? '#e6f5eb' : '#fff0f0',
                  color:      v.is_active ? '#1a7f3c' : '#c0392b'
                }}>
                {v.is_active ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => toggleActive(v.id, v.is_active)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#f0f5f1' }}>
                {v.is_active
                  ? <EyeOff size={14} color="#c0392b" />
                  : <Eye size={14} color="#1a7f3c" />
                }
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-3">
            <div className="flex-1 rounded-xl px-3 py-2 text-center"
              style={{ background: '#f0f5f1' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: '#6b8f72' }}>Code</div>
              <div className="font-extrabold text-sm font-mono" style={{ color: '#1a7f3c' }}>
                {v.code}
              </div>
            </div>
            {v.admin_email && (
              <div className="flex-1 rounded-xl px-3 py-2 text-center"
                style={{ background: '#f0f5f1' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                  style={{ color: '#6b8f72' }}>Admin</div>
                <div className="text-xs font-bold truncate" style={{ color: '#192b1d' }}>
                  {v.admin_email}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowForm(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-screen overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-extrabold text-lg" style={{ color: '#192b1d' }}>
                Register Village
              </div>
              <button onClick={() => setShowForm(false)}><X size={20} color="#6b8f72" /></button>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { key: 'name',        label: 'Village Name',  placeholder: 'e.g. Naharkatia'         },
                { key: 'district',    label: 'District',      placeholder: 'e.g. Dibrugarh'          },
                { key: 'state',       label: 'State',         placeholder: 'e.g. Assam'              },
                { key: 'code',        label: 'Village Code',  placeholder: 'e.g. NAH001 (unique)'    },
                { key: 'admin_email', label: 'Admin Email',   placeholder: 'admin@village.com'       },
              ].map(field => (
                <div key={field.key}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: '#4a8c5c' }}>{field.label}</div>
                  <input
                    value={form[field.key]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2"
                    style={{ borderColor: form[field.key] ? '#1a7f3c' : '#ddeae0', color: '#192b1d' }} />
                </div>
              ))}

              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 rounded-2xl font-bold text-white mt-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                {saving ? 'Registering...' : 'Register Village →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}