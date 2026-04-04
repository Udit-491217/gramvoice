import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MemberLogin({ onLogin, onBack }) {
  const [phone, setPhone]             = useState('')
  const [name, setName]               = useState('')
  const [villageCode, setVillageCode] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const handleLogin = async () => {
    if (!phone || !name || !villageCode) {
      setError('Please fill all fields')
      return
    }
    setLoading(true)
    setError('')

    // Step 1 — Find village by code
    const { data: village } = await supabase
      .from('villages')
      .select('*')
      .ilike('code', villageCode.trim())
      .single()

    if (!village) {
      setError('Invalid village code. Please check and try again.')
      setLoading(false)
      return
    }

    // Step 2 — Check if member already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .single()

    let profileData

    if (existing) {
      // Returning member — just update name if changed, keep joined_at intact
      const { data: updated } = await supabase
        .from('profiles')
        .update({ name, village_id: village.id })
        .eq('phone', phone)
        .select()
        .single()
      profileData = updated
    } else {
      // New member — set joined_at NOW so free trial starts
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          phone,
          name,
          village_id: village.id,
          role:       'member',
          plan:       'free',
          joined_at:  new Date().toISOString(),
          complaints_this_month: 0,
          ai_minutes_used:       0,
        })
        .select()
        .single()

      if (createError) {
        setError('Something went wrong. Try again.')
        setLoading(false)
        return
      }
      profileData = created
    }

    onLogin({ ...profileData, villageName: village.name })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #f0faf3 0%, #e8f5ec 60%, #f7fdf8 100%)' }}>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        <button onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold mb-8 px-4 py-2 rounded-xl"
          style={{ color: '#1a7f3c', background: '#e8f5ec' }}>
          ← Back
        </button>

        <div className="mb-8">
          <div className="text-3xl font-extrabold tracking-tight mb-1"
            style={{ color: '#0f4d23', letterSpacing: '-0.5px' }}>
            Join Your Village
          </div>
          <div className="text-sm font-light" style={{ color: '#6aad7e' }}>
            Enter your details to get started
          </div>
        </div>

        <div className="flex flex-col gap-5">

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#4a8c5c' }}>Phone Number</div>
            <input type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="98765 43210"
              className="w-full rounded-2xl px-5 py-4 text-base outline-none border-2 transition-all"
              style={{
                borderColor: phone ? '#1a7f3c' : '#d4edda',
                color: '#0f4d23',
                boxShadow: phone ? '0 0 0 4px rgba(26,127,60,0.08)' : 'none'
              }} />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#4a8c5c' }}>Your Name</div>
            <input type="text" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ramesh Bora"
              className="w-full rounded-2xl px-5 py-4 text-base outline-none border-2 transition-all"
              style={{
                borderColor: name ? '#1a7f3c' : '#d4edda',
                color: '#0f4d23',
                boxShadow: name ? '0 0 0 4px rgba(26,127,60,0.08)' : 'none'
              }} />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#4a8c5c' }}>Village Code</div>
            <input type="text" value={villageCode}
              onChange={e => setVillageCode(e.target.value.toUpperCase())}
              placeholder="e.g. NAH001"
              className="w-full rounded-2xl px-5 py-4 text-base outline-none border-2 transition-all font-mono"
              style={{
                borderColor: villageCode ? '#1a7f3c' : '#d4edda',
                color: '#0f4d23',
                letterSpacing: '3px',
                boxShadow: villageCode ? '0 0 0 4px rgba(26,127,60,0.08)' : 'none'
              }} />
            <div className="text-xs mt-2 font-light" style={{ color: '#9dc9a8' }}>
              💡 Get this code from your Gram Panchayat or village notice board
            </div>
          </div>

          {error && (
            <div className="text-sm font-medium px-4 py-3 rounded-xl"
              style={{ background: '#fff0f0', color: '#c0392b' }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="w-full rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #1a7f3c, #2db856)',
              boxShadow: '0 8px 24px rgba(26,127,60,0.25)'
            }}>
            {loading ? 'Verifying...' : 'Enter GramVoice →'}
          </button>

          <div className="text-center">
            <div className="text-xs font-light" style={{ color: '#a8c9b0' }}>
              Your data is safe and private 🔒
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}