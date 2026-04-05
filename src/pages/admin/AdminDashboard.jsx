import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { FileText, CheckCircle, Clock, Users, Bell, Eye } from 'lucide-react'

export default function AdminDashboard({ village }) {
  const [stats, setStats] = useState({
    total: 0, pending: 0, resolved: 0, inreview: 0,
    members: 0, notices: 0
  })
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (village?.id) fetchStats() }, [village])

  const fetchStats = async () => {
    const [complaints, members, notices] = await Promise.all([
      supabase.from('complaints').select('status').eq('village_id', village.id),
      supabase.from('profiles').select('id').eq('village_id', village.id),
      supabase.from('notices').select('id').eq('village_id', village.id)
    ])

    const c = complaints.data || []
    setStats({
      total:    c.length,
      pending:  c.filter(x => x.status === 'pending').length,
      resolved: c.filter(x => x.status === 'resolved').length,
      inreview: c.filter(x => x.status === 'review').length,
      members:  members.data?.length || 0,
      notices:  notices.data?.length || 0
    })

    const { data: recentData } = await supabase
      .from('complaints').select('*')
      .eq('village_id', village.id)
      .order('created_at', { ascending: false }).limit(5)
    if (recentData) setRecent(recentData)
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Complaints', val: stats.total,    color: '#1a7f3c', icon: <FileText size={18} />    },
    { label: 'Pending',          val: stats.pending,  color: '#c0392b', icon: <Clock size={18} />        },
    { label: 'Resolved',         val: stats.resolved, color: '#b87000', icon: <CheckCircle size={18} /> },
    { label: 'In Review',        val: stats.inreview, color: '#5060d0', icon: <Eye size={18} />          },
    { label: 'Members',          val: stats.members,  color: '#1a7f3c', icon: <Users size={18} />        },
    { label: 'Notices',          val: stats.notices,  color: '#b87000', icon: <Bell size={18} />         },
  ]

  const statusConfig = {
    pending:  { label: 'Pending',   color: '#b87000', bg: '#fffbec' },
    review:   { label: 'In Review', color: '#5060d0', bg: '#eef0ff' },
    resolved: { label: 'Resolved',  color: '#1a7f3c', bg: '#e6f5eb' }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-sm" style={{ color: '#6b8f72' }}>Loading...</div>
    </div>
  )

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Village info */}
      <div className="rounded-2xl p-4 border"
        style={{ background: 'linear-gradient(135deg,#e6f5eb,#f0faf2)', borderColor: '#b8e8c8' }}>
        <div className="font-extrabold text-lg" style={{ color: '#1a7f3c' }}>
          {village?.name}
        </div>
        <div className="text-sm" style={{ color: '#3d5e44' }}>
          {village?.district}, {village?.state} · Code: <span className="font-bold">{village?.code}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 text-center border"
            style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
            <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs mt-0.5" style={{ color: '#6b8f72' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent complaints */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#6b8f72' }}>Recent Complaints</div>
        <div className="flex flex-col gap-2">
          {recent.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: '#9dc9a8' }}>
              No complaints yet
            </div>
          )}
          {recent.map(c => {
            const s = statusConfig[c.status] || statusConfig.pending
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 border"
                style={{ borderColor: '#ddeae0' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold" style={{ color: '#9dc9a8' }}>
                    #{c.id.slice(0,8).toUpperCase()}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
                <div className="font-bold text-sm" style={{ color: '#192b1d' }}>{c.type}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6b8f72' }}>
                  {new Date(c.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}