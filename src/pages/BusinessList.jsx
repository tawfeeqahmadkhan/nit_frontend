import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Building2 } from 'lucide-react'
import { businessApi } from '../api/businessApi'
import { CategoryBadge, TagBadge } from '../components/TagBadge'
import { useToast } from '../components/Toast'

export default function BusinessList() {
  const navigate = useNavigate()
  const toast = useToast()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    businessApi.list({ limit: 100 })
      .then(res => setBusinesses(res.data))
      .catch(() => toast('Failed to load businesses', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = businesses.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.ai_tags?.category?.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Businesses</h1>
          <p className="text-sm text-text-muted mt-0.5">{businesses.length} registered on the platform</p>
        </div>
        <button onClick={() => navigate('/register')} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Post Business
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="input pl-8 max-w-sm"
          placeholder="Search by name, industry, location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(b => (
            <div
              key={b._id}
              onClick={() => navigate(`/businesses/${b._id}`)}
              className="card p-4 hover:shadow-card-md hover:border-accent/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-light text-accent font-bold text-base flex items-center justify-center flex-shrink-0">
                  {b.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{b.name}</p>
                  <p className="text-xs text-text-muted truncate">{b.address}</p>
                </div>
              </div>
              <CategoryBadge category={b.ai_tags?.category} />
              {b.ai_tags?.solution_keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {b.ai_tags.solution_keywords.slice(0, 3).map(k => (
                    <TagBadge key={k} tag={k} />
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {b.matched_businesses?.length || 0} matches
                </span>
                <span className="text-xs text-accent font-medium">View →</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-text-muted">
              <Building2 size={28} className="mx-auto mb-3 opacity-40" />
              <p>No businesses found. Post the first one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
