import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Splash      from './pages/Splash'
import RoleSelect  from './pages/RoleSelect'
import MemberLogin from './pages/MemberLogin'
import AdminLogin  from './pages/AdminLogin'
import Home        from './pages/Home'
import AdminHome   from './pages/AdminHome'
import OwnerPin    from './pages/owner/OwnerPin'
import OwnerHome   from './pages/owner/OwnerHome'

export default function App() {
  const [screen, setScreen]   = useState('splash')
  const [role, setRole]       = useState(null)
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // ── Returning member — skip splash ───────────────────
    const saved = localStorage.getItem('gv_profile')
    if (saved) {
      const p = JSON.parse(saved)
      setProfile(p)
      setRole('member')
      setScreen('home')
      return
    }

    // ── Returning admin/owner — check session ────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const isAdmin = await verifyAdmin(session.user)
        if (isAdmin) {
          setUser(session.user)
          setRole('admin')
          setScreen('adminhome')
        } else {
          await supabase.auth.signOut()
          setTimeout(() => setScreen('roleselect'), 3000)
        }
      } else {
        // New user — show splash then roleselect
        setTimeout(() => setScreen('roleselect'), 3000)
      }
    })

    // ── Listen for auth changes ──────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const isAdmin = await verifyAdmin(session.user)
        if (isAdmin) {
          setUser(session.user)
          setRole('admin')
          setScreen('adminhome')
        } else {
          await supabase.auth.signOut()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Verify admin via profiles.role OR villages.admin_email
  const verifyAdmin = async (authUser) => {
    if (!authUser) return false

    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (prof?.role === 'admin') return true

    const { data: village } = await supabase
      .from('villages')
      .select('id')
      .eq('admin_email', authUser.email)
      .single()

    return !!village
  }

  // ── Member login ─────────────────────────────────────────
  const handleMemberLogin = (profileData) => {
    // Owner flow
    if (profileData.is_owner) {
      setProfile(profileData)
      setRole('owner')
      setScreen('ownerpin')
      return
    }

    // Normal member — ensure joined_at is set for free trial
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
  if (screen === 'ownerpin')    return <OwnerPin  profile={profile} onSuccess={() => setScreen('ownerhome')} onBack={() => setScreen('roleselect')} />
  if (screen === 'ownerhome')   return <OwnerHome profile={profile} onLogout={handleLogout} />
  return null
}