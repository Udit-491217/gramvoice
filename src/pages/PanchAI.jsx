import { useState, useEffect, useRef } from 'react'
import { groq } from '../lib/groq'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Send, Bot, User, Brain, Lock } from 'lucide-react'

const QUICK_CHIPS = {
  en: ['💧 Water issue', '📋 Govt schemes', '📊 Track complaint', '🛣️ Road repair', '⚡ Electricity'],
  hi: ['💧 पानी की समस्या', '📋 सरकारी योजनाएं', '📊 शिकायत ट्रैक', '🛣️ सड़क मरम्मत', '⚡ बिजली'],
}

const FREE_AI_MINUTES = 20

function buildSystemPrompt(profile, village, lang, memories) {
  const memoryText = memories.length > 0
    ? `\n\nWhat you already know about this user:\n${memories.map(m => `- ${m.memory}`).join('\n')}`
    : ''
  return `You are PanchAI, a helpful AI assistant for ${village?.name || 'a village'} Gram Panchayat in ${village?.state || 'Assam'}, India.
Your job: help with government schemes, complaints, panchayat rules, water/electricity/roads issues.
Member: ${profile?.name}, Village: ${village?.name}, ${village?.district}, ${village?.state}
${memoryText}
Rules: SHORT simple responses. ${lang === 'hi' ? 'Reply in Hindi.' : 'Reply in English.'} Be warm. Never make up scheme details. End with a helpful next step.`
}

function buildMemoryPrompt(conversation) {
  return `Extract important facts about the user from this conversation. Return ONLY a JSON array of max 5 strings.
Example: ["Lives in Ward 3", "Has water issue"]
Conversation:\n${conversation.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n')}`
}

