import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Mic, MicOff, Send, CheckCircle, Upload, X } from 'lucide-react'

const UPI_ID   = 'notjustudit@fam'
const UPI_NAME = 'GramVoice'

const CATEGORIES = [
  '🛣️ Road / Infrastructure', '💧 Water Supply',
  '⚡ Electricity',            '🗑️ Sanitation',
  '🏥 Health',                 '📚 Education',
  '🌿 Environment',            '🔧 Other'
]

const PLANS = [
  {
    id: 'monthly', name: '⚡ Gram Voice', price: '₹49', period: '/month',
    upiAmount: 49, color: '#1a7f3c',
    bg: 'linear-gradient(135deg,#e8f5ec,#f2fbf5)', border: '#1a7f3c', popular: true,
    features: ['Unlimited complaints', 'Voice complaints', 'Unlimited PanchAI', 'Post in community', 'Priority tracking']
  },
  {
    id: 'yearly', name: '🏆 Gram Voice Pro', price: '₹499', period: '/year',
    upiAmount: 499, color: '#b87000',
    bg: 'linear-gradient(135deg,#fff8e6,#fffdf5)', border: '#f0d080', popular: false,
    features: ['Everything in monthly', 'Save ₹89 vs monthly', 'Gram Leader badge']
  }
]

// ── UPI deep link opener ──────────────────────────────────
function openUPI(amount, note) {
  const url = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
  window.location.href = url
}

