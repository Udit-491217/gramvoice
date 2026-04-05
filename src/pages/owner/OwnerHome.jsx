import { useState } from 'react'
import {
  LayoutDashboard, Globe, CreditCard,
  BarChart2, LogOut
} from 'lucide-react'
import OwnerVillages  from './OwnerVillages'
import OwnerPayments  from './OwnerPayments'
import OwnerAnalytics from './OwnerAnalytics'

export default function OwnerHome({ profile, onLogout }) {
  const [screen, setScreen] = useState('villages')

  const navItems = [
    { key: 'villages',  label: 'Villages',  icon: Globe        },
    { key: 'payments',  label: 'Payments',  icon: CreditCard   },
    { key: 'analytics', label: 'Analytics', icon: BarChart2    },
  ]

  const renderScreen = () => {
    if (screen === 'villages')  return <OwnerVillages  />
    if (screen === 'payments')  return <OwnerPayments  />
    if (screen === 'analytics') return <OwnerAnalytics />
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* TOP BAR */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(145deg,#0f4d23,#1a7f3c)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            🔐 Owner Dashboard
          </div>
          <div className="text-xl font-extrabold text-white">GramVoice HQ</div>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* NAV */}
      <div className="flex border-b px-2"
        style={{ background: 'white', borderColor: '#ddeae0' }}>
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setScreen(key)}
            className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all"
            style={{
              borderColor: screen === key ? '#1a7f3c' : 'transparent',
              color:       screen === key ? '#1a7f3c' : '#6b8f72'
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderScreen()}
      </div>

    </div>
  )
}