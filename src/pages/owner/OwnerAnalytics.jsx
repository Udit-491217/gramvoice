import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp, Users, Globe, IndianRupee, FileText, CheckCircle } from 'lucide-react'

export default function OwnerAnalytics() {
  const [stats, setStats]   = useState({
    totalVillages: 0, activeVillages: 0,
    totalMembers: 0, paidMembers: 0,
    totalRevenue: 0, pendingPayments: 0,
    totalComplaints: 0, resolvedComplaints: 0
  })
  const [villages, setVillages] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    const [villages, members, revenue, pendingPay, complaints] = await Promise.all([
      supabase.from('villages').select('id, name, is_active'),
      supabase.from('profiles').select('id, plan, village_id').eq('role', 'member'),
      supabase.from('revenue').select('amount'),
      supabase.from('payment_requests').select('id').eq('status', 'pending'),
      supabase.from('complaints').select('id, status, village_id')
    ])

    const v = villages.data || []
    const m = members.data || []
    const r = revenue.data || []
    const c = complaints.data || []

    // Per village stats
    const villageStats = v.map(vill => ({
      ...vill,
      members:    m.filter(x => x.village_id === vill.id).length,
      complaints: c.filter(x => x.village_id === vill.id).length,
      paid:       m.filter(x => x.village_id === vill.id && x.plan !== 'free').length
    }))

    setVillages(villageStats)
    setStats({
      totalVillages:     v.length,
      activeVillages:    v.filter(x => x.is_active).length,
      totalMembers:      m.length,
      paidMembers:       m.filter(x => x.plan !== 'free').length,
      totalRevenue:      r.reduce((sum, x) => sum + (x.amount || 0), 0),
      pendingPayments:   pendingPay.data?.length || 0,
      totalComplaints:   c.length,
      resolvedComplaints: c.filter(x => x.status === 'resolved').length
    })
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Villages',  val: stats.totalVillages,      color: '#1a7f3c', icon: <Globe size={18} />        },
    { label: 'Active Villages', val: stats.activeVillages,     color: '#1a7f3c', icon: <Globe size={18} />        },
    { label: 'Total Members',   val: stats.totalMembers,       color: '#5060d0', icon: <Users size={18} />        },
    { label: 'Paid Members',    val: stats.paidMembers,        color: '#b87000', icon: <Users size={18} />        },
    { label: 'Total Revenue',   val: `₹${stats.totalRevenue}`, color: '#1a7f3c', icon: <IndianRupee size={18} /> },
    { label: 'Pending Pay',     val: stats.pendingPayments,    color: '#c0392b', icon: <TrendingUp size={18} />   },
    { label: 'Complaints',      val: stats.totalComplaints,    color: '#5060d0', icon: <FileText size={18} />     },
    { label: 'Resolved',        val: stats.resolvedComplaints, color: '#1a7f3c', icon: <CheckCircle size={18} /> },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-sm" style={{ color: '#6b8f72' }}>Loading analytics...</div>
    </div>
  )

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border"
            style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>
              {s.icon}
              <span className="text-xs font-semibold" style={{ color: '#6b8f72' }}>{s.label}</span>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Per village breakdown */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: '#6b8f72' }}>Village Breakdown</div>
        <div className="flex flex-col gap-3">
          {villages.map(v => (
            <div key={v.id} className="bg-white rounded-2xl p-4 border"
              style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="font-extrabold text-sm" style={{ color: '#192b1d' }}>{v.name}</div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: v.is_active ? '#e6f5eb' : '#fff0f0',
                    color:      v.is_active ? '#1a7f3c' : '#c0392b'
                  }}>
                  {v.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Members',    val: v.members,    color: '#5060d0' },
                  { label: 'Paid',       val: v.paid,       color: '#b87000' },
                  { label: 'Complaints', val: v.complaints, color: '#c0392b' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-2 text-center"
                    style={{ background: '#f0f5f1' }}>
                    <div className="text-lg font-extrabold" style={{ color: item.color }}>
                      {item.val}
                    </div>
                    <div className="text-xs" style={{ color: '#6b8f72' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}