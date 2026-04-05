import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { User, Search, Phone } from 'lucide-react'

export default function AdminMembers({ village }) {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  useEffect(() => { if (village?.id) fetchMembers() }, [village])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('village_id', village.id)
      .order('created_at', { ascending: false })
    if (data) setMembers(data)
    setLoading(false)
  }

  const planConfig = {
    free:    { label: 'Free',    color: '#6b8f72', bg: '#e6f5eb' },
    monthly: { label: 'Monthly', color: '#1a7f3c', bg: '#d0f0da' },
    yearly:  { label: 'Yearly',  color: '#b87000', bg: '#fff3cd' }
  }

  const filtered = members.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search)
    const matchFilter = filter === 'all' || m.plan === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Search */}
      <div className="flex gap-2 items-center bg-white rounded-2xl px-4 py-3 border"
        style={{ borderColor: '#ddeae0' }}>
        <Search size={16} color="#6b8f72" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="flex-1 text-sm outline-none"
          style={{ color: '#192b1d' }} />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all','free','monthly','yearly'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: filter === f ? '#1a7f3c' : 'white',
              color:      filter === f ? 'white' : '#6b8f72',
              border:     `1px solid ${filter === f ? '#1a7f3c' : '#ddeae0'}`
            }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-xs font-semibold" style={{ color: '#6b8f72' }}>
        {filtered.length} members found
      </div>

      {loading && <div className="text-center py-8 text-sm" style={{ color: '#6b8f72' }}>Loading...</div>}

      {filtered.map(m => {
        const p = planConfig[m.plan] || planConfig.free
        return (
          <div key={m.id} className="bg-white rounded-2xl p-4 border flex items-center gap-3"
            style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: '#e6f5eb' }}>
              {m.avatar_url
                ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                : <User size={20} color="#1a7f3c" />
              }
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm" style={{ color: '#192b1d' }}>{m.name}</div>
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#6b8f72' }}>
                <Phone size={10} /> {m.phone}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#9dc9a8' }}>
                Joined {new Date(m.created_at || Date.now()).toLocaleDateString('en-IN')}
              </div>
            </div>
            <div className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: p.bg, color: p.color }}>
              {p.label}
            </div>
          </div>
        )
      })}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: '#9dc9a8' }}>
          No members found
        </div>
      )}
    </div>
  )
}