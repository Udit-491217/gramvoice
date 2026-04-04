import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { isPaid } from './Home'
import {
  ArrowLeft, ThumbsUp, MessageCircle, Trophy,
  Send, Plus, X, ChevronDown, ChevronUp,
  MoreVertical, Trash2, Flag, EyeOff, Lock, Upload
} from 'lucide-react'

const UPI_ID   = 'notjustudit@fam'
const UPI_NAME = 'GramVoice'

const PLANS = [
  {
    id: 'monthly', name: '⚡ Gram Voice', price: '₹49', period: '/month',
    upiAmount: 49, color: '#1a7f3c',
    bg: 'linear-gradient(135deg,#e8f5ec,#f2fbf5)', border: '#1a7f3c', popular: true,
    features: ['Unlimited complaints', 'Voice complaints', 'Unlimited PanchAI', 'Post in community', 'Priority tracking']
  },
  {
    id: 'yearly', name: '🏆 Gram Voice Pro', price: '₹499', period: '/year',
    upiAmount: 499, color: '#b87000',
    bg: 'linear-gradient(135deg,#fff8e6,#fffdf5)', border: '#f0d080', popular: false,
    features: ['Everything in monthly', 'Save ₹89 vs monthly', 'Gram Leader badge']
  }
]

function openUPIApp(amount, note) {
  const url = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
  window.location.href = url
}