export default function Complaint({ profile, village, paid, onBack, onProfileUpdate }) {
  const [type, setType]             = useState('')
  const [location, setLocation]     = useState('')
  const [description, setDesc]      = useState('')
  const [recording, setRecording]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  // Payment flow
  const [showPayment, setShowPayment]     = useState(false)
  const [payStep, setPayStep]             = useState('choose') // choose | upi | screenshot | done
  const [selectedPlan, setSelectedPlan]   = useState(null)
  const [uploading, setUploading]         = useState(false)
  const [monthlyCount, setMonthlyCount]   = useState(profile?.complaints_this_month || 0)
  const fileRef                           = useRef()

  const FREE_LIMIT = 3

  // ── Submit handler ──────────────────────────────────────
  const handleSubmit = async () => {
    setError('')
    if (!type || !description.trim()) {
      setError('Please select a category and describe your issue')
      return
    }
    // Paid or within free trial → submit directly
    if (paid) { await submitComplaint(); return }
    // Free plan — check monthly limit
    if (monthlyCount >= FREE_LIMIT) {
      setShowPayment(true)
      setPayStep('choose')
      return
    }
    await submitComplaint()
  }

  const submitComplaint = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('complaints').insert({
      user_id:    profile.id,
      village_id: profile.village_id,
      type, location, description,
      status: 'pending'
    })
    if (err) { setError('Something went wrong. Try again.'); setLoading(false); return }

    // Track monthly count for free users
    if (!paid) {
      const newCount = monthlyCount + 1
      await supabase.from('profiles')
        .update({ complaints_this_month: newCount }).eq('id', profile.id)
      setMonthlyCount(newCount)
      if (onProfileUpdate) onProfileUpdate({ ...profile, complaints_this_month: newCount })
    }
    setSuccess(true)
    setLoading(false)
  }

  // ── UPI payment ─────────────────────────────────────────
  const handlePayNow = (plan) => {
    setSelectedPlan(plan)
    setPayStep('upi')
  }

  const handlePayPerComplaint = () => {
    setSelectedPlan({ id: 'once', name: 'Quick Submit', upiAmount: 5, price: '₹5' })
    setPayStep('upi')
  }

  const handleOpenUPI = () => {
    const note = `GramVoice ${selectedPlan?.name} - ${profile?.phone || profile?.id?.slice(0,8)}`
    openUPI(selectedPlan?.upiAmount, note)
    // After 2s assume user went to UPI app, show screenshot step on return
    setTimeout(() => setPayStep('screenshot'), 2000)
  }

  // ── Screenshot upload ────────────────────────────────────
  const handleScreenshot = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const filePath = `${profile.id}-${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage
      .from('payment-proofs').upload(filePath, file, { upsert: true })
    if (upErr) { alert('Upload failed. Try again.'); setUploading(false); return }

    const { data: urlData } = supabase.storage
      .from('payment-proofs').getPublicUrl(filePath)

    await supabase.from('payment_requests').insert({
      user_id:        profile.id,
      village_id:     profile.village_id,
      plan:           selectedPlan?.id,
      amount:         selectedPlan?.upiAmount,
      screenshot_url: urlData.publicUrl,
      status:         'pending'
    })
    setUploading(false)

    if (selectedPlan?.id === 'once') {
      // ₹5 per complaint — submit directly
      setShowPayment(false)
      await submitComplaint()
    } else {
      setPayStep('done')
    }
  }

  // ── Success ──────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
        <CheckCircle size={48} color="white" />
      </div>
      <div className="text-2xl font-extrabold mb-2" style={{ color: '#0f4d23' }}>
        Complaint Submitted!
      </div>
      <div className="text-sm mb-4" style={{ color: '#6b8f72' }}>
        Your complaint has been registered. The Panchayat will review it shortly.
      </div>
      {!paid && (
        <div className="text-xs mb-6 px-4 py-2 rounded-xl" style={{ background: '#fff3cd', color: '#b87000' }}>
          {Math.max(0, FREE_LIMIT - monthlyCount)} free complaints remaining this month
        </div>
      )}
      <button onClick={onBack}
        className="w-full max-w-xs py-4 rounded-2xl font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
        Back to Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* HEADER */}
      <div className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(145deg,#1a7f3c,#2db856)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div>
            <div className="text-xl font-extrabold text-white">Submit Complaint</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {village?.name} · {paid
                ? 'Unlimited'
                : `${Math.max(0, FREE_LIMIT - monthlyCount)}/${FREE_LIMIT} free remaining`}
            </div>
          </div>
        </div>
      </div>

      {/* Warning when 1 free left */}
      {!paid && monthlyCount === FREE_LIMIT - 1 && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: '#fff3cd', color: '#b87000' }}>
          ⚠️ Last free complaint this month! Upgrade for unlimited.
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-4">

        {/* CATEGORY */}
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#ddeae0' }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a8c5c' }}>
            Complaint Category
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setType(cat)}
                className="text-left px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                style={{
                  borderColor: type === cat ? '#1a7f3c' : '#ddeae0',
                  background:  type === cat ? '#e6f5eb' : 'white',
                  color:       type === cat ? '#1a7f3c' : '#3d5e44'
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LOCATION */}
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#ddeae0' }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a8c5c' }}>
            Location / Ward
          </div>
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Ward 3, Near School Road"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 transition-all"
            style={{ borderColor: location ? '#1a7f3c' : '#ddeae0', color: '#192b1d' }} />
        </div>

        {/* DESCRIPTION */}
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#ddeae0' }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a8c5c' }}>
            Describe Your Issue
          </div>
          <textarea value={description} onChange={e => setDesc(e.target.value)}
            placeholder="Describe your complaint in detail..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none border-2 transition-all resize-none"
            style={{ borderColor: description ? '#1a7f3c' : '#ddeae0', color: '#192b1d' }} />

          {/* Voice — paid only */}
          <button
            onClick={() => paid ? setRecording(!recording) : null}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
            style={{
              borderColor: recording ? '#c0392b' : '#ddeae0',
              background:  recording ? '#fff0f0' : '#f0f5f1',
              color:       recording ? '#c0392b' : paid ? '#6b8f72' : '#b87000',
              opacity:     paid ? 1 : 0.7
            }}>
            {recording ? <MicOff size={16} /> : <Mic size={16} />}
            {recording ? 'Recording... Tap to stop'
              : paid ? 'Record Voice Complaint'
              : '🔒 Voice — Paid feature'}
          </button>
        </div>

        {error && (
          <div className="text-sm font-medium px-4 py-3 rounded-xl"
            style={{ background: '#fff0f0', color: '#c0392b' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)', boxShadow: '0 8px 24px rgba(26,127,60,0.25)' }}>
          <Send size={18} />
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>

        <div className="text-center text-xs" style={{ color: '#9dc9a8' }}>
          Your complaint is confidential and secure 🔒
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPayment && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setShowPayment(false); setPayStep('choose') }}>
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>

            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#ddeae0' }} />

            {/* ── CHOOSE PLAN ── */}
            {payStep === 'choose' && (
              <>
                <div className="text-2xl font-extrabold text-center mb-1" style={{ color: '#192b1d' }}>
                  🔊 Unlock Your Voice
                </div>
                <div className="text-sm text-center mb-4" style={{ color: '#6b8f72' }}>
                  You've used all {FREE_LIMIT} free complaints this month
                </div>
                <div className="rounded-2xl p-3 mb-4 text-center text-sm font-semibold"
                  style={{ background: '#e8f5ec', color: '#1a7f3c' }}>
                  🎉 First month completely FREE — all features unlocked!
                </div>

                {PLANS.map(plan => (
                  <div key={plan.id} className="rounded-2xl p-4 border-2 mb-3 relative"
                    style={{ borderColor: plan.border, background: plan.bg }}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: plan.color }}>⭐ MOST POPULAR</div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-extrabold" style={{ color: '#192b1d' }}>{plan.name}</div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold" style={{ color: plan.color }}>{plan.price}</div>
                        <div className="text-xs" style={{ color: '#6b8f72' }}>{plan.period}</div>
                      </div>
                    </div>
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs mb-1" style={{ color: '#3d5e44' }}>
                        <span style={{ color: plan.color }}>✓</span> {f}
                      </div>
                    ))}
                    <button onClick={() => handlePayNow(plan)}
                      className="w-full mt-3 py-3 rounded-xl font-bold text-white text-sm"
                      style={{ background: `linear-gradient(135deg,${plan.color},${plan.color}cc)` }}>
                      Pay {plan.price} via UPI →
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: '#ddeae0' }} />
                  <span className="text-xs" style={{ color: '#9dc9a8' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: '#ddeae0' }} />
                </div>

                <button onClick={handlePayPerComplaint}
                  className="w-full flex justify-between items-center px-5 py-4 rounded-2xl border-2"
                  style={{ borderColor: '#f0d080', background: '#fffcf0' }}>
                  <div className="text-left">
                    <div className="text-xs" style={{ color: '#6b8f72' }}>Just this one complaint</div>
                    <div className="font-bold text-sm" style={{ color: '#192b1d' }}>Quick Submit</div>
                  </div>
                  <div className="text-2xl font-extrabold" style={{ color: '#b87000' }}>₹5 →</div>
                </button>
              </>
            )}

            {/* ── UPI STEP ── */}
            {payStep === 'upi' && (
              <div className="text-center">
                <button onClick={() => setPayStep('choose')}
                  className="absolute top-6 left-6 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: '#f0f5f1' }}>
                  <X size={16} color="#6b8f72" />
                </button>
                <div className="text-4xl mb-3">💳</div>
                <div className="text-xl font-extrabold mb-1" style={{ color: '#192b1d' }}>
                  Pay {selectedPlan?.price}
                </div>
                <div className="text-sm mb-5" style={{ color: '#6b8f72' }}>{selectedPlan?.name}</div>

                {/* UPI ID display */}
                <div className="rounded-2xl p-4 mb-5 text-left"
                  style={{ background: '#f0f5f1', border: '1.5px solid #ddeae0' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#6b8f72' }}>
                    Pay to UPI ID
                  </div>
                  <div className="font-extrabold text-lg" style={{ color: '#192b1d' }}>{UPI_ID}</div>
                  <div className="text-xs mt-1" style={{ color: '#6b8f72' }}>
                    Amount: <strong style={{ color: '#1a7f3c' }}>{selectedPlan?.price}</strong>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#6b8f72' }}>Name: {UPI_NAME}</div>
                </div>

                <button onClick={handleOpenUPI}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base mb-3 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  📱 Open UPI App to Pay →
                </button>
                <button onClick={() => setPayStep('screenshot')}
                  className="w-full py-3 rounded-2xl font-semibold text-sm border-2"
                  style={{ borderColor: '#ddeae0', color: '#6b8f72' }}>
                  Already paid? Upload screenshot →
                </button>
              </div>
            )}

            {/* ── SCREENSHOT STEP ── */}
            {payStep === 'screenshot' && (
              <div className="text-center">
                <div className="text-4xl mb-3">📸</div>
                <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>
                  Upload Payment Screenshot
                </div>
                <div className="text-sm mb-2" style={{ color: '#6b8f72' }}>
                  Take a screenshot of your payment confirmation and upload it here.
                </div>
                <div className="text-xs mb-6 px-4 py-2 rounded-xl"
                  style={{ background: '#e8f5ec', color: '#1a7f3c' }}>
                  We'll verify and activate your plan within 24 hours.
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={handleScreenshot} />
                <button onClick={() => fileRef.current.click()} disabled={uploading}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload Screenshot'}
                </button>
                <div className="text-xs" style={{ color: '#9dc9a8' }}>
                  📱 {profile?.phone} · ID: {profile?.id?.slice(0,8)}
                </div>
              </div>
            )}

            {/* ── DONE ── */}
            {payStep === 'done' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>
                  Screenshot Submitted!
                </div>
                <div className="text-sm mb-6" style={{ color: '#6b8f72' }}>
                  We've received your payment proof. Your plan will be activated within 24 hours.
                </div>
                <button onClick={() => { setShowPayment(false); setPayStep('choose') }}
                  className="w-full py-4 rounded-2xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  Got it! ✓
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}