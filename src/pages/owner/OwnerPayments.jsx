import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, Clock, X, Eye } from 'lucide-react'

export default function OwnerPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [preview, setPreview]   = useState(null)
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchPayments() }, [filter])

  const fetchPayments = async () => {
    setLoading(true)
    let query = supabase
      .from('payment_requests')
      .select('*, profiles(name, phone, plan), villages(name)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    if (data) setPayments(data)
    setLoading(false)
  }

  const handleVerify = async (payment) => {
    setProcessing(payment.id)
    const planExpiry = new Date()
    if (payment.plan === 'yearly') {
      planExpiry.setFullYear(planExpiry.getFullYear() + 1)
    } else {
      planExpiry.setMonth(planExpiry.getMonth() + 1)
    }

    await Promise.all([
      // Update payment request
      supabase.from('payment_requests').update({
        status:      'verified',
        verified_at: new Date().toISOString()
      }).eq('id', payment.id),

      // Update user plan
      supabase.from('profiles').update({
        plan:               payment.plan === 'once' ? 'free' : payment.plan,
        plan_activated_at:  new Date().toISOString(),
        plan_expires_at:    payment.plan === 'once' ? null : planExpiry.toISOString(),
        complaints_this_month: 0
      }).eq('id', payment.user_id),

      // Add to revenue
      supabase.from('revenue').insert({
        user_id:            payment.user_id,
        village_id:         payment.village_id,
        plan:               payment.plan,
        amount:             payment.amount,
        payment_request_id: payment.id
      })
    ])

    setPayments(prev => prev.map(p =>
      p.id === payment.id ? { ...p, status: 'verified' } : p
    ))
    setProcessing(null)
  }

  const handleReject = async (id) => {
    setProcessing(id)
    await supabase.from('payment_requests')
      .update({ status: 'rejected' }).eq('id', id)
    setPayments(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'rejected' } : p
    ))
    setProcessing(null)
  }

  const planLabel = {
    monthly: '⚡ Monthly ₹49',
    yearly:  '🏆 Yearly ₹499',
    once:    '₹5 Quick Submit'
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Filter */}
      <div className="flex gap-2">
        {['pending','verified','rejected','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: filter === f ? '#1a7f3c' : 'white',
              color:      filter === f ? 'white' : '#6b8f72',
              border:     `1px solid ${filter === f ? '#1a7f3c' : '#ddeae0'}`
            }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-sm" style={{ color: '#6b8f72' }}>Loading...</div>}

      {!loading && payments.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: '#9dc9a8' }}>
          No {filter} payments
        </div>
      )}

      {payments.map(p => (
        <div key={p.id} className="bg-white rounded-2xl p-4 border"
          style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>

          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-bold text-sm" style={{ color: '#192b1d' }}>
                {p.profiles?.name}
              </div>
              <div className="text-xs" style={{ color: '#6b8f72' }}>
                📱 {p.profiles?.phone}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#6b8f72' }}>
                🏘️ {p.villages?.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-lg" style={{ color: '#1a7f3c' }}>
                ₹{p.amount}
              </div>
              <div className="text-xs" style={{ color: '#6b8f72' }}>
                {planLabel[p.plan] || p.plan}
              </div>
            </div>
          </div>

          <div className="text-xs mb-3" style={{ color: '#9dc9a8' }}>
            {new Date(p.created_at).toLocaleString('en-IN')}
          </div>

          {/* Screenshot preview */}
          {p.screenshot_url && (
            <button onClick={() => setPreview(p.screenshot_url)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-3 w-full"
              style={{ background: '#f0f5f1', color: '#1a7f3c' }}>
              <Eye size={14} /> View Payment Screenshot
            </button>
          )}

          {/* Actions */}
          {p.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => handleVerify(p)}
                disabled={processing === p.id}
                className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: '#1a7f3c' }}>
                <CheckCircle size={15} />
                {processing === p.id ? 'Processing...' : 'Verify & Activate'}
              </button>
              <button onClick={() => handleReject(p.id)}
                disabled={processing === p.id}
                className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: '#fff0f0', color: '#c0392b' }}>
                <X size={15} /> Reject
              </button>
            </div>
          )}

          {p.status === 'verified' && (
            <div className="flex items-center gap-2 text-xs font-bold py-2"
              style={{ color: '#1a7f3c' }}>
              <CheckCircle size={14} /> Verified & Activated
            </div>
          )}

          {p.status === 'rejected' && (
            <div className="flex items-center gap-2 text-xs font-bold py-2"
              style={{ color: '#c0392b' }}>
              <X size={14} /> Rejected
            </div>
          )}
        </div>
      ))}

      {/* Screenshot preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setPreview(null)}>
          <div className="relative max-w-sm w-full">
            <img src={preview} alt="Payment proof"
              className="w-full rounded-2xl" />
            <button onClick={() => setPreview(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <X size={18} color="white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}