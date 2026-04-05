import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react'

export default function OwnerPin({ profile, onSuccess, onBack }) {
  const [pin, setPin]       = useState('')
  const [show, setShow]     = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (!pin) { setError('Enter your PIN'); return }
    setLoading(true)
    setError('')

    // Verify PIN against DB
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase
      .from('profiles')
      .select('owner_pin')
      .eq('id', profile.id)
      .single()

    if (data?.owner_pin === pin) {
      onSuccess()
    } else {
      setError('Incorrect PIN. Access denied.')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg,#0f4d23,#1a7f3c)', fontFamily: 'Outfit, sans-serif' }}>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Shield size={40} color="white" />
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">Owner Access</div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Enter your secret PIN to continue
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: '#4a8c5c' }}>Secret PIN</div>
          <div className="relative mb-4">
            <input
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="Enter PIN"
              className="w-full rounded-2xl px-5 py-4 text-base outline-none border-2 transition-all font-mono tracking-widest"
              style={{
                borderColor: pin ? '#1a7f3c' : '#ddeae0',
                color: '#192b1d',
                boxShadow: pin ? '0 0 0 4px rgba(26,127,60,0.08)' : 'none'
              }} />
            <button onClick={() => setShow(!show)}
              className="absolute right-4 top-1/2 -translate-y-1/2">
              {show ? <EyeOff size={18} color="#6b8f72" /> : <Eye size={18} color="#6b8f72" />}
            </button>
          </div>

          {error && (
            <div className="text-sm font-medium px-4 py-3 rounded-xl mb-4"
              style={{ background: '#fff0f0', color: '#c0392b' }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleVerify} disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
            {loading ? 'Verifying...' : 'Enter Dashboard →'}
          </button>
        </div>

        <button onClick={onBack}
          className="flex items-center gap-2 mx-auto mt-6 text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    </div>
  )
}