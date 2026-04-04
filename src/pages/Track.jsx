import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Clock, CheckCircle, Eye, BarChart2 } from 'lucide-react'

export default function Track({ profile, village, onBack }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setComplaints(data)
    setLoading(false)
  }

  const statusConfig = {
    pending:  { label: 'Pending',   color: '#b87000', bg: '#fffbec', icon: <Clock size={12} />,        progress: 25  },
    review:   { label: 'In Review', color: '#5060d0', bg: '#eef0ff', icon: <Eye size={12} />,          progress: 60  },
    resolved: { label: 'Resolved',  color: '#1a7f3c', bg: '#e6f5eb', icon: <CheckCircle size={12} />,  progress: 100 }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(145deg, #1a7f3c, #2db856)' }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div>
            <div className="text-xl font-extrabold text-white">Track Complaints</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {village?.name || 'Your village'}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-3">

        {loading && (
          <div className="text-center py-12" style={{ color: '#6b8f72' }}>Loading...</div>
        )}

        {!loading && complaints.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <BarChart2 size={48} color="#b8d4bc" />
            <div className="font-bold" style={{ color: '#6b8f72' }}>No complaints yet</div>
            <div className="text-sm" style={{ color: '#9dc9a8' }}>Submit your first complaint to track it here</div>
          </div>
        )}

        {complaints.map(c => {
          const s = statusConfig[c.status] || statusConfig.pending
          return (
            <div key={c.id} className="bg-white rounded-2xl p-4 border"
              style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>

              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold tracking-wider" style={{ color: '#9dc9a8' }}>
                  #{c.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: s.bg, color: s.color }}>
                  {s.icon} {s.label}
                </span>
              </div>

              <div className="font-bold text-sm mb-1" style={{ color: '#192b1d' }}>
                {c.type || 'General Complaint'}
              </div>
              <div className="text-xs mb-1" style={{ color: '#6b8f72' }}>
                {c.location && `📍 ${c.location} · `}
                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
              <div className="text-xs line-clamp-2 mb-3" style={{ color: '#3d5e44' }}>
                {c.description}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e8f5ec' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${s.progress}%`, background: s.color }} />
              </div>
              <div className="text-xs mt-1.5 font-medium" style={{ color: s.color }}>
                {s.progress}% complete
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}