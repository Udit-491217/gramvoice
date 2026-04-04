import { useEffect, useState } from 'react'

export default function Splash() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 900)
    const t3 = setTimeout(() => setPhase(3), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #f0faf3 0%, #e8f5ec 50%, #f7fdf8 100%)' }}>

      {/* Logo */}
      <div className={`transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1a7f3c, #2db856)' }}>
          <span className="text-5xl">🌾</span>
        </div>
      </div>

      {/* Name */}
      <div className={`text-center transition-all duration-700 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '100ms' }}>
        <div className="text-5xl font-extrabold tracking-tight mb-2"
          style={{ color: '#0f4d23', letterSpacing: '-1.5px' }}>
          GramVoice
        </div>
        <div className="text-sm font-medium tracking-widest uppercase"
          style={{ color: '#6aad7e', letterSpacing: '4px' }}>
          Digital Village System
        </div>
      </div>

      {/* Tagline */}
      <div className={`mt-5 transition-all duration-700 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '200ms' }}>
        <div className="text-base font-light text-center px-8" style={{ color: '#4a8c5c', lineHeight: '1.6' }}>
          Your village. Your voice. Your rights.
        </div>
      </div>

      {/* Dots */}
      <div className={`absolute bottom-16 transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: '#2db856', animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}