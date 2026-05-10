import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { businessApi, messageApi } from '../api/businessApi'
import { ScoreBadge } from '../components/TagBadge'
import { Send, Loader2, MessageSquare, Lock, ArrowRight, CheckCircle } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useToast } from '../components/Toast'
import { useBusiness } from '../context/BusinessContext'

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

  const bottomRef     = useRef(null)
  const activeIdRef   = useRef(null)   // avoids stale closure in socket handler
  const inputRef      = useRef(null)

  // ── Single socket call — owns the new_message handler ─────────────────────
  const socket = useSocket({
    new_message: (data) => {
      if (data.match_id === activeIdRef.current) {
        setMessages(prev => [...prev, data.message])
      }
    },
  }, myId)

  // Keep ref in sync with state
  useEffect(() => {
    activeIdRef.current = activeMatch?._id?.toString() ?? null
  }, [activeMatch?._id])

  // ── Load accepted matches for current business ──────────────────────────
  useEffect(() => {
    if (!myId) return
    setLoading(true)
    businessApi.getMatches(myId)
      .then(res => {
        const accepted = res.data.filter(m => m.status === 'accepted')
        setMatches(accepted)
        // Auto-select from URL param
        if (urlMatchId) {
          const found = accepted.find(m => m._id === urlMatchId)
          if (found) setActiveMatch(found)
        }
      })
      .catch(() => toast('Failed to load conversations', 'error'))
      .finally(() => setLoading(false))
  }, [myId, urlMatchId])

  // ── Load thread + join socket room when active match changes ───────────
  useEffect(() => {
    if (!activeMatch?._id) return

    const mid = activeMatch._id

    // join the socket room (socket may not be connected yet — retry once ready)
    function joinRoom() {
      socket?.emit('join_match', mid)
    }
    joinRoom()

    messageApi.thread(mid)
      .then(res => setMessages(res.data))
      .catch(() => toast('Failed to load messages', 'error'))

    return () => {
      socket?.emit('leave_match', mid)
    }
  }, [activeMatch?._id])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Helpers ────────────────────────────────────────────────────────────
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

  // ── Guards ─────────────────────────────────────────────────────────────
  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center">
          <Lock size={22} className="text-accent" />
        </div>
        <p className="text-text-primary font-semibold">Sign in to view messages</p>
        <p className="text-sm text-text-muted">You need to be signed in as a business to message your matches.</p>
        <button onClick={() => navigate('/login')} className="btn-primary flex items-center gap-2">
          Sign In <ArrowRight size={14} />
        </button>
      </div>
    )
  }

  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] card overflow-hidden">

      {/* ── Left: conversation list ── */}
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Messages</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {loading ? 'Loading…' : `${matches.length} accepted connection${matches.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 size={18} className="animate-spin text-text-muted" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <MessageSquare size={24} className="text-text-muted" />
              <p className="text-xs text-text-muted leading-relaxed">
                No accepted matches yet.<br />Accept a match to unlock messaging.
              </p>
              <button onClick={() => navigate('/my-dashboard')} className="btn-primary text-xs px-4 py-2">
                View My Matches
              </button>
            </div>
          ) : (
            matches.map(m => {
              const other    = getOther(m)
              const isActive = activeMatch?._id === m._id
              return (
                <button
                  key={m._id}
                  onClick={() => selectMatch(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-bg transition-colors text-left ${isActive ? 'bg-accent-light' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-accent text-white' : 'bg-accent-light text-accent'}`}>
                    {(other?.name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                      {other?.name ?? 'Unknown'}
                    </p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {m.reason?.slice(0, 42) ?? 'AI match'}
                    </p>
                  </div>
                  <ScoreBadge score={m.score} />
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: chat area ── */}
      {activeMatch ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-accent-light text-accent font-bold text-sm flex items-center justify-center flex-shrink-0">
              {(getOther(activeMatch)?.name ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary">{getOther(activeMatch)?.name}</p>
              <p className="text-[11px] text-text-muted flex items-center gap-1">
                <CheckCircle size={9} className="text-green-500" /> Connected · {activeMatch.reason?.slice(0, 50)}
              </p>
            </div>
            <ScoreBadge score={activeMatch.score} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-bg/50 no-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-70">
                <MessageSquare size={28} className="text-text-muted" />
                <p className="text-sm font-medium text-text-muted">Say hello!</p>
                <p className="text-xs text-text-muted max-w-xs">
                  You're connected with {getOther(activeMatch)?.name}. Start the conversation.
                </p>
              </div>
            )}
            {messages.map((msg, i) => {
              const mine = isMine(msg)
              return (
                <div key={msg._id ?? i} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center flex-shrink-0 ${mine ? 'bg-accent text-white' : 'bg-accent-light text-accent'}`}>
                    {mine
                      ? (current.name?.[0] ?? 'Y').toUpperCase()
                      : (msg.sender?.name ?? getOther(activeMatch)?.name ?? '?')[0].toUpperCase()
                    }
                  </div>
                  <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    mine
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-surface border border-border text-text-primary rounded-bl-sm'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/50' : 'text-text-muted'}`}>
                      {new Date(msg.createdAt ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border bg-surface flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                className="input flex-1"
                placeholder={`Message ${getOther(activeMatch)?.name ?? ''}…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mb-2">
            <MessageSquare size={26} className="text-accent" />
          </div>
          <p className="font-semibold text-text-primary">Select a conversation</p>
          <p className="text-sm text-text-muted max-w-xs">
            {matches.length > 0
              ? 'Choose a connection from the left to start messaging.'
              : 'Accept matches on your dashboard to unlock messaging.'}
          </p>
          {matches.length === 0 && (
            <button onClick={() => navigate('/my-dashboard')} className="btn-primary mt-2 flex items-center gap-2">
              Go to Dashboard <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
