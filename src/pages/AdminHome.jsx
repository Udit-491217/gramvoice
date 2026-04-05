import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, FileText, Bell, BookOpen,
  Users, LogOut, Menu, X
} from 'lucide-react'
import AdminDashboard  from './admin/AdminDashboard'
import AdminComplaints from './admin/AdminComplaints'
import AdminNotices    from './admin/AdminNotices'
import AdminRulebook   from './admin/AdminRulebook'
import AdminMembers    from './admin/AdminMembers'

export default function AdminHome({ user, onLogout }) {
  const [screen, setScreen]   = useState('dashboard')
  const [village, setVillage] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { fetchAdminVillage() }, [])

  const fetchAdminVillage = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, villages(*)')
      .eq('id', user?.id)
      .single()
    if (profile?.villages) setVillage(profile.villages)
    else {
      // fallback — get village by admin_email
      const { data: v } = await supabase
        .from('villages')
        .select('*')
        .eq('admin_email', user?.email)
        .single()
      if (v) setVillage(v)
    }
  }

  const navItems = [
    { key: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { key: 'complaints', label: 'Complaints', icon: FileText         },
    { key: 'notices',    label: 'Notices',    icon: Bell             },
    { key: 'rulebook',   label: 'Rulebook',   icon: BookOpen         },
    { key: 'members',    label: 'Members',    icon: Users            },
  ]

  const renderScreen = () => {
    const props = { village, user }
    if (screen === 'dashboard')  return <AdminDashboard  {...props} />
    if (screen === 'complaints') return <AdminComplaints {...props} />
    if (screen === 'notices')    return <AdminNotices    {...props} />
    if (screen === 'rulebook')   return <AdminRulebook   {...props} />
    if (screen === 'members')    return <AdminMembers    {...props} />
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* TOP BAR */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(145deg, #1a7f3c, #2db856)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            Admin Panel
          </div>
          <div className="text-xl font-extrabold text-white">
            {village?.name || 'Your Village'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* NAV TABS */}
      <div className="flex overflow-x-auto border-b px-2"
        style={{ background: 'white', borderColor: '#ddeae0' }}>
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setScreen(key)}
            className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all"
            style={{
              borderColor:  screen === key ? '#1a7f3c' : 'transparent',
              color:        screen === key ? '#1a7f3c' : '#6b8f72'
            }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* SCREEN */}
      <div className="flex-1 overflow-y-auto">
        {renderScreen()}
      </div>

    </div>
  )
}