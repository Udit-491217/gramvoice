import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Bell, AlertTriangle, Droplets, Zap, Leaf, Info } from 'lucide-react'

const CATEGORY_CONFIG = {
  important:  { label: 'Important',   icon: AlertTriangle, color: '#c0392b', bg: '#fff2f0', border: '#ffcccc' },
  water:      { label: 'Water',       icon: Droplets,      color: '#1a6fa8', bg: '#f0f8ff', border: '#b8d8f0' },
  electricity:{ label: 'Electricity', icon: Zap,           color: '#b87000', bg: '#fffbec', border: '#f0d080' },
  scheme:     { label: 'Scheme',      icon: Leaf,          color: '#1a7f3c', bg: '#f0fff5', border: '#b8e8c8' },
  general:    { label: 'General',     icon: Info,          color: '#6b8f72', bg: '#f6fbf7', border: '#ddeae0' },
}

const T = {
  en: {
    title: 'Notices',
    empty: 'No notices yet',
    emptySub: 'Check back later for updates from your Panchayat',
    latest: 'Latest',
    older: 'Older Notices',
    loading: 'Loading notices...',
    error: 'Could not load notices. Please try again.',
  },
  hi: {
    title: 'सूचनाएं',
    empty: 'अभी कोई सूचना नहीं',
    emptySub: 'पंचायत की अपडेट के लिए बाद में देखें',
    latest: 'नवीनतम',
    older: 'पुरानी सूचनाएं',
    loading: 'सूचनाएं लोड हो रही हैं...',
    error: 'सूचनाएं नहीं मिलीं। दोबारा कोशिश करें।',
  }
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function NoticeCard({ notice, isLatest }) {
  const [expanded, setExpanded] = useState(isLatest)
  const cfg = CATEGORY_CONFIG[notice.category] || CATEGORY_CONFIG.general
  const Icon = cfg.icon

  return (
    <button
      onClick={() => setExpanded(e => !e)}
      className="w-full text-left rounded-2xl p-4 border transition-all active:scale-95"
      style={{
        background: cfg.bg,
        borderColor: expanded ? cfg.color : cfg.border,
        boxShadow: '0 1px 6px rgba(26,127,60,0.07)'
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.color }}>
            <Icon size={14} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              {isLatest && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.color, color: 'white' }}>NEW</span>
              )}
            </div>
            <div className="font-bold text-sm mt-0.5 leading-tight" style={{ color: '#192b1d' }}>
              {notice.title}
            </div>
          </div>
        </div>
        <span className="text-xs flex-shrink-0 mt-1" style={{ color: '#6b8f72' }}>
          {timeAgo(notice.created_at)}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t text-sm leading-relaxed"
          style={{ borderColor: cfg.border, color: '#3d5e44' }}>
          {notice.body}
        </div>
      )}
    </button>
  )
}

export default function Notices({ profile, village, onBack, lang = 'en' }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const t = T[lang] || T.en

  useEffect(() => { fetchNotices() }, [profile?.village_id])

  const fetchNotices = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('village_id', profile?.village_id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotices(data || [])
    } catch {
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  const latest = notices[0]
  const older  = notices.slice(1)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* HEADER */}
      <div className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(145deg, #1a7f3c, #2db856)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div className="flex-1">
            <div className="text-xl font-extrabold text-white">{t.title}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {village?.name || 'Your Village'} · {notices.length} notices
            </div>
          </div>
          <Bell size={20} color="rgba(255,255,255,0.6)" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-10">
        <div className="w-full max-w-sm mx-auto px-4 pt-4 flex flex-col gap-3">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#1a7f3c', borderTopColor: 'transparent' }} />
              <div className="text-sm" style={{ color: '#6b8f72' }}>{t.loading}</div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl p-4 text-center border mt-4"
              style={{ background: '#fff2f0', borderColor: '#ffcccc', color: '#c0392b' }}>
              {error}
              <button onClick={fetchNotices} className="block mx-auto mt-2 text-xs underline">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && notices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: '#e6f5eb' }}>
                <Bell size={28} color="#1a7f3c" />
              </div>
              <div className="font-bold text-base" style={{ color: '#192b1d' }}>{t.empty}</div>
              <div className="text-sm text-center" style={{ color: '#6b8f72' }}>{t.emptySub}</div>
            </div>
          )}

          {!loading && !error && notices.length > 0 && (
            <>
              {latest && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: '#6b8f72' }}>{t.latest}</div>
                  <NoticeCard notice={latest} isLatest={true} />
                </div>
              )}
              {older.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: '#6b8f72' }}>{t.older}</div>
                  <div className="flex flex-col gap-3">
                    {older.map(n => (
                      <NoticeCard key={n.id} notice={n} isLatest={false} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}