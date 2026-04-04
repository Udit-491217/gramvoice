import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Home as HomeIcon, Bell, BarChart2, User, Plus,
  Zap, Users, ChevronRight, AlertTriangle,
  CheckCircle, Clock, Bot, Send, LogOut
} from 'lucide-react'
import Complaint from './Complaint'
import Notices from './Notices'
import Track from './Track'
import Community from './Community'
import PanchAI from './PanchAI'
import Profile from './Profile'

// ── Plan helper — exported so other pages can use it ─────
export function isPaid(profile) {
  if (!profile) return false
  if (profile.plan === 'monthly' || profile.plan === 'yearly') return true
  // First 30 days free trial
  if (profile.joined_at) {
    const diff = (Date.now() - new Date(profile.joined_at).getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 30) return true
  }
  return false
}

export default function Home({ profile, onLogout, onProfileUpdate }) {
  const [village, setVillage]           = useState(null)
  const [stats, setStats]               = useState({ total: 0, resolved: 0, pending: 0 })
  const [notices, setNotices]           = useState([])
  const [screen, setScreen]             = useState('home')
  const [lang, setLang]                 = useState('en')
  const [showEmergency, setShowEmergency] = useState(false)
  const [emergencySent, setEmergencySent] = useState(false)
  const [emergencySending, setEmergencySending] = useState(false)

  const paid = isPaid(profile)

  const trialDaysLeft = () => {
    if (!profile?.joined_at) return 0
    const diff = 30 - Math.floor((Date.now() - new Date(profile.joined_at).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const isInTrial = () => {
    if (!profile?.joined_at) return false
    const diff = (Date.now() - new Date(profile.joined_at).getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }

  useEffect(() => {
    if (profile?.village_id) {
      fetchVillage()
      fetchStats()
      fetchNotices()
    }
  }, [profile])

  const fetchVillage = async () => {
    const { data } = await supabase
      .from('villages').select('*')
      .eq('id', profile.village_id).single()
    if (data) setVillage(data)
  }

  const fetchStats = async () => {
    const { data } = await supabase
      .from('complaints').select('status')
      .eq('village_id', profile.village_id)
    if (data) setStats({
      total:    data.length,
      resolved: data.filter(c => c.status === 'resolved').length,
      pending:  data.filter(c => c.status === 'pending').length
    })
  }

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('notices').select('*')
      .eq('village_id', profile.village_id)
      .order('created_at', { ascending: false }).limit(1)
    if (data) setNotices(data)
  }

  // ── Emergency — saves to Supabase ────────────────────────
  const handleEmergency = async (type) => {
    setEmergencySending(true)
    try {
      await supabase.from('emergencies').insert({
        user_id:     profile.id,
        village_id:  profile.village_id,
        type,
        member_name: profile.name,
        phone:       profile.phone,
      })
    } catch (e) {
      console.error('Emergency save failed:', e)
    }
    setEmergencySending(false)
    setEmergencySent(true)
    setTimeout(() => {
      setEmergencySent(false)
      setShowEmergency(false)
    }, 3000)
  }

  const t = {
    en: {
      total: 'Total', resolved: 'Resolved', pending: 'Pending',
      ask: 'Ask anything about your village...',
      submit: 'Submit Complaint', submitSub: 'Raise your issue',
      notices: 'Notices', noticesSub: 'Latest updates',
      track: 'Track', trackSub: 'Your status',
      community: 'Community', communitySub: 'Village feed',
      quick: 'Quick Access', home: 'Home',
      profile: 'Profile', emergency: 'Emergency',
      trialBanner: `🎉 Free trial: ${trialDaysLeft()} days left`,
      trialExpired: 'Your free trial has ended. Upgrade to continue.'
    },
    hi: {
      total: 'कुल', resolved: 'हल हुई', pending: 'लंबित',
      ask: 'कुछ भी पूछें...',
      submit: 'शिकायत दर्ज करें', submitSub: 'अपनी बात कहें',
      notices: 'सूचनाएं', noticesSub: 'ताज़ा अपडेट',
      track: 'ट्रैक', trackSub: 'स्थिति देखें',
      community: 'समुदाय', communitySub: 'गांव फीड',
      quick: 'त्वरित पहुँच', home: 'होम',
      profile: 'प्रोफाइल', emergency: 'आपातकाल',
      trialBanner: `🎉 मुफ़्त ट्रायल: ${trialDaysLeft()} दिन बाकी`,
      trialExpired: 'आपका फ्री ट्रायल समाप्त हो गया। अपग्रेड करें।'
    }
  }[lang]

  if (screen === 'complaint') return <Complaint profile={profile} village={village} paid={paid} onBack={() => { setScreen('home'); fetchStats() }} onProfileUpdate={onProfileUpdate} />
  if (screen === 'notices')   return <Notices   profile={profile} village={village} onBack={() => setScreen('home')} lang={lang} />
  if (screen === 'track')     return <Track     profile={profile} village={village} paid={paid} onBack={() => setScreen('home')} />
  if (screen === 'community') return <Community profile={profile} village={village} paid={paid} onBack={() => setScreen('home')} />
  if (screen === 'panchai')   return <PanchAI   profile={profile} village={village} paid={paid} onBack={() => setScreen('home')} lang={lang} />
  if (screen === 'profile')   return <Profile   profile={profile} village={village} onLogout={onLogout} onBack={() => setScreen('home')} onProfileUpdate={onProfileUpdate} />

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* HEADER */}
      <div className="px-5 pt-6 pb-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a7f3c 0%, #27a34e 60%, #2db856 100%)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(30%,-30%)' }} />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7effaa' }} />
              <span className="text-xs font-medium tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                Live · {village?.district || 'Assam'}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white" style={{ letterSpacing: '-0.5px' }}>
              {village?.name || 'GramVoice'}
            </div>
            <div className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Gram Panchayat · {village?.state || 'Assam'}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex rounded-2xl overflow-hidden border"
              style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)' }}>
              {['en','hi'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{
                    background: lang === l ? 'rgba(255,255,255,0.25)' : 'transparent',
                    color:      lang === l ? 'white' : 'rgba(255,255,255,0.5)'
                  }}>
                  {l === 'en' ? 'EN' : 'हि'}
                </button>
              ))}
            </div>
            <button onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.7)' }}>
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>

        <button onClick={() => setShowEmergency(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-xs font-bold"
          style={{ background: '#c0392b', boxShadow: '0 3px 12px rgba(192,57,43,0.4)' }}>
          <AlertTriangle size={14} />
          {t.emergency}
        </button>
      </div>

      {/* TRIAL BANNER — only show during active trial */}
      {profile?.plan === 'free' && isInTrial() && (
        <div className="px-4 py-2 flex items-center justify-between"
          style={{ background: '#fff8e6', borderBottom: '1px solid #f0d080' }}>
          <span className="text-xs font-semibold" style={{ color: '#b87000' }}>
            {t.trialBanner}
          </span>
          <button onClick={() => setScreen('profile')}
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: '#b87000', color: 'white' }}>
            Upgrade
          </button>
        </div>
      )}

      {/* TRIAL EXPIRED BANNER */}
      {profile?.plan === 'free' && !isInTrial() && profile?.joined_at && (
        <div className="px-4 py-2 flex items-center justify-between"
          style={{ background: '#fff0f0', borderBottom: '1px solid #ffcccc' }}>
          <span className="text-xs font-semibold" style={{ color: '#c0392b' }}>
            {t.trialExpired}
          </span>
          <button onClick={() => setScreen('profile')}
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: '#c0392b', color: 'white' }}>
            Upgrade
          </button>
        </div>
      )}

      {/* MEMBER BADGE */}
      <div className="flex items-center gap-3 px-5 py-3 border-b"
        style={{ background: 'white', borderColor: '#ddeae0' }}>
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: '#e6f5eb' }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <User size={20} color="#1a7f3c" />}
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm" style={{ color: '#192b1d' }}>{profile?.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                background: paid ? '#d0f0da' : '#e6f5eb',
                color:      paid ? '#1a7f3c' : '#6b8f72'
              }}>
              {profile?.plan === 'yearly'  ? 'Pro 🏆'
               : profile?.plan === 'monthly' ? 'Paid ⚡'
               : isInTrial()               ? 'Trial 🎉'
               : 'Free'}
            </span>
            <span className="text-xs" style={{ color: '#6b8f72' }}>Gram Member</span>
          </div>
        </div>
        <button onClick={() => setScreen('profile')}>
          <ChevronRight size={18} color="#6b8f72" />
        </button>
      </div>

      {/* SCROLLABLE */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* STATS */}
        <div className="flex gap-2 px-4 pt-4">
          {[
            { val: stats.total,    label: t.total,    color: '#1a7f3c', icon: <BarChart2 size={16} />   },
            { val: stats.resolved, label: t.resolved, color: '#b87000', icon: <CheckCircle size={16} /> },
            { val: stats.pending,  label: t.pending,  color: '#c0392b', icon: <Clock size={16} />       }
          ].map((s, i) => (
            <div key={i} className="flex-1 rounded-2xl p-3 text-center border"
              style={{ background: 'white', borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
              <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs mt-0.5 font-medium" style={{ color: '#6b8f72' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* PANCHAI BOX */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl p-4 border"
            style={{ background: 'linear-gradient(135deg,#f0fff5,#e8f8f0)', borderColor: '#b8e8c8' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#1a7f3c' }}>
                <Bot size={18} color="white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: '#1a7f3c' }}>PanchAI</div>
                <div className="text-xs" style={{ color: '#6b8f72' }}>
                  {paid
                    ? 'Unlimited · Your village assistant'
                    : `${Math.max(0, 20 - (profile?.ai_minutes_used || 0))} min left this month`}
                </div>
              </div>
              {!paid && (
                <span className="text-xs px-2 py-1 rounded-full font-bold"
                  style={{ background: '#fff3cd', color: '#b87000' }}>
                  20 min/mo
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input placeholder={t.ask} onFocus={() => setScreen('panchai')}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none border"
                style={{ background: 'white', borderColor: '#ddeae0', color: '#192b1d' }} />
              <button onClick={() => setScreen('panchai')}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#1a7f3c' }}>
                <Send size={16} color="white" />
              </button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['💧 Water','📋 Schemes','📊 Track'].map(chip => (
                <button key={chip} onClick={() => setScreen('panchai')}
                  className="text-xs px-3 py-1.5 rounded-full border"
                  style={{ background: 'white', borderColor: '#ddeae0', color: '#3d5e44' }}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* QUICK GRID */}
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#6b8f72' }}>{t.quick}</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Zap size={22} color="#1a7f3c" />,
                label: t.submit,
                sub: paid ? t.submitSub : `${Math.max(0, 3 - (profile?.complaints_this_month || 0))}/3 free left`,
                primary: true, action: 'complaint'
              },
              { icon: <Bell size={22} color="#6b8f72" />,      label: t.notices,   sub: t.noticesSub,                                    primary: false, action: 'notices'   },
              { icon: <BarChart2 size={22} color="#6b8f72" />, label: t.track,     sub: t.trackSub,                                      primary: false, action: 'track'     },
              { icon: <Users size={22} color="#6b8f72" />,     label: t.community, sub: paid ? t.communitySub : 'Read only · Upgrade to post', primary: false, action: 'community' }
            ].map((card, i) => (
              <button key={i} onClick={() => setScreen(card.action)}
                className="text-left rounded-2xl p-4 border transition-all active:scale-95 hover:shadow-md"
                style={{
                  background:  card.primary ? 'linear-gradient(135deg,#e6f5eb,#f0faf2)' : 'white',
                  borderColor: card.primary ? '#1a7f3c' : '#ddeae0',
                  boxShadow:   '0 1px 6px rgba(26,127,60,0.07)'
                }}>
                <div className="mb-2">{card.icon}</div>
                <div className="font-bold text-sm" style={{ color: '#192b1d' }}>{card.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6b8f72' }}>{card.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* LATEST NOTICE */}
        {notices.length > 0 && (
          <div className="px-4 pt-4">
            <button onClick={() => setScreen('notices')}
              className="w-full text-left rounded-2xl p-4 border"
              style={{ background: '#fffbec', borderColor: '#f0d080' }}>
              <div className="flex items-center gap-2 mb-2">
                <Bell size={14} color="#b87000" />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#b87000' }}>
                  Latest Notice
                </span>
              </div>
              <div className="font-bold text-sm" style={{ color: '#192b1d' }}>{notices[0].title}</div>
              <div className="text-xs mt-1 line-clamp-2" style={{ color: '#5a4200' }}>{notices[0].body}</div>
            </button>
          </div>
        )}

        <div className="h-6" />
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 flex items-end pb-5 pt-2 border-t"
        style={{ background: 'white', borderColor: '#ddeae0', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
        {[
          { icon: HomeIcon, label: t.home,    key: 'home'    },
          { icon: Bell,     label: t.notices, key: 'notices' },
        ].map(({ icon: Icon, label, key }) => (
          <button key={key} onClick={() => setScreen(key)}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ color: screen === key ? '#1a7f3c' : '#6b8f72', fontSize: '10px', fontWeight: 500 }}>
            <Icon size={22} />{label}
          </button>
        ))}
        <div className="flex-1 flex flex-col items-center">
          <button onClick={() => setScreen('complaint')}
            className="w-14 h-14 rounded-full flex items-center justify-center -mt-7 transition-all active:scale-95"
            style={{ background: '#1a7f3c', boxShadow: '0 4px 16px rgba(26,127,60,0.35)' }}>
            <Plus size={26} color="white" />
          </button>
        </div>
        {[
          { icon: BarChart2, label: t.track,   key: 'track'   },
          { icon: User,      label: t.profile, key: 'profile' },
        ].map(({ icon: Icon, label, key }) => (
          <button key={key} onClick={() => setScreen(key)}
            className="flex-1 flex flex-col items-center gap-1"
            style={{ color: screen === key ? '#1a7f3c' : '#6b8f72', fontSize: '10px', fontWeight: 500 }}>
            <Icon size={22} />{label}
          </button>
        ))}
      </div>

      {/* EMERGENCY MODAL */}
      {showEmergency && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full rounded-t-3xl p-6" style={{ background: '#1a0505' }}>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🆘</div>
              <div className="text-2xl font-extrabold text-white mb-1">Emergency Alert</div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Alert will be saved and sent to Panchayat
              </div>
            </div>

            {emergencySent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-xl font-bold text-white">Alert Sent!</div>
                <div className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Help is on the way. Stay calm.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  { emoji: '🏥', label: 'Medical Emergency', sub: 'Ambulance · Doctor · First Aid' },
                  { emoji: '🔥', label: 'Fire Emergency',     sub: 'Fire Brigade Alert'             },
                  { emoji: '🌊', label: 'Flood / Disaster',   sub: 'Disaster Response Team'         },
                  { emoji: '🚨', label: 'Crime / Safety',     sub: 'Police Alert'                   },
                ].map(item => (
                  <button key={item.label}
                    onClick={() => handleEmergency(item.label)}
                    disabled={emergencySending}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
                    <span className="text-3xl">{item.emoji}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{item.label}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.sub}</div>
                    </div>
                    {emergencySending && (
                      <div className="ml-auto w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                ))}
                <button onClick={() => setShowEmergency(false)}
                  className="text-center text-sm mt-2 py-3"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}