import { useState } from 'react'
export default function RoleSelect({ onSelect }) {
  const [pressed, setPressed] = useState(null)

  const handle = (role) => {
    setPressed(role)
    setTimeout(() => onSelect(role), 300)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #f0faf3 0%, #e8f5ec 50%, #f7fdf8 100%)' }}>

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="animate-fadeUp mb-10 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1a7f3c, #2db856)' }}>
            <span className="text-3xl">🌾</span>
          </div>
          <div className="text-4xl font-extrabold tracking-tight mb-2"
            style={{ color: '#0f4d23', letterSpacing: '-1px' }}>
            GramVoice
          </div>
          <div className="text-base font-light" style={{ color: '#6aad7e' }}>
            Select how you want to continue
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4">

          <button
            onClick={() => handle('member')}
            className={`w-full text-left rounded-3xl p-6 border-2 transition-all duration-300 animate-fadeUp delay-100
              ${pressed === 'member' ? 'scale-95 opacity-70' : 'hover:scale-[1.02] active:scale-95'}`}
            style={{
              background: pressed === 'member'
                ? 'linear-gradient(135deg, #1a7f3c, #2db856)'
                : 'white',
              borderColor: pressed === 'member' ? '#1a7f3c' : '#d4edda',
              boxShadow: '0 4px 24px rgba(26,127,60,0.10)'
            }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: pressed === 'member' ? 'rgba(255,255,255,0.2)' : '#e8f5ec' }}>
                🏘️
              </div>
              <div>
                <div className="text-lg font-bold mb-0.5"
                  style={{ color: pressed === 'member' ? 'white' : '#0f4d23' }}>
                  Gram Member
                </div>
                <div className="text-sm font-light"
                  style={{ color: pressed === 'member' ? 'rgba(255,255,255,0.8)' : '#6b8f72' }}>
                  Village resident · Submit complaints · Track issues
                </div>
              </div>
              <div className="ml-auto text-2xl"
                style={{ color: pressed === 'member' ? 'white' : '#b8d4bc' }}>›</div>
            </div>
          </button>

          <button
            onClick={() => handle('admin')}
            className={`w-full text-left rounded-3xl p-6 border-2 transition-all duration-300 animate-fadeUp delay-200
              ${pressed === 'admin' ? 'scale-95 opacity-70' : 'hover:scale-[1.02] active:scale-95'}`}
            style={{
              background: pressed === 'admin'
                ? 'linear-gradient(135deg, #92400e, #d97706)'
                : 'white',
              borderColor: pressed === 'admin' ? '#d97706' : '#fde8c8',
              boxShadow: '0 4px 24px rgba(217,119,6,0.10)'
            }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: pressed === 'admin' ? 'rgba(255,255,255,0.2)' : '#fef3e2' }}>
                🏛️
              </div>
              <div>
                <div className="text-lg font-bold mb-0.5"
                  style={{ color: pressed === 'admin' ? 'white' : '#78350f' }}>
                  Village Admin
                </div>
                <div className="text-sm font-light"
                  style={{ color: pressed === 'admin' ? 'rgba(255,255,255,0.8)' : '#6b8f72' }}>
                  Panchayat officer · Manage complaints
                </div>
              </div>
              <div className="ml-auto text-2xl"
                style={{ color: pressed === 'admin' ? 'white' : '#f0c070' }}>›</div>
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="animate-fadeUp delay-400 text-center mt-10">
          <div className="text-xs font-light" style={{ color: '#a8c9b0' }}>
            Powered by GramVoice · Made for Assam 🌿
          </div>
        </div>

      </div>
    </div>
  )
}