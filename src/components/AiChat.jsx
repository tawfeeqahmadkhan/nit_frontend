import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Bot, User, ChevronDown, Sparkles } from 'lucide-react'
import { chatApi } from '../api/businessApi'

const SUGGESTIONS = [
  'How do I get better matches?',
  'How does AI matching work?',
  'What should I write in challenges?',
  'How to connect with a matched business?',
  'What is the 3D network graph?',
]

function Message({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <div className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-accent text-white' : 'bg-bg border border-border text-text-muted'}`}>
        {isBot ? <Bot size={14} /> : <User size={13} />}
      </div>
      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isBot
          ? 'bg-surface border border-border text-text-primary rounded-tl-sm'
          : 'bg-accent text-white rounded-tr-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function AiChat() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([
    { role: 'assistant', content: "Hi! I'm SolveBot 👋\nI can help you use SolveNet, improve your business profile, or answer any B2B questions. What would you like to know?" }
  ])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    setHistory(h => [...h, userMsg])
    setLoading(true)

    try {
      const res = await chatApi.send(msg, history)
      setHistory(h => [...h, { role: 'assistant', content: res.data.reply }])
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-32 right-6 z-50 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all ${
          open ? 'bg-text-primary text-white rotate-0 scale-95' : 'bg-accent text-white hover:bg-accent-hover hover:scale-105'
        }`}
        title="Ask SolveBot"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[520px] bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-accent text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">SolveBot</p>
              <p className="text-[10px] text-white/70">AI assistant · Powered by Groq</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bg/40">
            {history.map((msg, i) => <Message key={i} msg={msg} />)}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-accent text-white flex items-center justify-center flex-shrink-0">
                  <Bot size={14} />
                </div>
                <div className="px-3.5 py-2.5 bg-surface border border-border rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — only show when just the greeting is visible */}
          {history.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0 bg-bg/40">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-surface border border-border text-text-secondary hover:border-accent/40 hover:text-accent transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-border flex-shrink-0 bg-surface">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 resize-none bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="Ask SolveBot anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                style={{ maxHeight: 80 }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