export default function PanchAI({ profile, village, paid, onBack, lang = 'en' }) {
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [memories, setMemories]     = useState([])
  const [saving, setSaving]         = useState(false)
  const [minutesUsed, setMinutesUsed] = useState(profile?.ai_minutes_used || 0)
  const [showLimit, setShowLimit]   = useState(false)
  const sessionStart                = useRef(Date.now())
  const bottomRef                   = useRef(null)
  const inputRef                    = useRef(null)

  const minutesLeft = Math.max(0, FREE_AI_MINUTES - minutesUsed)
  const limitReached = !paid && minutesUsed >= FREE_AI_MINUTES

  useEffect(() => {
    loadMemories()
    const welcome = lang === 'hi'
      ? `नमस्ते ${profile?.name || ''}! 🙏 मैं PanchAI हूं। ${!paid ? `आपके पास ${minutesLeft} मिनट बाकी हैं।` : ''} कुछ भी पूछें!`
      : `Namaste ${profile?.name || ''}! 🙏 I'm PanchAI. ${!paid ? `You have ${minutesLeft} min left this month.` : 'Unlimited access!'} How can I help?`
    setMessages([{ role: 'assistant', content: welcome }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Track minutes used on unmount
  useEffect(() => {
    return () => {
      if (!paid) {
        const minsUsed = Math.ceil((Date.now() - sessionStart.current) / 60000)
        if (minsUsed > 0) {
          const newTotal = minutesUsed + minsUsed
          supabase.from('profiles')
            .update({ ai_minutes_used: newTotal })
            .eq('id', profile.id)
        }
      }
    }
  }, [])

  const loadMemories = async () => {
    const { data } = await supabase
      .from('memories').select('*')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false }).limit(10)
    if (data) setMemories(data)
  }

  const extractAndSaveMemories = async (conversation) => {
    if (conversation.length < 3) return
    setSaving(true)
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: buildMemoryPrompt(conversation) }],
        max_tokens: 200, temperature: 0.3,
      })
      const raw  = response.choices[0]?.message?.content || '[]'
      const clean = raw.replace(/```json|```/g, '').trim()
      const newMemories = JSON.parse(clean)
      if (Array.isArray(newMemories) && newMemories.length > 0) {
        await supabase.from('memories').delete().eq('user_id', profile.id)
        const inserts = newMemories.map(memory => ({ user_id: profile.id, memory, updated_at: new Date().toISOString() }))
        await supabase.from('memories').insert(inserts)
        setMemories(inserts)
      }
    } catch (err) { console.log('Memory silent fail:', err) }
    finally { setSaving(false) }
  }

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return

    // Check free limit
    if (!paid && minutesUsed >= FREE_AI_MINUTES) {
      setShowLimit(true)
      return
    }

    setInput('')
    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: buildSystemPrompt(profile, village, lang, memories) },
          ...newMessages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 300, temperature: 0.7,
      })

      const reply = response.choices[0]?.message?.content ||
        (lang === 'hi' ? 'माफ़ करें, दोबारा कोशिश करें।' : 'Sorry, please try again.')

      const updatedMessages = [...newMessages, { role: 'assistant', content: reply }]
      setMessages(updatedMessages)

      const aiCount = updatedMessages.filter(m => m.role === 'assistant').length
      if (aiCount % 2 === 0) extractAndSaveMemories(updatedMessages)

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'hi' ? 'माफ़ करें, कुछ गड़बड़ हुई।' : 'Sorry, something went wrong.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f5f1', fontFamily: 'Outfit, sans-serif' }}>

      {/* Header */}
      <div className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(145deg,#1a7f3c,#2db856)' }}>
        <div className="flex items-center gap-3">
          <button onClick={async () => {
            if (messages.length > 2) await extractAndSaveMemories(messages)
            onBack()
          }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ArrowLeft size={18} color="white" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Bot size={22} color="white" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-extrabold text-white">PanchAI</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7effaa' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {paid ? (lang === 'hi' ? 'अनलिमिटेड' : 'Unlimited access') : `${minutesLeft} min left`}
              </span>
            </div>
          </div>
          {memories.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Brain size={13} color="white" />
              <span className="text-xs font-semibold text-white">{memories.length}</span>
            </div>
          )}
          {saving && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ffd700' }} />}
        </div>
      </div>

      {/* Free usage bar */}
      {!paid && (
        <div className="px-4 py-2" style={{ background: '#fff8e6', borderBottom: '1px solid #f0d080' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold" style={{ color: '#b87000' }}>
              AI Usage this month
            </span>
            <span className="text-xs font-bold" style={{ color: '#b87000' }}>
              {minutesUsed}/{FREE_AI_MINUTES} min
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#fde8c8' }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((minutesUsed / FREE_AI_MINUTES) * 100, 100)}%`,
                background: minutesLeft <= 5 ? '#c0392b' : '#b87000'
              }} />
          </div>
        </div>
      )}

      {/* Memory pills */}
      {memories.length > 0 && messages.length <= 1 && (
        <div className="px-4 pt-3 pb-1">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b8f72' }}>
            🧠 {lang === 'hi' ? 'मुझे याद है' : 'I remember'}
          </div>
          <div className="flex gap-2 flex-wrap">
            {memories.slice(0, 3).map((m, i) => (
              <div key={i} className="text-xs px-3 py-1.5 rounded-full border"
                style={{ background: '#e6f5eb', borderColor: '#b8e8c8', color: '#1a7f3c' }}>
                {m.memory}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick chips */}
      {messages.length <= 1 && (
        <div className="px-4 pt-3 pb-1">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b8f72' }}>
            {lang === 'hi' ? 'जल्दी पूछें' : 'Quick ask'}
          </div>
          <div className="flex gap-2 flex-wrap">
            {QUICK_CHIPS[lang].map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all active:scale-95"
                style={{ background: 'white', borderColor: '#ddeae0', color: '#3d5e44' }}>
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                style={{ background: '#1a7f3c' }}>
                <Bot size={14} color="white" />
              </div>
            )}
            <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              style={{
                background: msg.role === 'user' ? '#1a7f3c' : 'white',
                color:      msg.role === 'user' ? 'white' : '#192b1d',
                boxShadow:  '0 1px 6px rgba(26,127,60,0.08)',
                border:     msg.role === 'assistant' ? '1px solid #ddeae0' : 'none'
              }}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 mt-1 flex items-center justify-center"
                style={{ background: '#e6f5eb' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User size={14} color="#1a7f3c" />
                }
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#1a7f3c' }}>
              <Bot size={14} color="white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 border"
              style={{ background: 'white', borderColor: '#ddeae0' }}>
              <div className="flex gap-1 items-center h-4">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#6b8f72', animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t" style={{ background: 'white', borderColor: '#ddeae0' }}>
        {limitReached ? (
          <div className="text-center py-2">
            <div className="text-sm font-semibold mb-2" style={{ color: '#c0392b' }}>
              🔒 Monthly AI limit reached
            </div>
            <button className="px-5 py-2 rounded-xl font-bold text-white text-sm"
              style={{ background: '#1a7f3c' }}>
              Upgrade for Unlimited →
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-end max-w-2xl mx-auto">
            <textarea ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={lang === 'hi' ? 'कुछ भी पूछें...' : 'Ask anything...'}
              rows={1}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm border outline-none resize-none leading-relaxed"
              style={{ background: '#f6fbf7', borderColor: input ? '#1a7f3c' : '#ddeae0', color: '#192b1d', maxHeight: '100px' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{
                background: input.trim() && !loading ? '#1a7f3c' : '#ddeae0',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed'
              }}>
              <Send size={16} color={input.trim() && !loading ? 'white' : '#6b8f72'} />
            </button>
          </div>
        )}
      </div>

    </div>
  )
}