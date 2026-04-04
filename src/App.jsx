import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Splash from './pages/Splash'
import RoleSelect from './pages/RoleSelect'
import MemberLogin from './pages/MemberLogin'
import AdminLogin from './pages/AdminLogin'
import Home from './pages/Home'
import AdminHome from './pages/AdminHome'

export default function App() {
  const [screen, setScreen]   = useState('splash')
  const [role, setRole]       = useState(null)
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('gv_profile')
    if (saved) {
      const p = JSON.parse(saved)
      setProfile(p)
      setRole('member')
      // Returning member — skip splash, go home directly
      setScreen('home')
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user)
          setRole('admin')
          // Returning admin — skip splash too
          setScreen('adminhome')
        } else {
          // New user — show splash then roleselect
          setTimeout(() => setScreen('roleselect'), 3000)
        }
      })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        setRole('admin')
        setScreen('adminhome')
      }
    })
  }, [])

  const handleMemberLogin = (profileData) => {
    // Ensure joined_at is set when member first logs in
    const withJoinDate = {
      ...profileData,
      joined_at: profileData.joined_at || new Date().toISOString()
    }
    localStorage.setItem('gv_profile', JSON.stringify(withJoinDate))
    setProfile(withJoinDate)
    setRole('member')
    setScreen('home')
  }

  const handleProfileUpdate = (updated) => {
    localStorage.setItem('gv_profile', JSON.stringify(updated))
    setProfile(updated)
  }

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole)
    setScreen(selectedRole === 'member' ? 'memberlogin' : 'adminlogin')
  }

  const handleLogout = async () => {
    localStorage.removeItem('gv_profile')
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setProfile(null)
    setScreen('roleselect')
  }

  if (screen === 'splash')      return <Splash />
  if (screen === 'roleselect')  return <RoleSelect onSelect={handleRoleSelect} />
  if (screen === 'memberlogin') return <MemberLogin onLogin={handleMemberLogin} onBack={() => setScreen('roleselect')} />
  if (screen === 'adminlogin')  return <AdminLogin onBack={() => setScreen('roleselect')} />
  if (screen === 'home')        return <Home profile={profile} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
  if (screen === 'adminhome')   return <AdminHome user={user} onLogout={handleLogout} />
  return null
}