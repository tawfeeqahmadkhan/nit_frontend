import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, MapPin, Mail, RefreshCw, Network, MessageSquare,
  Loader2, ChevronRight, ExternalLink, AlertCircle, CheckCircle, Clock
} from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'
import { businessApi, matchApi } from '../api/businessApi'
import { CategoryBadge, TagBadge, ScoreBadge } from '../components/TagBadge'
import { useSocket } from '../hooks/useSocket'
import { useToast } from '../components/Toast'

/* ─── Connection Row ──────────────────────────────────────────────────────── */
function ConnectionRow({ label, type, matches, onAccept, onReject }) {
  const navigate = useNavigate()
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-start gap-4">
        {/* Problem / Service pill */}
        <div className={`flex-shrink-0 w-[220px] px-3 py-2.5 rounded-xl border text-xs font-medium leading-relaxed ${
          type === 'problem'
            ? 'bg-red-50 border-red-100 text-red-700'
            : 'bg-green-50 border-green-100 text-green-700'
        }`}>
          {label}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center self-stretch justify-center flex-shrink-0">
          <div className="w-8 h-px bg-border" />
          <ChevronRight size={14} className="text-text-muted -ml-1" />
        </div>

        {/* Matched businesses */}
        <div className="flex-1 flex flex-wrap gap-2">
          {matches.length === 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-text-muted">
              <AlertCircle size={11} /> No match yet
            </div>
          ) : (
            matches.map(m => {
              const STATUS_STYLE = {
                accepted: 'border-green-200 bg-green-50',
                rejected: 'border-gray-200 bg-gray-50 opacity-50',
                pending:  'border-border bg-surface hover:border-accent/30 hover:shadow-card',
              }
              return (
                <div
                  key={m._id}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${STATUS_STYLE[m.status] || STATUS_STYLE.pending}`}
                  onClick={() => navigate(`/businesses/${m.other._id}`)}
                >
                  <div className="w-6 h-6 rounded-lg bg-accent-light text-accent font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {m.other.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary leading-tight">{m.other.name}</p>
                    <p className="text-[10px] text-text-muted">{m.other.address?.split(',')[0]}</p>
                  </div>
                  <ScoreBadge score={m.score} />
                  {m.status === 'pending' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); onAccept(m._id) }}
                        className="p-1 rounded-lg bg-accent text-white hover:bg-accent-hover"
                        title="Accept"
                      >
                        <CheckCircle size={11} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onReject(m._id) }}
                        className="p-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {m.status === 'accepted' && (
                    <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
                  )}
                </div>
              )
            })
          )}
          {/* External matches inline */}
          {type === 'problem' && matches.length === 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-100 bg-blue-50 text-xs text-blue-600">
              🌐 Web search ran — see below
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function MyDashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const { current: biz, refreshCurrent } = useBusiness()

  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [rematching, setRematching] = useState(false)

  const load = useCallback(async () => {
    if (!biz?._id) return
    try {
      const [mRes, bRes] = await Promise.all([
        businessApi.getMatches(biz._id),
        businessApi.get(biz._id)
      ])
      setMatches(mRes.data)
      // sync fresh data silently
      refreshCurrent()
    } catch {
      toast('Failed to load your dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }, [biz?._id])

  useEffect(() => { load() }, [load])

  useSocket({
    new_match: (data) => {
      if (data.business_a === biz?._id || data.business_b === biz?._id) {
        toast('New match found! 🎉', 'success')
        load()
      }
    },
    match_accepted: () => load()
  })

  async function handleAccept(matchId) {
    await matchApi.accept(matchId)
    toast('Connection accepted!', 'success')
    load()
  }
  async function handleReject(matchId) {
    await matchApi.reject(matchId)
    load()
  }

  async function rematch() {
    setRematching(true)
    try {
      await businessApi.rematch(biz._id)
      toast('AI is searching for new matches...', 'info')
    } catch {
      toast('Rematch failed', 'error')
    } finally {
      setRematching(false)
    }
  }

  if (!biz) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle size={32} className="text-text-muted" />
        <p className="text-text-secondary font-medium">No business selected</p>
        <button onClick={() => navigate('/select')} className="btn-primary">Select Your Business</button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    )
  }

  /* ── derive per-challenge / per-service match lists ── */
  const myId = biz._id?.toString()

  function sameId(field) {
    return field?._id?.toString() === myId || field?.toString() === myId
  }

  function getMatchOther(m) {
    return sameId(m.business_a) ? m.business_b : m.business_a
  }

  const internalMatches = matches.filter(m => m.match_type === 'internal' && m.status !== 'rejected')
  const acceptedMatches = matches.filter(m => m.status === 'accepted')
  const pendingMatches  = matches.filter(m => m.status === 'pending')

  // Matches where I have the problem (other solves it)
  const problemSideMatches = internalMatches
    .filter(m => m.problem_side?.toString() === myId)
    .map(m => ({ ...m, other: getMatchOther(m) }))

  // Matches where I provide the solution (other has the problem)
  const solutionSideMatches = internalMatches
    .filter(m => m.solution_side?.toString() === myId)
    .map(m => ({ ...m, other: getMatchOther(m) }))

  // Fallback: if problem_side/solution_side not set, split by position
  const unclassified = internalMatches
    .filter(m => !m.problem_side && !m.solution_side)
    .map(m => ({ ...m, other: getMatchOther(m) }))

  // Map challenges → relevant problem-side matches (by keyword overlap with reason)
  const challengeConnections = (biz.challenges || []).map(challenge => {
    const words = challenge.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const pool = [...problemSideMatches, ...unclassified]
    const relevant = pool.filter(m => {
      const reason = m.reason?.toLowerCase() || ''
      const solKw = (m.other?.ai_tags?.solution_keywords || []).join(' ').toLowerCase()
      return words.some(w => reason.includes(w) || solKw.includes(w))
    })
    return { challenge, matches: relevant }
  })
  // Fallback: if every row is empty, pour all problem-side matches into the first row
  if (challengeConnections.length > 0 && challengeConnections.every(c => c.matches.length === 0) && problemSideMatches.length > 0) {
    challengeConnections[0].matches = problemSideMatches
  }

  // Map services → relevant solution-side matches
  const serviceConnections = (biz.services || []).map(service => {
    const words = service.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const pool = [...solutionSideMatches, ...unclassified]
    const relevant = pool.filter(m => {
      const reason = m.reason?.toLowerCase() || ''
      const probKw = (m.other?.ai_tags?.problem_keywords || []).join(' ').toLowerCase()
      return words.some(w => reason.includes(w) || probKw.includes(w))
    })
    return { service, matches: relevant }
  })
  if (serviceConnections.length > 0 && serviceConnections.every(s => s.matches.length === 0) && solutionSideMatches.length > 0) {
    serviceConnections[0].matches = solutionSideMatches
  }

  const externalMatches = biz.external_matches || []

  return (
    <div className="space-y-5 max-w-[1100px]">

      {/* ── Business Profile Card (dark) ── */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 card-dark p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-white font-extrabold text-2xl flex items-center justify-center flex-shrink-0">
                {biz.name?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{biz.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <MapPin size={10} /> {biz.address}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Mail size={10} /> {biz.owner_email}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                    {biz.ai_tags?.category || 'Uncategorized'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={rematch}
              disabled={rematching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              {rematching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Re-match AI
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-[10px] text-white/30 uppercase font-semibold tracking-wider mb-1.5">What I offer</p>
              <div className="flex flex-wrap gap-1">
                {(biz.services || []).slice(0, 4).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-green-500/20 text-green-300 font-medium">{s}</span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-[10px] text-white/30 uppercase font-semibold tracking-wider mb-1.5">What I need</p>
              <div className="flex flex-wrap gap-1">
                {(biz.challenges || []).slice(0, 4).map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 font-medium">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats column */}
        <div className="col-span-4 grid grid-rows-3 gap-3">
          <div className="card p-4 flex flex-col justify-between">
            <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Total Matches</p>
            <p className="text-3xl font-bold text-text-primary">{internalMatches.length}</p>
            <p className="text-xs text-text-muted">AI found internally</p>
          </div>
          <div className="card p-4 flex flex-col justify-between">
            <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Connected</p>
            <p className="text-3xl font-bold text-success">{acceptedMatches.length}</p>
            <p className="text-xs text-text-muted">accepted collaborations</p>
          </div>
          <div className="card p-4 flex flex-col justify-between">
            <p className="text-xs text-text-muted uppercase font-semibold tracking-wider">Pending</p>
            <p className="text-3xl font-bold text-warning">{pendingMatches.length}</p>
            <p className="text-xs text-text-muted">awaiting your response</p>
          </div>
        </div>
      </div>

      {/* ── Problem → Solution Connections ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">My Problems → Solutions Found</h2>
            <p className="text-xs text-text-muted mt-0.5">Each challenge mapped to businesses that can solve it</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium border border-red-100">
            {(biz.challenges || []).length} challenges
          </span>
        </div>

        {challengeConnections.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No challenges posted yet.</p>
        ) : (
          <div className="space-y-3">
            {challengeConnections.map(({ challenge, matches: m }) => (
              <ConnectionRow
                key={challenge}
                label={challenge}
                type="problem"
                matches={m}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Service → Needs Connections ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">My Services → Businesses That Need Me</h2>
            <p className="text-xs text-text-muted mt-0.5">Businesses whose problems I can solve</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-600 font-medium border border-green-100">
            {(biz.services || []).length} services
          </span>
        </div>

        {serviceConnections.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No services posted yet.</p>
        ) : (
          <div className="space-y-3">
            {serviceConnections.map(({ service, matches: m }) => (
              <ConnectionRow
                key={service}
                label={service}
                type="service"
                matches={m}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── All Matches Grid ── */}
      {internalMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">
              All My Matches
              <span className="ml-2 text-xs font-normal text-text-muted">({internalMatches.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/network')}
                className="btn-ghost text-xs flex items-center gap-1.5 border border-border"
              >
                <Network size={12} /> View in 3D Network
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="btn-ghost text-xs flex items-center gap-1.5 border border-border"
              >
                <MessageSquare size={12} /> Messages
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {internalMatches.map(m => {
              const other = getMatchOther(m)
              return (
                <div
                  key={m._id}
                  className={`card p-4 transition-all hover:shadow-card-md ${
                    m.status === 'accepted' ? 'border-green-200' :
                    m.status === 'rejected' ? 'opacity-50' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-light text-accent font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {(other?.name || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        onClick={() => navigate(`/businesses/${other?._id}`)}
                        className="text-sm font-semibold text-text-primary truncate cursor-pointer hover:text-accent transition-colors"
                      >
                        {other?.name || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">{other?.address}</p>
                    </div>
                    <ScoreBadge score={m.score} />
                  </div>

                  <CategoryBadge category={other?.ai_tags?.category} />

                  <p className="text-xs text-text-secondary mt-2.5 mb-3 line-clamp-2 leading-relaxed">
                    {m.reason}
                  </p>

                  {/* Score bar */}
                  <div className="h-1 bg-bg rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${Math.round(m.score * 100)}%` }} />
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      {m.status === 'accepted' ? <CheckCircle size={11} className="text-success" /> :
                       m.status === 'pending'  ? <Clock size={11} className="text-warning" /> : null}
                      <span className="capitalize">{m.status}</span>
                    </div>
                    {m.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleReject(m._id)}
                          className="text-xs px-2 py-1 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-bg transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleAccept(m._id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
                        >
                          Connect →
                        </button>
                      </div>
                    )}
                    {m.status === 'accepted' && (
                      <button
                        onClick={() => navigate('/messages')}
                        className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors flex items-center gap-1"
                      >
                        <MessageSquare size={10} /> Chat
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── External Matches ── */}
      {externalMatches.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Found Online</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
              🌐 Web Search Results
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {externalMatches.map((m, i) => (
              <div key={i} className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">
                    {m.name?.[0] || '?'}
                  </div>
                  <p className="text-sm font-semibold text-text-primary truncate">{m.name}</p>
                </div>
                <p className="text-xs text-text-secondary mb-3 line-clamp-2">{m.summary}</p>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  Visit <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {internalMatches.length === 0 && externalMatches.length === 0 && (
        <div className="card p-10 text-center">
          <Network size={32} className="mx-auto text-text-muted mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">No matches yet</h3>
          <p className="text-xs text-text-muted mb-4">AI hasn't found matches yet. Try re-matching or add more businesses to the platform.</p>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={rematch} className="btn-primary flex items-center gap-1.5">
              <RefreshCw size={13} /> Run AI Matching
            </button>
            <button onClick={() => navigate('/businesses')} className="btn-ghost border border-border">
              Browse Businesses
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
