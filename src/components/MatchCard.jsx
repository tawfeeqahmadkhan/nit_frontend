import { ArrowRight, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import { CategoryBadge, ScoreBadge } from './TagBadge'
import { matchApi } from '../api/businessApi'
import { useState } from 'react'

const STATUS_ICON = {
  pending:  <Clock size={13} className="text-warning" />,
  accepted: <CheckCircle size={13} className="text-success" />,
  rejected: <XCircle size={13} className="text-text-muted" />,
}

export default function MatchCard({ match, perspective, onUpdate }) {
  const [loading, setLoading] = useState(null)

  const pStr = perspective?.toString()
  const aId  = match.business_a?._id?.toString() || match.business_a?.toString()
  const other = aId === pStr ? match.business_b : match.business_a

  async function handleAction(action) {
    setLoading(action)
    try {
      if (action === 'accept') await matchApi.accept(match._id)
      else await matchApi.reject(match._id)
      onUpdate?.()
    } finally {
      setLoading(null)
    }
  }

  const isExternal = match.match_type === 'external'

  return (
    <div className={`card p-4 hover:shadow-card-md transition-shadow ${match.status === 'rejected' ? 'opacity-50' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-light text-accent font-bold text-sm flex-shrink-0">
            {(other?.name || 'E')[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{other?.name || 'External Business'}</p>
            <p className="text-xs text-text-muted truncate">{other?.address || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreBadge score={match.score} />
          {isExternal && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
              Web
            </span>
          )}
        </div>
      </div>

      {/* Category */}
      {other?.ai_tags?.category && (
        <div className="mb-2.5">
          <CategoryBadge category={other.ai_tags.category} />
        </div>
      )}

      {/* Reason */}
      <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">
        {match.reason}
      </p>

      {/* Score bar */}
      <div className="h-1.5 bg-bg rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${Math.round(match.score * 100)}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          {STATUS_ICON[match.status]}
          <span className="capitalize">{match.status}</span>
        </div>

        {match.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('reject')}
              disabled={!!loading}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg transition-colors"
            >
              {loading === 'reject' ? '...' : 'Dismiss'}
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={!!loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors flex items-center gap-1"
            >
              {loading === 'accept' ? '...' : (<>Connect <ArrowRight size={11} /></>)}
            </button>
          </div>
        )}

        {match.status === 'accepted' && (
          <button className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 flex items-center gap-1 hover:bg-green-100 transition-colors">
            Message <ArrowRight size={11} />
          </button>
        )}

        {isExternal && other?.url && (
          <a
            href={other.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent flex items-center gap-1 hover:underline"
          >
            View <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  )
}