// Check if user is still in free trial
function isInTrial(profile) {
  if (!profile?.joined_at) return false
  const diff = (Date.now() - new Date(profile.joined_at).getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 30
}

export default function Community({ profile, village, paid, onBack }) {
  const [posts, setPosts]               = useState([])
  const [likes, setLikes]               = useState({})
  const [comments, setComments]         = useState({})
  const [openComments, setOpenComments] = useState({})
  const [newComment, setNewComment]     = useState({})
  const [loading, setLoading]           = useState(true)
  const [showPost, setShowPost]         = useState(false)
  const [newText, setNewText]           = useState('')
  const [posting, setPosting]           = useState(false)
  const [myPostCount, setMyPostCount]   = useState(0)
  const [filter, setFilter]             = useState('all')
  const [openMenu, setOpenMenu]         = useState(null)
  const [hiddenPosts, setHiddenPosts]   = useState({})
  const [showReport, setShowReport]     = useState(null)
  const [showUpgrade, setShowUpgrade]   = useState(false)

  // Payment flow inside upgrade modal
  const [payStep, setPayStep]           = useState('choose') // choose | upi | screenshot | done
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [uploading, setUploading]       = useState(false)
  const screenshotRef                   = useRef()
  const menuRef                         = useRef(null)

  const trialActive = isInTrial(profile)

  useEffect(() => { fetchPosts() }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles(name, avatar_url)')
      .eq('village_id', profile.village_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    const { data: likesData }        = await supabase.from('likes').select('post_id').eq('user_id', profile.id)
    const { data: likeCountData }    = await supabase.from('likes').select('post_id')
    const { data: commentCountData } = await supabase.from('comments').select('post_id')

    if (postsData) {
      const likeMap    = {}
      const commentMap = {}
      likeCountData?.forEach(l    => { likeMap[l.post_id]    = (likeMap[l.post_id]    || 0) + 1 })
      commentCountData?.forEach(c => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1 })
      const enriched = postsData.map(p => ({
        ...p,
        real_like_count:    likeMap[p.id]    || 0,
        real_comment_count: commentMap[p.id] || 0
      }))
      setPosts(enriched)
      setMyPostCount(enriched.filter(p => p.user_id === profile.id).length)
    }
    if (likesData) {
      const likedMap = {}
      likesData.forEach(l => { likedMap[l.post_id] = true })
      setLikes(likedMap)
    }
    setLoading(false)
  }

  const toggleLike = async (postId) => {
    if (likes[postId]) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', profile.id)
      setLikes(prev => ({ ...prev, [postId]: false }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, real_like_count: Math.max((p.real_like_count || 1) - 1, 0) } : p))
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: profile.id })
      setLikes(prev => ({ ...prev, [postId]: true }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, real_like_count: (p.real_like_count || 0) + 1 } : p))
    }
  }

  const fetchComments = async (postId) => {
    const { data } = await supabase.from('comments').select('*, profiles(name, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true })
    if (data) setComments(prev => ({ ...prev, [postId]: data }))
  }

  const toggleComments = async (postId) => {
    const isOpen = openComments[postId]
    setOpenComments(prev => ({ ...prev, [postId]: !isOpen }))
    if (!isOpen && !comments[postId]) await fetchComments(postId)
  }

  const submitComment = async (postId) => {
    if (!paid) { setShowUpgrade(true); setPayStep('choose'); return }
    const text = newComment[postId]?.trim()
    if (!text) return
    const { data } = await supabase.from('comments').insert({ post_id: postId, user_id: profile.id, text }).select('*, profiles(name, avatar_url)').single()
    if (data) {
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, real_comment_count: (p.real_comment_count || 0) + 1 } : p))
      setNewComment(prev => ({ ...prev, [postId]: '' }))
    }
  }

  const deletePost = async (postId) => {
    await supabase.from('posts').update({ is_deleted: true }).eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
    setMyPostCount(prev => prev - 1)
    setOpenMenu(null)
  }

  const hidePost   = (postId) => { setHiddenPosts(prev => ({ ...prev, [postId]: true })); setOpenMenu(null) }

  const reportPost = async (postId, reason) => {
    await supabase.from('reports').insert({ post_id: postId, user_id: profile.id, reason })
    hidePost(postId); setShowReport(null); setOpenMenu(null)
  }

  const submitPost = async () => {
    if (!paid) { setShowUpgrade(true); setPayStep('choose'); return }
    if (!newText.trim()) return
    setPosting(true)
    const { data } = await supabase.from('posts')
      .insert({ user_id: profile.id, village_id: profile.village_id, text: newText.trim(), like_count: 0, comment_count: 0, is_deleted: false })
      .select('*, profiles(name, avatar_url)').single()
    if (data) {
      setPosts(prev => [{ ...data, real_like_count: 0, real_comment_count: 0 }, ...prev])
      setMyPostCount(prev => prev + 1)
    }
    setNewText(''); setShowPost(false); setPosting(false)
  }

  // ── UPI flow ─────────────────────────────────────────────
  const handleActivateFree = async () => {
    // Just close modal — they're in trial, paid=true, everything unlocked
    setShowUpgrade(false)
  }

  const handlePayNow = (plan) => { setSelectedPlan(plan); setPayStep('upi') }

  const handleOpenUPI = () => {
    const note = `GramVoice ${selectedPlan?.name} - ${profile?.phone}`
    openUPIApp(selectedPlan?.upiAmount, note)
    setTimeout(() => setPayStep('screenshot'), 2000)
  }

  const handleScreenshot = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const filePath = `${profile.id}-${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('payment-proofs').upload(filePath, file, { upsert: true })
    if (upErr) { alert('Upload failed. Try again.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(filePath)
    await supabase.from('payment_requests').insert({
      user_id: profile.id, village_id: profile.village_id,
      plan: selectedPlan?.id, amount: selectedPlan?.upiAmount,
      screenshot_url: urlData.publicUrl, status: 'pending'
    })
    setUploading(false)
    setPayStep('done')
  }

  const closeUpgrade = () => { setShowUpgrade(false); setPayStep('choose'); setSelectedPlan(null) }

  const timeAgo = (dateStr) => {
    const now  = new Date()
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const filteredPosts  = posts.filter(p => !hiddenPosts[p.id] && (filter === 'mine' ? p.user_id === profile.id : true))
  const gramScore      = Math.min(posts.length * 5 + 40, 100)
  const reportReasons  = ['Spam or misleading','Offensive content','Fake information','Inappropriate','Other']

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* HEADER */}
      <div className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(145deg,#1a7f3c,#2db856)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ArrowLeft size={18} color="white" />
            </button>
            <div>
              <div className="text-xl font-extrabold text-white">Community</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {village?.name} · Village Feed
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {[{ val: posts.length, label: 'Total' }, { val: myPostCount, label: 'Mine' }].map((s, i) => (
                <div key={i} className="flex flex-col items-center px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="text-sm font-extrabold text-white">{s.val}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {paid
              ? <button onClick={() => setShowPost(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>
                  <Plus size={14} /> Post
                </button>
              : <button onClick={() => { setShowUpgrade(true); setPayStep('choose') }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  <Lock size={12} /> {trialActive ? 'Free' : 'Paid'}
                </button>
            }
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {[{ key: 'all', label: '🌐 All Posts' }, { key: 'mine', label: '👤 My Posts' }].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: filter === tab.key ? 'white' : 'rgba(255,255,255,0.15)',
                color:      filter === tab.key ? '#1a7f3c' : 'rgba(255,255,255,0.8)'
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* READ-ONLY BANNER */}
      {!paid && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-2xl flex items-center justify-between"
          style={{ background: trialActive ? '#e8f5ec' : '#fff8e6', border: `1px solid ${trialActive ? '#b8e8c8' : '#f0d080'}` }}>
          <div>
            <div className="text-xs font-bold" style={{ color: trialActive ? '#1a7f3c' : '#b87000' }}>
              {trialActive ? '🎉 Free trial active' : '👀 Read-only mode'}
            </div>
            <div className="text-xs" style={{ color: trialActive ? '#3d5e44' : '#c4843a' }}>
              {trialActive ? 'Activate to post & comment — ₹0/month' : 'Upgrade to post & comment'}
            </div>
          </div>
          <button onClick={() => { setShowUpgrade(true); setPayStep('choose') }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: trialActive ? '#1a7f3c' : '#b87000' }}>
            {trialActive ? 'Activate Free' : 'Upgrade'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-4">

        {/* GRAM SCORE */}
        <div className="rounded-2xl p-4 border"
          style={{ background: 'linear-gradient(135deg,#e6f5eb,#f0faf2)', borderColor: '#b8e8c8' }}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={18} color="#1a7f3c" />
            <div className="font-extrabold" style={{ color: '#1a7f3c' }}>Gram Score: {gramScore}/100</div>
          </div>
          <div className="text-xs mb-3" style={{ color: '#3d5e44' }}>Keep posting and raising issues to improve your village score!</div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#c8e6d0' }}>
            <div className="h-full rounded-full" style={{ width: `${gramScore}%`, background: '#1a7f3c' }} />
          </div>
        </div>

        {loading && <div className="text-center py-12" style={{ color: '#6b8f72' }}>Loading posts...</div>}

        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <MessageCircle size={48} color="#b8d4bc" />
            <div className="font-bold" style={{ color: '#6b8f72' }}>
              {filter === 'mine' ? 'No posts by you yet' : 'No posts yet'}
            </div>
            <div className="text-sm" style={{ color: '#9dc9a8' }}>
              {filter === 'mine' ? (paid ? 'Create your first post!' : 'Upgrade to post!') : 'Be the first to post!'}
            </div>
            {paid && (
              <button onClick={() => setShowPost(true)}
                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm mt-2"
                style={{ background: '#1a7f3c' }}>
                Create Post
              </button>
            )}
          </div>
        )}

        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: '#ddeae0', boxShadow: '0 1px 6px rgba(26,127,60,0.07)' }}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: '#e6f5eb' }}>
                  {post.profiles?.avatar_url
                    ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-lg font-bold" style={{ color: '#1a7f3c' }}>
                        {(post.profiles?.name || 'U')[0].toUpperCase()}
                      </span>
                  }
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: '#192b1d' }}>{post.profiles?.name || 'Village Member'}</div>
                  <div className="text-xs" style={{ color: '#6b8f72' }}>{timeAgo(post.created_at)}</div>
                </div>
                <div className="relative" ref={openMenu === post.id ? menuRef : null}>
                  <button onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: openMenu === post.id ? '#e6f5eb' : 'transparent' }}>
                    <MoreVertical size={16} color="#6b8f72" />
                  </button>
                  {openMenu === post.id && (
                    <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl border shadow-lg overflow-hidden"
                      style={{ borderColor: '#ddeae0', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      {post.user_id === profile.id
                        ? <button onClick={() => deletePost(post.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium"
                            style={{ color: '#c0392b' }}>
                            <Trash2 size={15} /> Delete Post
                          </button>
                        : <>
                            <button onClick={() => hidePost(post.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium"
                              style={{ color: '#6b8f72' }}>
                              <EyeOff size={15} /> Hide Post
                            </button>
                            <div style={{ height: '1px', background: '#f0f5f1' }} />
                            <button onClick={() => { setShowReport(post.id); setOpenMenu(null) }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium"
                              style={{ color: '#c0392b' }}>
                              <Flag size={15} /> Report Post
                            </button>
                          </>
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm mb-3" style={{ color: '#3d5e44', lineHeight: '1.6' }}>{post.text}</div>

              <div className="flex gap-4 pt-3 border-t" style={{ borderColor: '#f0f5f1' }}>
                <button onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold active:scale-95"
                  style={{ color: likes[post.id] ? '#1a7f3c' : '#6b8f72' }}>
                  <ThumbsUp size={15} fill={likes[post.id] ? '#1a7f3c' : 'none'} color={likes[post.id] ? '#1a7f3c' : '#6b8f72'} />
                  {post.real_like_count || 0} Likes
                </button>
                <button onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: openComments[post.id] ? '#1a7f3c' : '#6b8f72' }}>
                  <MessageCircle size={15} />
                  {post.real_comment_count || 0} Comments
                  {openComments[post.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>

            {openComments[post.id] && (
              <div style={{ background: '#f8fdf9', borderTop: '1px solid #e8f5ec' }}>
                <div className="px-4 pt-3 flex flex-col gap-3 max-h-64 overflow-y-auto">
                  {!comments[post.id] && <div className="text-xs text-center py-2" style={{ color: '#9dc9a8' }}>Loading...</div>}
                  {comments[post.id]?.length === 0 && (
                    <div className="text-xs text-center py-2" style={{ color: '#9dc9a8' }}>
                      No comments yet. {paid ? 'Be the first!' : 'Upgrade to comment!'}
                    </div>
                  )}
                  {comments[post.id]?.map(comment => (
                    <div key={comment.id} className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: '#e6f5eb' }}>
                        {comment.profiles?.avatar_url
                          ? <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xs font-bold" style={{ color: '#1a7f3c' }}>{(comment.profiles?.name || 'U')[0].toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 rounded-xl px-3 py-2"
                        style={{ background: 'white', border: '1px solid #e8f5ec' }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold" style={{ color: '#192b1d' }}>{comment.profiles?.name || 'Member'}</span>
                          <span className="text-xs" style={{ color: '#9dc9a8' }}>{timeAgo(comment.created_at)}</span>
                        </div>
                        <div className="text-xs" style={{ color: '#3d5e44', lineHeight: '1.5' }}>{comment.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 p-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: '#e6f5eb' }}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold" style={{ color: '#1a7f3c' }}>{(profile?.name || 'U')[0].toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 flex gap-2">
                    {paid ? (
                      <>
                        <input value={newComment[post.id] || ''}
                          onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                          placeholder="Write a comment..."
                          className="flex-1 rounded-xl px-3 py-2 text-xs outline-none border"
                          style={{ borderColor: '#ddeae0', color: '#192b1d', background: 'white' }} />
                        <button onClick={() => submitComment(post.id)} disabled={!newComment[post.id]?.trim()}
                          className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40"
                          style={{ background: '#1a7f3c' }}>
                          <Send size={13} color="white" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => { setShowUpgrade(true); setPayStep('choose') }}
                        className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-left"
                        style={{ background: trialActive ? '#e8f5ec' : '#fff8e6', color: trialActive ? '#1a7f3c' : '#b87000', border: `1px solid ${trialActive ? '#b8e8c8' : '#f0d080'}` }}>
                        {trialActive ? '🎉 Activate free to comment' : '🔒 Upgrade to comment'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* NEW POST MODAL */}
      {showPost && paid && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowPost(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-extrabold text-lg" style={{ color: '#192b1d' }}>New Post</div>
              <button onClick={() => setShowPost(false)}><X size={20} color="#6b8f72" /></button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: '#e6f5eb' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="font-bold" style={{ color: '#1a7f3c' }}>{(profile?.name || 'U')[0].toUpperCase()}</span>
                }
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: '#192b1d' }}>{profile?.name}</div>
                <div className="text-xs" style={{ color: '#6b8f72' }}>{village?.name}</div>
              </div>
            </div>
            <textarea value={newText} onChange={e => setNewText(e.target.value)}
              placeholder="Share something with your village..."
              rows={4} autoFocus
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none border-2 resize-none mb-4"
              style={{ borderColor: '#ddeae0', color: '#192b1d' }} />
            <button onClick={submitPost} disabled={posting || !newText.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
              <Send size={16} />
              {posting ? 'Posting...' : 'Post to Village'}
            </button>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReport && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowReport(null)}>
          <div className="w-full bg-white rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-extrabold text-lg" style={{ color: '#192b1d' }}>Report Post</div>
              <button onClick={() => setShowReport(null)}><X size={20} color="#6b8f72" /></button>
            </div>
            <div className="text-sm mb-4" style={{ color: '#6b8f72' }}>Why are you reporting this post?</div>
            <div className="flex flex-col gap-2">
              {reportReasons.map(reason => (
                <button key={reason} onClick={() => reportPost(showReport, reason)}
                  className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium"
                  style={{ borderColor: '#ddeae0', color: '#192b1d' }}>
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgrade && (
        <div className="fixed inset-0 flex items-end z-50"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={closeUpgrade}>
          <div className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* CHOOSE — trial active: show free activate */}
            {payStep === 'choose' && trialActive && (
              <div className="text-center">
                <div className="text-4xl mb-3">🎉</div>
                <div className="text-2xl font-extrabold mb-2" style={{ color: '#192b1d' }}>
                  First Month Free!
                </div>
                <div className="text-sm mb-6" style={{ color: '#6b8f72' }}>
                  You're in your free trial period. All paid features are unlocked at
                </div>
                <div className="text-5xl font-extrabold mb-1" style={{ color: '#1a7f3c' }}>₹0</div>
                <div className="text-sm mb-6" style={{ color: '#6b8f72' }}>/month for now</div>

                <div className="rounded-2xl p-4 mb-5 text-left"
                  style={{ background: '#e8f5ec', border: '1.5px solid #b8e8c8' }}>
                  {['Unlimited complaints', 'Post & comment in community', 'Unlimited PanchAI', 'Voice complaints', 'Priority tracking'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm mb-2" style={{ color: '#1a7f3c' }}>
                      <span className="font-bold">✓</span> {f}
                    </div>
                  ))}
                </div>

                <button onClick={handleActivateFree}
                  className="w-full py-4 rounded-2xl font-extrabold text-white text-base mb-3"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  Activate Free Access →
                </button>
                <div className="text-xs" style={{ color: '#9dc9a8' }}>
                  After 30 days, ₹49/month to continue
                </div>
              </div>
            )}

            {/* CHOOSE — trial expired: show paid plans */}
            {payStep === 'choose' && !trialActive && (
              <>
                <div className="text-2xl font-extrabold text-center mb-1" style={{ color: '#192b1d' }}>
                  🔊 Unlock Your Voice
                </div>
                <div className="text-sm text-center mb-5" style={{ color: '#6b8f72' }}>
                  Your free trial has ended. Upgrade to continue.
                </div>
                {PLANS.map(plan => (
                  <div key={plan.id} className="rounded-2xl p-4 border-2 mb-3 relative"
                    style={{ borderColor: plan.border, background: plan.bg }}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: plan.color }}>⭐ MOST POPULAR</div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-extrabold" style={{ color: '#192b1d' }}>{plan.name}</div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold" style={{ color: plan.color }}>{plan.price}</div>
                        <div className="text-xs" style={{ color: '#6b8f72' }}>{plan.period}</div>
                      </div>
                    </div>
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs mb-1" style={{ color: '#3d5e44' }}>
                        <span style={{ color: plan.color }}>✓</span> {f}
                      </div>
                    ))}
                    <button onClick={() => handlePayNow(plan)}
                      className="w-full mt-3 py-3 rounded-xl font-bold text-white text-sm"
                      style={{ background: `linear-gradient(135deg,${plan.color},${plan.color}cc)` }}>
                      Pay {plan.price} via UPI →
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* UPI */}
            {payStep === 'upi' && (
              <div className="text-center">
                <button onClick={() => setPayStep('choose')}
                  className="flex items-center gap-1 text-xs mb-4 font-semibold"
                  style={{ color: '#6b8f72' }}>← Back</button>
                <div className="text-4xl mb-3">💳</div>
                <div className="text-xl font-extrabold mb-1" style={{ color: '#192b1d' }}>Pay {selectedPlan?.price}</div>
                <div className="text-sm mb-5" style={{ color: '#6b8f72' }}>{selectedPlan?.name}</div>
                <div className="rounded-2xl p-4 mb-5 text-left"
                  style={{ background: '#f0f5f1', border: '1.5px solid #ddeae0' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#6b8f72' }}>Pay to UPI ID</div>
                  <div className="font-extrabold text-lg" style={{ color: '#192b1d' }}>{UPI_ID}</div>
                  <div className="text-xs mt-1" style={{ color: '#6b8f72' }}>
                    Amount: <strong style={{ color: '#1a7f3c' }}>{selectedPlan?.price}</strong>
                  </div>
                </div>
                <button onClick={handleOpenUPI}
                  className="w-full py-4 rounded-2xl font-bold text-white mb-3"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  📱 Open UPI App to Pay →
                </button>
                <button onClick={() => setPayStep('screenshot')}
                  className="w-full py-3 rounded-2xl font-semibold text-sm border-2"
                  style={{ borderColor: '#ddeae0', color: '#6b8f72' }}>
                  Already paid? Upload screenshot →
                </button>
              </div>
            )}

            {/* SCREENSHOT */}
            {payStep === 'screenshot' && (
              <div className="text-center">
                <div className="text-4xl mb-3">📸</div>
                <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>Upload Screenshot</div>
                <div className="text-sm mb-6" style={{ color: '#6b8f72' }}>
                  Upload payment confirmation. We'll activate within 24 hours.
                </div>
                <input ref={screenshotRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                <button onClick={() => screenshotRef.current.click()} disabled={uploading}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload Screenshot'}
                </button>
              </div>
            )}

            {/* DONE */}
            {payStep === 'done' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <div className="text-xl font-extrabold mb-2" style={{ color: '#192b1d' }}>Screenshot Submitted!</div>
                <div className="text-sm mb-6" style={{ color: '#6b8f72' }}>
                  Plan will be activated within 24 hours after verification.
                </div>
                <button onClick={closeUpgrade}
                  className="w-full py-4 rounded-2xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#1a7f3c,#2db856)' }}>
                  Got it! ✓
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}