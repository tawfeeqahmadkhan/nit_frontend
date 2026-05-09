import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Mail, RefreshCw, Loader2 } from 'lucide-react'
import { businessApi } from '../api/businessApi'
import { CategoryBadge, TagBadge, ScoreBadge } from '../components/TagBadge'
import MatchCard from '../components/MatchCard'
import { useToast } from '../components/Toast'
import { useBusiness } from '../context/BusinessContext'

export default function BusinessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { current } = useBusiness()

  // Use current business as perspective if viewing own profile, else use the page id
  const perspective = current?._id?.toString() || id

  const [business, setBusiness] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [rematching, setRematching] = useState(false)

  async function load() {
    try {
      const [bRes, mRes] = await Promise.all([
        businessApi.get(id),
        businessApi.getMatches(id)
      ])
      setBusiness(bRes.data)
      setMatches(mRes.data)
    } catch {
      toast('Failed to load business', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function rematch() {
    setRematching(true)
    try {
      await businessApi.rematch(id)
      toast('Re-matching started. Check back shortly!', 'info')
    } catch {
      toast('Rematch failed', 'error')
    } finally {
      setRematching(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-accent" size={24} />
    </div>
  )

  if (!business) return (
    <div className="text-center py-16 text-text-muted">Business not found.</div>
  )

  const internalMatches = matches.filter(m => m.match_type === 'internal')
  const externalMatches = business.external_matches || []

  return (
    <div className="max-w-4xl space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Business header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-light text-accent font-bold text-xl flex items-center justify-center flex-shrink-0">
              {business.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{business.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <MapPin size={11} /> {business.address}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Mail size={11} /> {business.owner_email}
                </span>
              </div>
              <div className="mt-2">
                <CategoryBadge category={business.ai_tags?.category} />
              </div>
            </div>
          </div>
          <button
            onClick={rematch}
            disabled={rematching}
            className="btn-ghost flex items-center gap-1.5 border border-border text-xs"
          >
            {rematching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Re-match
          </button>
        </div>

        {/* Services and Challenges */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50/40 rounded-xl border border-green-100">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2.5">Services Offered</p>
            <div className="flex flex-wrap gap-1.5">
              {business.services.map(s => <TagBadge key={s} tag={s} variant="solution" />)}
            </div>
          </div>
          <div className="p-4 bg-red-50/40 rounded-xl border border-red-100">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2.5">Challenges</p>
            <div className="flex flex-wrap gap-1.5">
              {business.challenges.map(c => <TagBadge key={c} tag={c} variant="problem" />)}
            </div>
          </div>
        </div>

        {/* AI Tags */}
        {business.ai_tags?.solution_keywords?.length > 0 && (
          <div className="mt-4 p-3 bg-bg rounded-xl border border-border">
            <p className="text-xs text-text-muted uppercase font-semibold tracking-wider mb-2">AI Solution Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {business.ai_tags.solution_keywords.map(k => <TagBadge key={k} tag={k} />)}
            </div>
          </div>
        )}
      </div>

      {/* Internal matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">
            Internal Matches
            <span className="ml-2 text-xs font-normal text-text-muted">({internalMatches.length})</span>
          </h2>
        </div>
        {internalMatches.length === 0 ? (
          <div className="card p-8 text-center text-text-muted text-sm">
            No internal matches yet. Try re-matching or add more businesses.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {internalMatches.map(m => (
              <MatchCard key={m._id} match={m} perspective={perspective} onUpdate={load} />
            ))}
          </div>
        )}
      </div>

      {/* External matches */}
      {externalMatches.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-3">
            Found Online
            <span className="ml-2 text-xs font-normal text-text-muted">via web search</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {externalMatches.map((m, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {m.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{m.name}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">Web</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mb-3 line-clamp-2">{m.summary}</p>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline break-all">
                  {m.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
