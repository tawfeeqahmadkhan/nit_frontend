import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { businessApi, messageApi } from '../api/businessApi'
import { Send, Loader2, MessageSquare, Lock, ArrowRight, CheckCircle, Search, Sparkles, ChevronRight } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useToast } from '../components/Toast'
import { useBusiness } from '../context/BusinessContext'

/* ─── helpers ──────────────────────────────────────────────────────────── */
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(ts) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString())     return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
function scorePct(score) { return Math.round((score ?? 0) * 100) }

/* ─── component ────────────────────────────────────────────────────────── */
export default function Messages() {
  const { matchId: urlMatchId } = useParams()
  const navigate  = useNavigate()
  const toast     = useToast()
  const { current } = useBusiness()

  const myId = current?._id?.toString()

  const [matches,     setMatches]     = useState([])
  const [activeMatch, setActiveMatch] = useState(null)
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [sending,     setSending]     = useState(false)
  const [search,      setSearch]      = useState('')

  const bottomRef   = useRef(null)
  const activeIdRef = useRef(null)
  const myIdRef     = useRef(myId)
  const inputRef    = useRef(null)

  useEffect(() => { myIdRef.current = myId }, [myId])

  const socket = useSocket({
    new_message: (data) => {
      if (data.match_id !== activeIdRef.current) return
      setMessages(prev => {
        if (prev.some(m => m._id?.toString() === data.message._id?.toString())) return prev
        return [...prev, data.message]
      })
    },
  }, myId)

  useEffect(() => {
    activeIdRef.current = activeMatch?._id?.toString() ?? null
  }, [activeMatch?._id])

  useEffect(() => {
    if (!myId) return
    setLoading(true)
    businessApi.getMatches(myId)
      .then(res => {
        const accepted = res.data.filter(m => m.status === 'accepted')
        setMatches(accepted)
        if (urlMatchId) {
          const found = accepted.find(m => m._id?.toString() === urlMatchId)
          if (found) setActiveMatch(found)
        }
      })
      .catch(() => toast('Failed to load conversations', 'error'))
      .finally(() => setLoading(false))
  }, [myId, urlMatchId])

  useEffect(() => {
    if (!activeMatch?._id) return
    const mid = activeMatch._id.toString()

    function joinRoom() { socket?.emit('join_match', mid) }
    joinRoom()
    socket?.on('connect', joinRoom)

    messageApi.thread(mid)
      .then(res => setMessages(res.data))
      .catch(() => toast('Failed to load messages', 'error'))

    return () => {
      socket?.off('connect', joinRoom)
      socket?.emit('leave_match', mid)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMatch?._id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getOther(match) {
    if (!myId) return match.business_b ?? match.business_a
    const aId = match.business_a?._id?.toString() ?? match.business_a?.toString()
    return aId === myId ? match.business_b : match.business_a
  }

  function isMine(msg) {
    const sid = msg.sender?._id?.toString() ?? msg.sender?.toString()
    return sid === myId
  }

  const selectMatch = useCallback((m) => {
    setActiveMatch(m)
    setMessages([])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  async function send() {
    if (!input.trim() || !activeMatch || !myId || sending) return
    setSending(true)
    try {
      const res = await messageApi.send({
        match_id: activeMatch._id,
        sender:   myId,
        content:  input.trim(),
      })
      setMessages(prev => [...prev, res.data])
      setInput('')
      inputRef.current?.focus()
    } catch (err) {
      toast(err.response?.data?.error ?? 'Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  /* ── auth guard ──────────────────────────────────────────────────────── */
  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center">
          <Lock size={24} className="text-accent" />
        </div>
        <p className="text-text-primary font-semibold text-lg">Sign in to view messages</p>
        <p className="text-sm text-text-muted max-w-xs">You need to be signed in as a business to message your matches.</p>
        <button onClick={() => navigate('/login')} className="btn-primary flex items-center gap-2">
          Sign In <ArrowRight size={14} />
        </button>
      </div>
    )
  }

  const filtered = matches.filter(m =>
    (getOther(m)?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  /* ── build grouped message list with date separators ─────────────────── */
  const grouped = []
  messages.forEach((msg, i) => {
    const prev = messages[i - 1]
    const prevDate = prev ? fmtDate(prev.createdAt) : null
    const thisDate = fmtDate(msg.createdAt ?? Date.now())
    if (thisDate !== prevDate) grouped.push({ type: 'separator', label: thisDate })

    const prevSenderId = prev ? (prev.sender?._id?.toString() ?? prev.sender?.toString()) : null
    const thisSenderId = msg.sender?._id?.toString() ?? msg.sender?.toString()
    const isFirst = thisSenderId !== prevSenderId || thisDate !== prevDate
    grouped.push({ type: 'message', msg, isFirst })
  })

  const other = activeMatch ? getOther(activeMatch) : null

  /* ── UI ──────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl border border-border shadow-card bg-surface">

      {/* ══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
      <div className="w-[280px] flex flex-col flex-shrink-0 border-r border-border bg-[#F8F7F4]">

        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-base font-bold text-text-primary mb-3">Messages</h2>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 size={18} className="animate-spin text-text-muted" />
            </div>
          ) : filtered.length === 0 && matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-5 py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-accent-light flex items-center justify-center">
                <MessageSquare size={20} className="text-accent" />
              </div>
              <p className="text-xs font-medium text-text-primary">No conversations yet</p>
              <p className="text-[11px] text-text-muted leading-relaxed">Accept a match on your dashboard to start messaging.</p>
              <button
                onClick={() => navigate('/my-dashboard')}
                className="btn-primary text-xs px-4 py-2 mt-1 flex items-center gap-1.5"
              >
                Go to Dashboard <ChevronRight size={12} />
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">No results for "{search}"</p>
          ) : (
            filtered.map(m => {
              const otherBiz = getOther(m)
              const isActive = activeMatch?._id?.toString() === m._id?.toString()
              const pct = scorePct(m.score)
              return (
                <button
                  key={m._id}
                  onClick={() => selectMatch(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/60 text-left transition-all ${
                    isActive
                      ? 'bg-accent-light border-l-2 border-l-accent'
                      : 'hover:bg-white/70 border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-accent text-white' : 'bg-white border border-border text-accent'
                  }`}>
                    {(otherBiz?.name ?? '?')[0].toUpperCase()}
                  </div>
                  {/* Name + reason */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                      {otherBiz?.name ?? 'Unknown'}
                    </p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {m.reason?.slice(0, 38) ?? 'AI match'}
                    </p>
                  </div>
                  {/* Score pill */}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex-shrink-0 ${
                    pct >= 80 ? 'bg-green-100 text-green-700' :
                    pct >= 60 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {pct}%
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ══ RIGHT: CHAT AREA ═════════════════════════════════════════════ */}
      {activeMatch ? (
        <div className="flex flex-col flex-1 min-w-0 bg-white">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border flex-shrink-0 bg-white">
            <div className="w-10 h-10 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              {(other?.name ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary leading-tight">{other?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle size={10} className="text-green-500 flex-shrink-0" />
                <span className="text-[11px] text-text-muted">Connected</span>
                <span className="text-[11px] text-text-muted">·</span>
                <Sparkles size={10} className="text-accent flex-shrink-0" />
                <span className="text-[11px] text-accent font-medium">{scorePct(activeMatch.score)}% AI match</span>
                {other?.address && (
                  <>
                    <span className="text-[11px] text-text-muted">·</span>
                    <span className="text-[11px] text-text-muted truncate">{other.address.split(',')[0]}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(`/businesses/${other?._id}`)}
              className="text-xs text-text-muted hover:text-accent transition-colors px-2 py-1 rounded-lg hover:bg-accent-light"
            >
              View profile →
            </button>
          </div>

          {/* Match reason banner */}
          {activeMatch.reason && (
            <div className="px-5 py-2 bg-accent-light/60 border-b border-accent/10 flex items-center gap-2 flex-shrink-0">
              <Sparkles size={11} className="text-accent flex-shrink-0" />
              <p className="text-[11px] text-accent/80 leading-relaxed line-clamp-1">
                <span className="font-semibold">Why you matched:</span> {activeMatch.reason}
              </p>
            </div>
          )}

          {/* Message feed */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-[#F8F7F4] no-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-border flex items-center justify-center">
                  <MessageSquare size={22} className="text-text-muted" />
                </div>
                <p className="text-sm font-semibold text-text-primary">Start the conversation</p>
                <p className="text-xs text-text-muted max-w-[220px] leading-relaxed">
                  You and {other?.name} are connected. Say hello and explore how you can collaborate.
                </p>
              </div>
            ) : (
              grouped.map((item, i) => {
                if (item.type === 'separator') {
                  return (
                    <div key={`sep-${i}`} className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-text-muted font-medium px-2">{item.label}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )
                }

                const { msg, isFirst } = item
                const mine = isMine(msg)
                const senderInitial = mine
                  ? (current.name?.[0] ?? 'Y').toUpperCase()
                  : (msg.sender?.name ?? other?.name ?? '?')[0].toUpperCase()

                return (
                  <div key={msg._id ?? i} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${isFirst ? 'mt-3' : 'mt-0.5'}`}>
                    {/* Avatar — only show on first in group */}
                    <div className={`w-7 h-7 rounded-full font-bold text-[10px] flex items-center justify-center flex-shrink-0 transition-opacity ${
                      mine ? 'bg-accent text-white' : 'bg-white border border-border text-accent'
                    } ${isFirst ? 'opacity-100' : 'opacity-0'}`}>
                      {senderInitial}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[60%] group ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {isFirst && !mine && (
                        <span className="text-[10px] text-text-muted mb-1 ml-1">
                          {msg.sender?.name ?? other?.name}
                        </span>
                      )}
                      <div className={`px-3.5 py-2 text-sm leading-relaxed ${
                        mine
                          ? 'bg-accent text-white rounded-2xl rounded-br-sm'
                          : 'bg-white border border-border text-text-primary rounded-2xl rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className={`text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                        mine ? 'text-text-muted text-right mr-1' : 'text-text-muted ml-1'
                      }`}>
                        {fmtTime(msg.createdAt ?? Date.now())}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-border bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  className="w-full bg-[#F8F7F4] border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all pr-16"
                  placeholder={`Message ${other?.name ?? ''}…`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted select-none">
                  ↵ send
                </span>
              </div>
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0 hover:scale-105 active:scale-95"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── No conversation selected ─────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-[#F8F7F4]">
          <div className="w-20 h-20 rounded-3xl bg-white border border-border flex items-center justify-center shadow-sm">
            <MessageSquare size={32} className="text-text-muted" />
          </div>
          <div>
            <p className="font-bold text-text-primary text-lg">Your messages</p>
            <p className="text-sm text-text-muted mt-1 max-w-xs leading-relaxed">
              {matches.length > 0
                ? 'Select a conversation from the left to start messaging your connections.'
                : 'Accept a match on your dashboard to unlock B2B messaging.'}
            </p>
          </div>
          {matches.length === 0 && (
            <button onClick={() => navigate('/my-dashboard')} className="btn-primary mt-1 flex items-center gap-2">
              View My Matches <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
