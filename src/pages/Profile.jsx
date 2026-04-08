import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, User, Phone, MapPin, Shield,
  Star, LogOut, ChevronRight, BookOpen, X, Camera, Upload
} from 'lucide-react'

const UPI_ID   = 'notjustudit@fam'
const UPI_NAME = 'GramVoice'

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

function openUPI(amount, note) {
  const url = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
  window.location.href = url
}

export default function Profile({ profile, village, onLogout, onBack, onProfileUpdate }) {
  const [showRulebook, setShowRulebook] = useState(false)
  const [showPayment, setShowPayment]   = useState(false)
  const [payStep, setPayStep]           = useState('choose') // choose | upi | screenshot | done
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [rules, setRules]               = useState([])
  const [loadingRules, setLoadingRules] = useState(false)
  const [avatarUrl, setAvatarUrl]       = useState(profile?.avatar_url || null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef                         = useRef()
  const screenshotRef                   = useRef()

  const planConfig = {
    free:    { label: 'Free Plan',         color: '#6b8f72', bg: '#e6f5eb' },
    monthly: { label: 'Gram Voice ⚡',     color: '#1a7f3c', bg: '#d0f0da' },
    yearly:  { label: 'Gram Voice Pro 🏆', color: '#b87000', bg: '#fff3cd' }
  }
  const plan = planConfig[profile?.plan] || planConfig.free

  // ── Rulebook ─────────────────────────────────────────────
  const openRulebook = async () => {
    setShowRulebook(true)
    setLoadingRules(true)
    const { data } = await supabase
      .from('rulebook').select('*')
      .eq('village_id', profile.village_id)
      .order('created_at', { ascending: true })
    if (data) setRules(data)
    setLoadingRules(false)
  }

  // ── Avatar upload ────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    const ext      = file.name.split('.').pop()
    const filePath = `${profile.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) { alert('Upload failed.'); setAvatarUploading(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl + '?t=' + Date.now()
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    setAvatarUrl(publicUrl)
    if (onProfileUpdate) onProfileUpdate({ ...profile, avatar_url: publicUrl })
    setAvatarUploading(false)
  }

  // ── UPI Config ───────────────────────────────────────────
const UPI_ID   = 'notjustudit@fam'
const UPI_NAME = 'Udit Kr Tanti'  // Name shown in UPI app

// ── Open UPI App ─────────────────────────────────────────
const openUPIApp = (amount, note) => {
  // This deep link opens ANY UPI app — GPay, PhonePe, Paytm etc.
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
  window.location.href = upiUrl

  // After 3 seconds (user has gone to UPI app), show screenshot step on return
  setTimeout(() => setPayStep('screenshot'), 3000)
}

// ── Pay Now clicked ──────────────────────────────────────
const handlePayNow = (plan) => {
  setSelectedPlan(plan)
  setPayStep('upi')
}

// ── Open UPI button clicked ──────────────────────────────
const handleOpenUPI = () => {
  const note = `GramVoice ${selectedPlan?.name} - ${profile?.phone || profile?.id?.slice(0, 8)}`
  openUPIApp(selectedPlan?.upiAmount, note)
}

// ── Screenshot upload ────────────────────────────────────
const handleScreenshot = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  setUploading(true)

  const filePath = `${profile.id}-${Date.now()}.${file.name.split('.').pop()}`

  const { error: upErr } = await supabase.storage
    .from('payment-proofs')
    .upload(filePath, file, { upsert: true })

  if (upErr) {
    alert('Upload failed. Try again.')
    setUploading(false)
    return
  }

  const { data: urlData } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(filePath)

  await supabase.from('payment_requests').insert({
    user_id:        profile.id,
    village_id:     profile.village_id,
    plan:           selectedPlan?.id,
    amount:         selectedPlan?.upiAmount,
    screenshot_url: urlData.publicUrl,
    status:         'pending'
  })

  setUploading(false)
  setPayStep('done')
}

// ── UPI Screen JSX ───────────────────────────────────────
// payStep === 'upi'
const UPIScreen = () => (
  <div className="text-center">
    <button onClick={() => setPayStep('choose')}
      className="flex items-center gap-1 text-xs mb-4 font-semibold"
      style={{ color: '#6b8f72' }}>
      ← Back
    </button>

    {/* Amount display */}
    <div className="text-6xl font-extrabold mb-1" style={{ color: '#1a7f3c' }}>
      {selectedPlan?.price}
    </div>
    <div className="text-sm mb-1" style={{ color: '#6b8f72' }}>
      {selectedPlan?.name}
    </div>

    {/* UPI Details Card */}
    <div className="rounded-2xl p-4 mb-6 text-left mt-5"
      style={{ background: '#f0f5f1', border: '1.5px solid #ddeae0' }}>

      <div className="flex items-center gap-3 mb-3 pb-3"
        style={{ borderBottom: '1px solid #ddeae0' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: '#e6f5eb' }}>
          💳
        </div>
        <div>
          <div className="font-extrabold text-base" style={{ color: '#192b1d' }}>
            {UPI_NAME}
          </div>
          <div className="text-sm font-medium" style={{ color: '#1a7f3c' }}>
            {UPI_ID}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#6b8f72' }}>Amount</span>
        <span className="font-extrabold text-lg" style={{ color: '#1a7f3c' }}>
          {selectedPlan?.price}
        </span>
      </div>
    </div>

    {/* Open UPI App Button */}
    <button onClick={handleOpenUPI}
      className="w-full py-4 rounded-2xl font-extrabold text-white text-base mb-3 flex items-center justify-center gap-2"
      style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)', boxShadow: '0 8px 24px rgba(26,127,60,0.25)' }}>
      📱 Pay with UPI →
    </button>

    <div className="text-xs mb-4" style={{ color: '#9dc9a8' }}>
      Opens GPay · PhonePe · Paytm · Any UPI app
    </div>

    {/* Already paid link */}
    <button onClick={() => setPayStep('screenshot')}
      className="w-full py-3 rounded-2xl font-semibold text-sm border-2"
      style={{ borderColor: '#ddeae0', color: '#6b8f72' }}>
      Already paid? Upload screenshot →
    </button>
  </div>
)

// ── Screenshot Screen JSX ────────────────────────────────
// payStep === 'screenshot'
const ScreenshotScreen = () => (
  <div className="text-center">
    <div className="text-4xl mb-3">📸</div>
    <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>
      Upload Payment Screenshot
    </div>
    <div className="text-sm mb-2" style={{ color: '#6b8f72' }}>
      Take a screenshot of your payment confirmation and upload it here.
    </div>
    <div className="rounded-2xl p-3 mb-6 text-sm font-semibold"
      style={{ background: '#e8f5ec', color: '#1a7f3c' }}>
      ✓ We'll verify and activate your plan within 24 hours
    </div>

    {/* Screenshot preview */}
    {screenshotPreview && (
      <div className="mb-4 rounded-2xl overflow-hidden border-2"
        style={{ borderColor: '#1a7f3c' }}>
        <img src={screenshotPreview} alt="Payment proof"
          className="w-full object-cover max-h-48" />
      </div>
    )}

    <input ref={screenshotRef} type="file" accept="image/*"
      className="hidden" onChange={handleScreenshot} />

    <button onClick={() => screenshotRef.current.click()} disabled={uploading}
      className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
      {uploading
        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
        : <><Upload size={18} /> Upload Screenshot</>
      }
    </button>

    <div className="text-xs" style={{ color: '#9dc9a8' }}>
      📱 {profile?.phone} · Paid: {selectedPlan?.price}
    </div>
  </div>
)

// ── Done Screen JSX ──────────────────────────────────────
// payStep === 'done'
const DoneScreen = () => (
  <div className="text-center py-4">
    <div className="text-6xl mb-4">🎉</div>
    <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>
      Payment Submitted!
    </div>
    <div className="rounded-2xl p-4 mb-6"
      style={{ background: '#e8f5ec', border: '1.5px solid #b8e8c8' }}>
      <div className="text-sm font-semibold mb-1" style={{ color: '#1a7f3c' }}>
        What happens next?
      </div>
      <div className="text-xs" style={{ color: '#3d5e44', lineHeight: '1.8' }}>
        ✓ Screenshot received<br />
        ✓ We'll verify within 24 hours<br />
        ✓ Plan activated automatically<br />
        ✓ You'll see "Paid ⚡" badge on profile
      </div>
    </div>
    <button onClick={closePayment}
      className="w-full py-4 rounded-2xl font-bold text-white"
      style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
      Got it! ✓
    </button>
  </div>
)

  const closePayment = () => { setShowPayment(false); setPayStep('choose'); setSelectedPlan(null) }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* HEADER */}
      <div className="px-5 pt-6 pb-12"
        style={{ background: 'linear-gradient(145deg,#1a7f3c,#2db856)' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div className="text-xl font-extrabold text-white">My Profile</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <User size={44} color="white" />}
            </div>
            <button onClick={() => fileRef.current.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white"
              style={{ background: '#1a7f3c' }}>
              {avatarUploading
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={14} color="white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={handleAvatarChange} />
          </div>
          <div className="text-2xl font-extrabold text-white">{profile?.name}</div>
          <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Gram Member · {village?.name}
          </div>
          <div className="mt-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: plan.bg, color: plan.color }}>
            {plan.label}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-5 pb-8 flex flex-col gap-3">

        {/* INFO CARD */}
        <div className="bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
          {[
            { icon: <Phone size={16} color="#1a7f3c" />,  label: 'Phone',   value: profile?.phone    },
            { icon: <MapPin size={16} color="#1a7f3c" />, label: 'Village', value: village?.name     },
            { icon: <Shield size={16} color="#1a7f3c" />, label: 'Role',    value: 'Gram Member'     },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
              style={{ borderColor: '#f0f5f1' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: '#e6f5eb' }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                  style={{ color: '#9dc9a8' }}>{item.label}</div>
                <div className="font-semibold text-sm" style={{ color: '#192b1d' }}>
                  {item.value || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RULEBOOK */}
        <button onClick={openRulebook}
          className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border"
          style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#e6f5eb' }}>
            <BookOpen size={18} color="#1a7f3c" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-bold text-sm" style={{ color: '#192b1d' }}>Village Rulebook</div>
            <div className="text-xs" style={{ color: '#6b8f72' }}>Rules & guidelines for {village?.name}</div>
          </div>
          <ChevronRight size={16} color="#9dc9a8" />
        </button>

        {/* UPGRADE CARD — only for free users */}
        {profile?.plan === 'free' && (
          <button onClick={() => setShowPayment(true)}
            className="w-full rounded-2xl p-5 border text-left"
            style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)', borderColor: '#1a7f3c' }}>
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} color="#ffd700" fill="#ffd700" />
              <div className="font-extrabold text-white">Unlock Gram Voice</div>
            </div>
            <div className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Unlimited complaints, priority processing and AI access.
            </div>
            <div className="w-full py-3 rounded-xl font-bold text-sm text-center"
              style={{ background: 'white', color: '#1a7f3c' }}>
              Upgrade · Starting ₹49/month →
            </div>
          </button>
        )}

        {/* LOGOUT */}
        <button onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border font-bold text-sm"
          style={{ background: 'white', borderColor: '#ffd0cc', color: '#c0392b' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* ── RULEBOOK MODAL ── */}
      {showRulebook && (
        <div className="fixed inset-0 z-50 flex flex-col"
          style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>
          <div className="px-5 pt-6 pb-5"
            style={{ background: 'linear-gradient(145deg,#1a7f3c,#2db856)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowRulebook(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                <X size={18} color="white" />
              </button>
              <div>
                <div className="text-xl font-extrabold text-white">Village Rulebook</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {village?.name} · Official Guidelines
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-4">
            {loadingRules && (
              <div className="text-center py-12" style={{ color: '#6b8f72' }}>Loading rulebook...</div>
            )}
            {!loadingRules && rules.length === 0 && (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <BookOpen size={48} color="#b8d4bc" />
                <div className="font-bold" style={{ color: '#6b8f72' }}>No rules added yet</div>
                <div className="text-sm" style={{ color: '#9dc9a8' }}>
                  The village admin hasn't uploaded the rulebook yet.
                </div>
              </div>
            )}
            {rules.map((rule, i) => (
              <div key={rule.id} className="bg-white rounded-2xl p-5 border"
                style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#1a7f3c' }}>{i + 1}</div>
                  <div className="font-extrabold text-sm" style={{ color: '#192b1d' }}>{rule.title}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full w-fit mb-3 font-semibold uppercase tracking-wider"
                  style={{ background: '#e6f5eb', color: '#1a7f3c' }}>{rule.category}</div>
                <div className="text-sm" style={{ color: '#3d5e44', lineHeight: '1.7' }}>{rule.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {showPayment && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={closePayment}>
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#ddeae0' }} />

            {/* CHOOSE */}
            {payStep === 'choose' && (
              <>
                <div className="text-2xl font-extrabold text-center mb-1" style={{ color: '#192b1d' }}>
                  🔊 Unlock Your Voice
                </div>
                <div className="text-sm text-center mb-4" style={{ color: '#6b8f72' }}>Choose your plan</div>
                <div className="rounded-2xl p-3 mb-4 text-center text-sm font-semibold"
                  style={{ background: '#e8f5ec', color: '#1a7f3c' }}>
                  🎉 First month completely FREE — try before you pay!
                </div>
                {PLANS.map(p => (
                  <div key={p.id} className="rounded-2xl p-4 border-2 mb-3 relative"
                    style={{ borderColor: p.border, background: p.bg }}>
                    {p.popular && (
                      <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: p.color }}>⭐ MOST POPULAR</div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-extrabold" style={{ color: '#192b1d' }}>{p.name}</div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold" style={{ color: p.color }}>{p.price}</div>
                        <div className="text-xs" style={{ color: '#6b8f72' }}>{p.period}</div>
                      </div>
                    </div>
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs mb-1" style={{ color: '#3d5e44' }}>
                        <span style={{ color: p.color }}>✓</span> {f}
                      </div>
                    ))}
                    <button onClick={() => handlePayNow(p)}
                      className="w-full mt-3 py-3 rounded-xl font-bold text-white text-sm"
                      style={{ background: `linear-gradient(135deg,${p.color},${p.color}cc)` }}>
                      Pay {p.price} via UPI →
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* UPI */}
            {payStep === 'upi' && (
              <div className="text-center">
                <button onClick={() => setPayStep('choose')}
                  className="flex items-center gap-1 text-xs mb-4 font-semibold"
                  style={{ color: '#6b8f72' }}>
                  ← Back
                </button>
                <div className="text-4xl mb-3">💳</div>
                <div className="text-xl font-extrabold mb-1" style={{ color: '#192b1d' }}>
                  Pay {selectedPlan?.price}
                </div>
                <div className="text-sm mb-5" style={{ color: '#6b8f72' }}>{selectedPlan?.name}</div>
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

            {/* SCREENSHOT */}
            {payStep === 'screenshot' && (
              <div className="text-center">
                <div className="text-4xl mb-3">📸</div>
                <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>
                  Upload Payment Screenshot
                </div>
                <div className="text-sm mb-2" style={{ color: '#6b8f72' }}>
                  Upload your payment confirmation screenshot.
                </div>
                <div className="text-xs mb-6 px-4 py-2 rounded-xl"
                  style={{ background: '#e8f5ec', color: '#1a7f3c' }}>
                  We'll verify and activate your plan within 24 hours.
                </div>
                <input ref={screenshotRef} type="file" accept="image/*" className="hidden"
                  onChange={handleScreenshot} />
                <button onClick={() => screenshotRef.current.click()} disabled={uploading}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload Screenshot'}
                </button>
              </div>
            )}

            {/* DONE */}
            {payStep === 'done' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>
                  Screenshot Submitted!
                </div>
                <div className="text-sm mb-6" style={{ color: '#6b8f72' }}>
                  Payment proof received. Plan will be activated within 24 hours.
                </div>
                <button onClick={closePayment}
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