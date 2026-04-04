import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLogin({ onBack }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Invalid email or password. Contact GramVoice team.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #fffbf0 0%, #fef3e2 60%, #fffdf7 100%)' }}>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        <button onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold mb-8 px-4 py-2 rounded-xl"
          style={{ color: '#92400e', background: '#fef3e2' }}>
          ← Back
        </button>

        <div className="mb-8">
          <div className="text-3xl font-extrabold tracking-tight mb-1"
            style={{ color: '#78350f', letterSpacing: '-0.5px' }}>
            Admin Login
          </div>
          <div className="text-sm font-light" style={{ color: '#c4843a' }}>
            Registered village admins only
          </div>
        </div>

        <div className="flex flex-col gap-5">

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#92400e' }}>
              Email Address
            </div>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@village.com"
              className="w-full rounded-2xl px-5 py-4 text-base outline-none border-2 transition-all"
              style={{
                borderColor: email ? '#d97706' : '#fde8c8',
                color: '#78350f',
                boxShadow: email ? '0 0 0 4px rgba(217,119,6,0.08)' : 'none'
              }} />
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#92400e' }}>
              Password
            </div>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl px-5 py-4 text-base outline-none border-2 transition-all"
              style={{
                borderColor: password ? '#d97706' : '#fde8c8',
                color: '#78350f',
                boxShadow: password ? '0 0 0 4px rgba(217,119,6,0.08)' : 'none'
              }} />
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
              background: 'linear-gradient(135deg, #92400e, #d97706)',
              boxShadow: '0 8px 24px rgba(217,119,6,0.25)'
            }}>
            {loading ? 'Logging in...' : 'Login as Admin →'}
          </button>

          <div className="text-center text-xs font-light" style={{ color: '#c4843a' }}>
            No access yet? Contact the GramVoice team<br />to register your village.
          </div>

        </div>
      </div>
    </div>
  )
}