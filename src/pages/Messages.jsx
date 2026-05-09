import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { matchApi, messageApi } from '../api/businessApi'
import { ScoreBadge } from '../components/TagBadge'
import { Send, Loader2, MessageSquare, UserCircle } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useToast } from '../components/Toast'
import { useBusiness } from '../context/BusinessContext'

export default function Messages() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const socket = useSocket()
  const { current } = useBusiness()

  const myId = current?._id?.toString()

  const [matches, setMatches] = useState([])
  const [messages, setMessages] = useState([])
  const [activeMatch, setActiveMatch] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useSocket({
    new_message: (data) => {
      if (data.match_id === activeMatch?._id) {
        setMessages(prev => [...prev, data.message])
      }
    }
  })

  useEffect(() => {
    matchApi.list({ status: 'accepted' })
      .then(res => {
        // Filter to only matches that involve the current business
        const mine = myId
          ? res.data.filter(m => {
              const aId = m.business_a?._id?.toString() || m.business_a?.toString()
              const bId = m.business_b?._id?.toString() || m.business_b?.toString()
              return aId === myId || bId === myId
            })
          : res.data
        setMatches(mine)
      })
      .catch(() => toast('Failed to load conversations', 'error'))
  }, [myId])

  useEffect(() => {
    if (!activeMatch) return
    socket?.emit('join_match', activeMatch._id)
    messageApi.thread(activeMatch._id)
      .then(res => setMessages(res.data))
      .catch(() => toast('Failed to load messages', 'error'))
    return () => socket?.emit('leave_match', activeMatch._id)
  }, [activeMatch?._id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (matchId && matches.length) {
      const m = matches.find(m => m._id === matchId)
      if (m) setActiveMatch(m)
    }
  }, [matchId, matches])

  async function send() {
    if (!input.trim() || !activeMatch || !myId) return
    setSending(true)
    try {
      const res = await messageApi.send({
        match_id: activeMatch._id,
        sender: myId,
        content: input.trim()
      })
      setMessages(prev => [...prev, res.data])
      setInput('')
    } catch {
      toast('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  function getOther(match) {
    if (!myId) return match.business_b || match.business_a
    const aId = match.business_a?._id?.toString() || match.business_a?.toString()
    return aId === myId ? match.business_b : match.business_a
  }

  function isMine(msg) {
    if (!myId) return false
    const senderId = msg.sender?._id?.toString() || msg.sender?.toString()
    return senderId === myId
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <UserCircle size={32} className="text-text-muted" />
        <p className="text-text-secondary font-medium">No business selected</p>
        <button onClick={() => navigate('/select')} className="btn-primary">Select Your Business</button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 card overflow-hidden">
      {/* Left: match list */}
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Conversations</h2>
          <p className="text-xs text-text-muted">{matches.length} active connections</p>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
              <MessageSquare size={24} className="text-text-muted" />
              <p className="text-xs text-text-muted">
                No accepted matches yet.<br />
                Accept matches to start conversations.
              </p>
              <button onClick={() => navigate('/my-dashboard')} className="btn-primary text-xs">
                View My Matches
              </button>
            </div>
          ) : (
            matches.map(m => {
              const other = getOther(m)
              const isActive = activeMatch?._id === m._id
              return (
                <button
                  key={m._id}
                  onClick={() => setActiveMatch(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-bg transition-colors text-left ${
                    isActive ? 'bg-accent-light' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-accent text-white' : 'bg-accent-light text-accent'
                  }`}>
                    {(other?.name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                      {other?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-text-muted truncate">{m.reason?.slice(0, 40)}...</p>
                  </div>
                  <ScoreBadge score={m.score} />
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right: chat area */}
      {activeMatch ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-accent-light text-accent font-bold text-sm flex items-center justify-center">
              {(getOther(activeMatch)?.name || '?')[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{getOther(activeMatch)?.name}</p>
              <p className="text-xs text-text-muted line-clamp-1">{activeMatch.reason}</p>
            </div>
            <div className="ml-auto">
              <ScoreBadge score={activeMatch.score} />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-bg/40">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <p className="text-sm text-text-muted">Start the conversation!</p>
                <p className="text-xs text-text-muted">
                  You matched with {getOther(activeMatch)?.name}.<br />
                  Introduce yourself and explore collaboration.
                </p>
              </div>
            )}
            {messages.map((msg, i) => {
              const mine = isMine(msg)
              return (
                <div key={msg._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && (
                    <div className="w-6 h-6 rounded-full bg-accent-light text-accent font-bold text-[10px] flex items-center justify-center mr-2 flex-shrink-0 self-end">
                      {(msg.sender?.name || getOther(activeMatch)?.name || '?')[0]}
                    </div>
                  )}
                  <div className={`max-w-[68%] px-4 py-2.5 rounded-2xl text-sm ${
                    mine
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-surface border border-border text-text-primary rounded-bl-sm'
                  }`}>
                    {!mine && msg.sender?.name && (
                      <p className="text-[10px] font-semibold mb-1 opacity-50">{msg.sender.name}</p>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/50' : 'text-text-muted'}`}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {mine && (
                    <div className="w-6 h-6 rounded-full bg-accent text-white font-bold text-[10px] flex items-center justify-center ml-2 flex-shrink-0 self-end">
                      {current.name?.[0]}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-3 border-t border-border bg-surface">
            <div className="flex items-center gap-3">
              <input
                className="input flex-1"
                placeholder={`Message ${getOther(activeMatch)?.name || ''}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <MessageSquare size={32} className="text-text-muted" />
          <p className="text-text-secondary font-medium">Select a conversation</p>
          <p className="text-sm text-text-muted">Choose from your accepted matches on the left</p>
        </div>
      )}
    </div>
  )
}
